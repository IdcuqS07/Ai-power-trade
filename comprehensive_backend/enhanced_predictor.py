"""
Enhanced AI Predictor combining LSTM, ML, and CoinGecko data
Provides improved predictions with confidence visualization
"""

import numpy as np
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from lstm_predictor import lstm_predictor
    from ml_predictor import ml_predictor
    from coingecko_api import coingecko_api
    MODULES_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Could not import modules: {e}")
    MODULES_AVAILABLE = False

try:
    from sosovalue_service import sosovalue_service
    SOSOVALUE_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Could not import SoSoValue service: {e}")
    SOSOVALUE_AVAILABLE = False


class EnhancedPredictor:
    """Enhanced predictor combining multiple AI models and data sources"""
    
    def __init__(self):
        self.lstm = lstm_predictor if MODULES_AVAILABLE else None
        self.ml = ml_predictor if MODULES_AVAILABLE else None
        self.coingecko = coingecko_api if MODULES_AVAILABLE else None
        self.sosovalue = sosovalue_service if SOSOVALUE_AVAILABLE else None
        
        # Confidence thresholds for color coding
        self.CONFIDENCE_THRESHOLDS = {
            'high': 0.75,      # Green
            'medium': 0.60,    # Yellow
            'low': 0.0         # Red
        }
        self.SOURCE_WEIGHTS = {
            'LSTM': 0.35,
            'Random Forest': 0.30,
            'Market Sentiment': 0.20,
            'SoSoValue Research': 0.15
        }
    
    def get_confidence_color(self, confidence: float) -> str:
        """Get color code based on confidence score"""
        if confidence >= self.CONFIDENCE_THRESHOLDS['high']:
            return 'green'
        elif confidence >= self.CONFIDENCE_THRESHOLDS['medium']:
            return 'yellow'
        else:
            return 'red'
    
    def get_confidence_level(self, confidence: float) -> str:
        """Get confidence level label"""
        if confidence >= self.CONFIDENCE_THRESHOLDS['high']:
            return 'HIGH'
        elif confidence >= self.CONFIDENCE_THRESHOLDS['medium']:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def calculate_technical_indicators(self, prices: List[float]) -> Dict:
        """Calculate technical indicators from price history"""
        if len(prices) < 20:
            return {}
        
        prices_array = np.array(prices)
        
        # RSI
        deltas = np.diff(prices_array)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        avg_gain = np.mean(gains[-14:]) if len(gains) >= 14 else 0
        avg_loss = np.mean(losses[-14:]) if len(losses) >= 14 else 0
        rs = avg_gain / (avg_loss + 0.0001)
        rsi = 100 - (100 / (1 + rs))
        
        # Moving Averages
        ma_5 = np.mean(prices_array[-5:])
        ma_20 = np.mean(prices_array[-20:])
        
        # MACD
        ema_12 = self._calculate_ema(prices_array, 12)
        ema_26 = self._calculate_ema(prices_array, 26)
        macd = ema_12 - ema_26
        
        # Bollinger Bands
        bb_middle = ma_20
        bb_std = np.std(prices_array[-20:])
        bb_upper = bb_middle + (2 * bb_std)
        bb_lower = bb_middle - (2 * bb_std)
        
        # Volatility
        volatility = np.std(prices_array[-20:]) / np.mean(prices_array[-20:])
        
        return {
            'rsi': float(rsi),
            'ma_5': float(ma_5),
            'ma_20': float(ma_20),
            'macd': float(macd),
            'bb_upper': float(bb_upper),
            'bb_middle': float(bb_middle),
            'bb_lower': float(bb_lower),
            'volatility': float(volatility),
            'current_price': float(prices_array[-1])
        }
    
    def _calculate_ema(self, prices: np.ndarray, period: int) -> float:
        """Calculate Exponential Moving Average"""
        if len(prices) < period:
            return float(np.mean(prices))
        
        multiplier = 2 / (period + 1)
        ema = np.mean(prices[:period])
        
        for price in prices[period:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        
        return float(ema)
    
    def _extract_price(self, point: Any) -> float:
        """Extract numeric price from float or dict history items."""
        if isinstance(point, dict):
            raw_value = point.get('price', point.get('close', 0))
        else:
            raw_value = point

        try:
            return float(raw_value)
        except (TypeError, ValueError):
            return 0.0

    def _extract_volume(self, point: Any) -> float:
        """Extract volume from a history item when available."""
        if isinstance(point, dict):
            raw_value = point.get('volume', 0)
            try:
                return float(raw_value)
            except (TypeError, ValueError):
                return 0.0
        return 0.0

    def normalize_price_history(self, price_history: List[Any]) -> List[Dict]:
        """Convert mixed price history into feature-rich dict items."""
        normalized_history = []
        running_prices: List[float] = []

        for point in price_history:
            price = self._extract_price(point)
            volume = self._extract_volume(point)
            running_prices.append(price)

            indicators = self.calculate_technical_indicators(running_prices) if len(running_prices) >= 20 else {}
            normalized_history.append({
                'price': price,
                'volume': volume,
                'rsi': float(indicators.get('rsi', 50.0)),
                'macd': float(indicators.get('macd', 0.0)),
                'ma_5': float(indicators.get('ma_5', price)),
                'ma_20': float(indicators.get('ma_20', price)),
                'bb_upper': float(indicators.get('bb_upper', price)),
                'bb_lower': float(indicators.get('bb_lower', price)),
            })

        return normalized_history

    def _get_signal_from_scores(self, signal_scores: Dict[str, float]) -> str:
        """Pick the dominant signal, using HOLD when scores are too close."""
        ranked = sorted(signal_scores.items(), key=lambda item: item[1], reverse=True)
        if not ranked:
            return 'HOLD'

        top_signal, top_score = ranked[0]
        runner_up_score = ranked[1][1] if len(ranked) > 1 else 0.0

        if top_score - runner_up_score < 0.03:
            return 'HOLD'

        return top_signal

    def _calculate_weighted_signal_scores(self, predictions: List[Dict]) -> Dict[str, float]:
        """Calculate weighted aggregate signal scores."""
        scores = {'BUY': 0.0, 'SELL': 0.0, 'HOLD': 0.0}

        for prediction in predictions:
            signal = prediction.get('signal', 'HOLD')
            if signal not in scores:
                continue

            scores[signal] += prediction.get('confidence', 0.5) * prediction.get('weight', 0.0)

        return scores

    def _calculate_weighted_confidence(self, predictions: List[Dict]) -> float:
        """Calculate normalized weighted confidence from active sources."""
        total_weight = sum(prediction.get('weight', 0.0) for prediction in predictions)
        if total_weight == 0:
            return 0.5

        weighted_confidence = sum(
            prediction.get('confidence', 0.5) * prediction.get('weight', 0.0)
            for prediction in predictions
        )
        return weighted_confidence / total_weight

    def _summarize_research_context(self, symbol: str) -> Dict:
        """Fetch compact SoSoValue context for signal fusion."""
        if not self.sosovalue:
            return {
                'available': False,
                'provider': 'SoSoValue',
                'error': 'SoSoValue service is not loaded'
            }

        if not self.sosovalue.is_available():
            return {
                'available': False,
                'provider': 'SoSoValue',
                'error': self.sosovalue.get_unavailable_reason()
            }

        try:
            context = self.sosovalue.get_research_context(symbol=symbol, news_limit=3)
            latest_news = []
            for article in context.get('latest_news', [])[:3]:
                latest_news.append({
                    'title': article.get('title'),
                    'category_label': article.get('category_label'),
                    'importance_score': article.get('importance_score'),
                    'published_at': article.get('published_at'),
                })

            return {
                'available': True,
                'provider': 'SoSoValue',
                'catalyst_score': float(context.get('catalyst_score', 0)),
                'catalyst_label': context.get('catalyst_label', 'LOW'),
                'news_count': context.get('news_count', 0),
                'macro_regime': context.get('macro_context', {}).get('overall_regime', 'UNAVAILABLE'),
                'rationale': context.get('rationale', []),
                'latest_news': latest_news
            }
        except Exception as e:
            logger.warning(f"SoSoValue research context unavailable for {symbol}: {e}")
            return {
                'available': False,
                'provider': 'SoSoValue',
                'error': str(e)
            }

    def _derive_research_signal(self, research_context: Optional[Dict]) -> Optional[Dict]:
        """Convert SoSoValue research context into a confirmation signal."""
        if not research_context or not research_context.get('available'):
            return None

        regime = research_context.get('macro_regime', 'UNAVAILABLE')
        catalyst_score = float(research_context.get('catalyst_score', 0))

        if regime == 'BULLISH':
            signal = 'BUY'
            confidence = min(0.55 + (catalyst_score / 400), 0.80)
            explanation = 'SoSoValue ETF regime is bullish and supports a risk-on bias.'
        elif regime == 'DEFENSIVE':
            signal = 'SELL'
            confidence = min(0.55 + (catalyst_score / 400), 0.80)
            explanation = 'SoSoValue ETF regime is defensive and supports caution.'
        else:
            signal = 'HOLD'
            confidence = min(0.45 + (catalyst_score / 500), 0.65)
            explanation = 'SoSoValue research is active, but the macro regime is neutral.'

        return {
            'source': 'SoSoValue Research',
            'signal': signal,
            'confidence': round(confidence, 4),
            'weight': self.SOURCE_WEIGHTS['SoSoValue Research'],
            'catalyst_score': catalyst_score,
            'macro_regime': regime,
            'explanation': explanation
        }

    def _determine_alignment(
        self,
        base_signal: str,
        research_signal: Optional[Dict],
        has_core_predictions: bool,
    ) -> str:
        """Describe whether SoSoValue confirms the core model output."""
        if not research_signal:
            return 'UNAVAILABLE'

        if research_signal['signal'] == 'HOLD':
            return 'NEUTRAL'

        if not has_core_predictions:
            return 'RESEARCH_ONLY'

        if base_signal == 'HOLD':
            return 'NEEDS_CONFIRMATION'

        if base_signal == research_signal['signal']:
            return 'CONFIRMED'

        return 'CONTRADICTED'

    def _adjust_confidence_for_research(
        self,
        confidence: float,
        alignment: str,
        research_context: Optional[Dict],
    ) -> float:
        """Apply SoSoValue confirmation or contradiction to final confidence."""
        catalyst_score = float((research_context or {}).get('catalyst_score', 0))

        if alignment == 'CONFIRMED':
            confidence += 0.05
            if catalyst_score >= 75:
                confidence += 0.03
        elif alignment == 'CONTRADICTED':
            confidence -= 0.10
        elif alignment == 'RESEARCH_ONLY':
            confidence -= 0.03
        elif alignment == 'NEEDS_CONFIRMATION':
            confidence -= 0.05

        return max(0.05, min(confidence, 0.95))

    def combine_predictions(
        self,
        lstm_pred: Optional[Dict],
        ml_pred: Optional[Dict],
        market_data: Optional[Dict],
        research_context: Optional[Dict] = None,
    ) -> Dict:
        """Combine predictions from technical, market, and research sources."""
        predictions = []
        
        # LSTM prediction
        if lstm_pred and lstm_pred.get('is_trained'):
            predictions.append({
                'source': 'LSTM',
                'signal': 'BUY' if lstm_pred['price_change_percent'] > 0 else 'SELL',
                'confidence': lstm_pred['confidence'],
                'weight': self.SOURCE_WEIGHTS['LSTM']
            })
        
        # ML prediction
        if ml_pred and ml_pred.get('is_trained'):
            predictions.append({
                'source': 'Random Forest',
                'signal': ml_pred['prediction'],
                'confidence': ml_pred['ml_confidence'],
                'weight': self.SOURCE_WEIGHTS['Random Forest']
            })
        
        # Market sentiment from CoinGecko
        if market_data and 'sentiment' in market_data:
            sentiment = market_data['sentiment']
            sentiment_score = sentiment.get('sentiment_up', 50) / 100
            signal = 'BUY' if sentiment_score > 0.5 else 'SELL'
            predictions.append({
                'source': 'Market Sentiment',
                'signal': signal,
                'confidence': sentiment_score,
                'weight': self.SOURCE_WEIGHTS['Market Sentiment']
            })

        research_signal = self._derive_research_signal(research_context)
        if research_signal:
            predictions.append(research_signal)

        # Determine base signal from non-SoSo sources, then blend with research.
        base_predictions = [
            prediction for prediction in predictions
            if prediction.get('source') != 'SoSoValue Research'
        ]
        has_core_predictions = len(base_predictions) > 0
        base_signal_scores = self._calculate_weighted_signal_scores(base_predictions)
        base_signal = self._get_signal_from_scores(base_signal_scores)

        signal_scores = self._calculate_weighted_signal_scores(predictions)
        final_signal = self._get_signal_from_scores(signal_scores)
        combined_confidence = self._calculate_weighted_confidence(predictions)

        signal_alignment = self._determine_alignment(base_signal, research_signal, has_core_predictions)
        combined_confidence = self._adjust_confidence_for_research(
            combined_confidence,
            signal_alignment,
            research_context
        )

        research_score = float((research_context or {}).get('catalyst_score', 0)) / 100
        macro_regime = (research_context or {}).get('macro_regime', 'UNAVAILABLE')
        macro_score = {
            'BULLISH': 0.75,
            'NEUTRAL': 0.50,
            'DEFENSIVE': 0.25,
            'UNAVAILABLE': 0.50
        }.get(macro_regime, 0.50)

        if research_context and research_context.get('available'):
            rationale_parts = list(research_context.get('rationale', [])[:2])
        elif research_context and research_context.get('error'):
            rationale_parts = [f"SoSoValue unavailable: {research_context['error']}"]
        else:
            rationale_parts = []

        if signal_alignment == 'CONFIRMED':
            rationale_parts.append('SoSoValue confirms the core model direction.')
        elif signal_alignment == 'CONTRADICTED':
            rationale_parts.append('SoSoValue contradicts the core model direction, so confidence was reduced.')
        elif signal_alignment == 'RESEARCH_ONLY':
            rationale_parts.append('SoSoValue is currently the only directional input, so confirmation is still required.')
        elif signal_alignment == 'NEEDS_CONFIRMATION':
            rationale_parts.append('Core models are directional, but SoSoValue did not provide directional confirmation.')

        return {
            'signal': final_signal,
            'confidence': round(combined_confidence, 4),
            'confidence_level': self.get_confidence_level(combined_confidence),
            'confidence_color': self.get_confidence_color(combined_confidence),
            'predictions': predictions,
            'models_used': len(predictions),
            'research_score': round(research_score, 4),
            'macro_score': round(macro_score, 4),
            'catalyst_score': float((research_context or {}).get('catalyst_score', 0)),
            'macro_regime': macro_regime,
            'signal_alignment': signal_alignment,
            'confirmation_required': signal_alignment in {'CONTRADICTED', 'NEEDS_CONFIRMATION', 'RESEARCH_ONLY'} or combined_confidence < self.CONFIDENCE_THRESHOLDS['medium'],
            'rationale_summary': ' '.join(rationale_parts).strip()
        }
    
    def predict(self, symbol: str, price_history: List[Any]) -> Dict:
        """Generate enhanced prediction with all available data"""
        result = {
            'symbol': symbol,
            'timestamp': datetime.now().isoformat(),
            'signal': 'HOLD',
            'confidence': 0.5,
            'confidence_level': 'MEDIUM',
            'confidence_color': 'yellow',
            'models': {}
        }
        
        try:
            normalized_history = self.normalize_price_history(price_history)
            prices_only = [point['price'] for point in normalized_history]

            # Get CoinGecko market data
            market_data = None
            if self.coingecko:
                market_data = self.coingecko.get_enhanced_market_data(symbol)
                if market_data:
                    result['market_data'] = {
                        'price': market_data.get('price', 0),
                        'volume_24h': market_data.get('volume_24h', 0),
                        'price_change_24h': market_data.get('price_change_24h', 0),
                        'market_cap': market_data.get('market_cap', 0),
                        'sentiment_up': market_data.get('sentiment', {}).get('sentiment_up', 50)
                    }

            # Get SoSoValue research context
            research_context = self._summarize_research_context(symbol)
            result['research_context'] = research_context
            if research_context.get('available'):
                result['models']['sosovalue'] = {
                    'catalyst_score': research_context.get('catalyst_score', 0),
                    'macro_regime': research_context.get('macro_regime', 'UNAVAILABLE'),
                    'news_count': research_context.get('news_count', 0)
                }
            
            # LSTM prediction
            lstm_pred = None
            if self.lstm and len(normalized_history) >= self.lstm.sequence_length:
                lstm_pred = self.lstm.predict(normalized_history)
                if lstm_pred:
                    result['models']['lstm'] = {
                        'predicted_price': lstm_pred['predicted_price'],
                        'price_change': lstm_pred['price_change_percent'],
                        'confidence': lstm_pred['confidence']
                    }
            
            # ML prediction
            ml_pred = None
            if self.ml and prices_only:
                indicators = self.calculate_technical_indicators(prices_only)
                if indicators:
                    ml_pred = self.ml.predict(indicators)
                    if ml_pred:
                        result['models']['random_forest'] = {
                            'signal': ml_pred['prediction'],
                            'confidence': ml_pred['ml_confidence'],
                            'win_probability': ml_pred['win_probability']
                        }
            
            # Combine predictions
            combined = self.combine_predictions(lstm_pred, ml_pred, market_data, research_context)
            result.update({
                'signal': combined['signal'],
                'confidence': combined['confidence'],
                'confidence_level': combined['confidence_level'],
                'confidence_color': combined['confidence_color'],
                'predictions_detail': combined['predictions'],
                'models_used': combined['models_used'],
                'research_score': combined['research_score'],
                'macro_score': combined['macro_score'],
                'catalyst_score': combined['catalyst_score'],
                'macro_regime': combined['macro_regime'],
                'signal_alignment': combined['signal_alignment'],
                'confirmation_required': combined['confirmation_required'],
                'rationale_summary': combined['rationale_summary']
            })
            
            # Add technical indicators
            if prices_only:
                indicators = self.calculate_technical_indicators(prices_only)
                result['technical_indicators'] = indicators
            
        except Exception as e:
            logger.error(f"Enhanced prediction error: {e}")
            result['error'] = str(e)
        
        return result
    
    def get_prediction_accuracy(self, predictions: List[Dict], actual_outcomes: List[Dict]) -> Dict:
        """Calculate prediction accuracy metrics"""
        if len(predictions) != len(actual_outcomes):
            return {'error': 'Mismatched prediction and outcome counts'}
        
        correct = 0
        total = len(predictions)
        
        for pred, actual in zip(predictions, actual_outcomes):
            pred_signal = pred.get('signal', 'HOLD')
            actual_profit = actual.get('profit_loss', 0)
            
            # Check if prediction was correct
            if pred_signal == 'BUY' and actual_profit > 0:
                correct += 1
            elif pred_signal == 'SELL' and actual_profit < 0:
                correct += 1
            elif pred_signal == 'HOLD' and abs(actual_profit) < 0.01:
                correct += 1
        
        accuracy = (correct / total) * 100 if total > 0 else 0
        
        return {
            'accuracy': accuracy,
            'correct_predictions': correct,
            'total_predictions': total,
            'accuracy_level': 'HIGH' if accuracy >= 70 else 'MEDIUM' if accuracy >= 50 else 'LOW'
        }
    
    def get_model_status(self) -> Dict:
        """Get status of all models"""
        return {
            'lstm': self.lstm.get_model_info() if self.lstm else {'available': False},
            'random_forest': self.ml.get_model_info() if self.ml else {'available': False},
            'coingecko': {'available': self.coingecko is not None},
            'sosovalue': self.sosovalue.get_service_status() if self.sosovalue else {'available': False, 'enabled': False},
            'enhanced_predictor': {
                'available': True,
                'confidence_thresholds': self.CONFIDENCE_THRESHOLDS
            }
        }


# Singleton instance
enhanced_predictor = EnhancedPredictor()
