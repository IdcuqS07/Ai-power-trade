"""
Enhanced AI Predictor combining LSTM, ML, and CoinGecko data
Provides improved predictions with confidence visualization
"""

import numpy as np
import logging
from typing import Dict, List, Optional
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


class EnhancedPredictor:
    """Enhanced predictor combining multiple AI models and data sources"""
    
    def __init__(self):
        self.lstm = lstm_predictor if MODULES_AVAILABLE else None
        self.ml = ml_predictor if MODULES_AVAILABLE else None
        self.coingecko = coingecko_api if MODULES_AVAILABLE else None
        
        # Confidence thresholds for color coding
        self.CONFIDENCE_THRESHOLDS = {
            'high': 0.75,      # Green
            'medium': 0.60,    # Yellow
            'low': 0.0         # Red
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
    
    def combine_predictions(self, lstm_pred: Optional[Dict], ml_pred: Optional[Dict], 
                          market_data: Optional[Dict]) -> Dict:
        """Combine predictions from multiple sources"""
        predictions = []
        confidences = []
        
        # LSTM prediction
        if lstm_pred and lstm_pred.get('is_trained'):
            predictions.append({
                'source': 'LSTM',
                'signal': 'BUY' if lstm_pred['price_change_percent'] > 0 else 'SELL',
                'confidence': lstm_pred['confidence'],
                'weight': 0.4
            })
            confidences.append(lstm_pred['confidence'] * 0.4)
        
        # ML prediction
        if ml_pred and ml_pred.get('is_trained'):
            predictions.append({
                'source': 'Random Forest',
                'signal': ml_pred['prediction'],
                'confidence': ml_pred['ml_confidence'],
                'weight': 0.3
            })
            confidences.append(ml_pred['ml_confidence'] * 0.3)
        
        # Market sentiment from CoinGecko
        if market_data and 'sentiment' in market_data:
            sentiment = market_data['sentiment']
            sentiment_score = sentiment.get('sentiment_up', 50) / 100
            signal = 'BUY' if sentiment_score > 0.5 else 'SELL'
            predictions.append({
                'source': 'Market Sentiment',
                'signal': signal,
                'confidence': sentiment_score,
                'weight': 0.3
            })
            confidences.append(sentiment_score * 0.3)
        
        # Calculate combined confidence
        combined_confidence = sum(confidences) if confidences else 0.5
        
        # Determine final signal (majority vote)
        buy_votes = sum(1 for p in predictions if p['signal'] == 'BUY')
        sell_votes = len(predictions) - buy_votes
        final_signal = 'BUY' if buy_votes > sell_votes else 'SELL' if sell_votes > buy_votes else 'HOLD'
        
        return {
            'signal': final_signal,
            'confidence': combined_confidence,
            'confidence_level': self.get_confidence_level(combined_confidence),
            'confidence_color': self.get_confidence_color(combined_confidence),
            'predictions': predictions,
            'models_used': len(predictions)
        }
    
    def predict(self, symbol: str, price_history: List[Dict]) -> Dict:
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
            
            # LSTM prediction
            lstm_pred = None
            if self.lstm and len(price_history) >= self.lstm.sequence_length:
                lstm_pred = self.lstm.predict(price_history)
                if lstm_pred:
                    result['models']['lstm'] = {
                        'predicted_price': lstm_pred['predicted_price'],
                        'price_change': lstm_pred['price_change_percent'],
                        'confidence': lstm_pred['confidence']
                    }
            
            # ML prediction
            ml_pred = None
            if self.ml and price_history:
                indicators = self.calculate_technical_indicators(
                    [p.get('price', 0) for p in price_history]
                )
                if indicators:
                    ml_pred = self.ml.predict(indicators)
                    if ml_pred:
                        result['models']['random_forest'] = {
                            'signal': ml_pred['prediction'],
                            'confidence': ml_pred['ml_confidence'],
                            'win_probability': ml_pred['win_probability']
                        }
            
            # Combine predictions
            combined = self.combine_predictions(lstm_pred, ml_pred, market_data)
            result.update({
                'signal': combined['signal'],
                'confidence': combined['confidence'],
                'confidence_level': combined['confidence_level'],
                'confidence_color': combined['confidence_color'],
                'predictions_detail': combined['predictions'],
                'models_used': combined['models_used']
            })
            
            # Add technical indicators
            if price_history:
                indicators = self.calculate_technical_indicators(
                    [p.get('price', 0) for p in price_history]
                )
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
            'enhanced_predictor': {
                'available': True,
                'confidence_thresholds': self.CONFIDENCE_THRESHOLDS
            }
        }


# Singleton instance
enhanced_predictor = EnhancedPredictor()
