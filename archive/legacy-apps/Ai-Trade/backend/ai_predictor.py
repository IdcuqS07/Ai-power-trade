"""AI Prediction Engine for Trading Signals"""
import numpy as np
from typing import Dict, List
import random
from datetime import datetime, timezone


class AIPredictor:
    """Generate AI-powered trading predictions and signals"""
    
    def __init__(self):
        self.model_version = "v2.0-demo"
        self.confidence_threshold = 0.65
        
    def generate_signal(self, features: Dict) -> Dict:
        """Generate trading signal based on features"""
        if not features:
            return self._default_signal()
        
        # Extract key indicators
        rsi = features.get('rsi', 50)
        macd_diff = features.get('macd_diff', 0)
        price = features.get('price', 0)
        bb_low = features.get('bb_low', 0)
        bb_high = features.get('bb_high', 0)
        ema_12 = features.get('ema_12', 0)
        ema_26 = features.get('ema_26', 0)
        adx = features.get('adx', 0)
        stoch_k = features.get('stoch_k', 50)
        momentum = features.get('momentum', 0)
        
        # Calculate signal score
        buy_score = 0
        sell_score = 0
        
        # RSI indicators
        if rsi < 30:
            buy_score += 2  # Oversold
        elif rsi > 70:
            sell_score += 2  # Overbought
        elif rsi < 40:
            buy_score += 1
        elif rsi > 60:
            sell_score += 1
        
        # MACD indicators
        if macd_diff > 0:
            buy_score += 1.5
        elif macd_diff < 0:
            sell_score += 1.5
        
        # Bollinger Bands
        if price <= bb_low:
            buy_score += 1.5  # Price at lower band
        elif price >= bb_high:
            sell_score += 1.5  # Price at upper band
        
        # EMA crossover
        if ema_12 > ema_26:
            buy_score += 1  # Bullish
        elif ema_12 < ema_26:
            sell_score += 1  # Bearish
        
        # ADX trend strength
        if adx > 25:
            # Strong trend, amplify signals
            if buy_score > sell_score:
                buy_score += 1
            elif sell_score > buy_score:
                sell_score += 1
        
        # Stochastic
        if stoch_k < 20:
            buy_score += 1  # Oversold
        elif stoch_k > 80:
            sell_score += 1  # Overbought
        
        # Momentum
        if momentum > 2:
            buy_score += 0.5
        elif momentum < -2:
            sell_score += 0.5
        
        # Determine signal
        total_score = buy_score + sell_score
        if total_score == 0:
            signal = 'HOLD'
            confidence = 0.5
        elif buy_score > sell_score:
            signal = 'BUY'
            confidence = min(0.95, 0.5 + (buy_score / (total_score * 2)))
        elif sell_score > buy_score:
            signal = 'SELL'
            confidence = min(0.95, 0.5 + (sell_score / (total_score * 2)))
        else:
            signal = 'HOLD'
            confidence = 0.5
        
        # Calculate risk score (0-100)
        risk_score = self._calculate_risk(features)
        
        # Position sizing (% of portfolio)
        position_size = self._calculate_position_size(confidence, risk_score)
        
        # Price prediction
        price_prediction = self._predict_price_change(features, signal)
        
        return {
            'signal': signal,
            'confidence': round(confidence, 3),
            'buy_score': round(buy_score, 2),
            'sell_score': round(sell_score, 2),
            'risk_score': risk_score,
            'position_size': position_size,
            'price_prediction': price_prediction,
            'model_version': self.model_version,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'reasoning': self._generate_reasoning(signal, confidence, features)
        }
    
    def _calculate_risk(self, features: Dict) -> int:
        """Calculate risk score (0-100, higher = riskier)"""
        risk = 50  # Base risk
        
        # Volatility (ATR)
        atr = features.get('atr', 0)
        price = features.get('price', 1)
        if price > 0:
            atr_pct = (atr / price) * 100
            risk += min(20, atr_pct * 2)  # Higher volatility = higher risk
        
        # ADX (trend strength)
        adx = features.get('adx', 0)
        if adx < 20:
            risk += 10  # Weak trend = higher risk
        elif adx > 40:
            risk -= 10  # Strong trend = lower risk
        
        # Bollinger Band width
        bb_width = features.get('bb_width', 0)
        if bb_width > 0.15:
            risk += 10  # Wide bands = higher volatility
        
        return max(0, min(100, int(risk)))
    
    def _calculate_position_size(self, confidence: float, risk_score: int) -> float:
        """Calculate recommended position size (% of portfolio)"""
        # Base size on confidence
        base_size = confidence * 20  # Max 20% per position
        
        # Adjust for risk
        risk_factor = 1 - (risk_score / 200)  # Reduce size for high risk
        
        position_size = base_size * risk_factor
        
        return round(max(1, min(20, position_size)), 2)
    
    def _predict_price_change(self, features: Dict, signal: str) -> Dict:
        """Predict price change percentage"""
        momentum = features.get('momentum', 0)
        atr = features.get('atr', 0)
        price = features.get('price', 1)
        
        if price > 0:
            atr_pct = (atr / price) * 100
        else:
            atr_pct = 2
        
        if signal == 'BUY':
            predicted_change = abs(momentum) + random.uniform(0.5, atr_pct)
        elif signal == 'SELL':
            predicted_change = -(abs(momentum) + random.uniform(0.5, atr_pct))
        else:
            predicted_change = random.uniform(-0.5, 0.5)
        
        current_price = features.get('price', 0)
        target_price = current_price * (1 + predicted_change / 100)
        
        return {
            'predicted_change_pct': round(predicted_change, 2),
            'target_price': round(target_price, 2),
            'time_horizon': '1h'
        }
    
    def _generate_reasoning(self, signal: str, confidence: float, features: Dict) -> str:
        """Generate human-readable reasoning"""
        reasons = []
        
        rsi = features.get('rsi', 50)
        macd_diff = features.get('macd_diff', 0)
        adx = features.get('adx', 0)
        
        if signal == 'BUY':
            if rsi < 30:
                reasons.append("RSI indicates oversold condition")
            if macd_diff > 0:
                reasons.append("MACD bullish crossover")
            if adx > 25:
                reasons.append("Strong uptrend detected")
        elif signal == 'SELL':
            if rsi > 70:
                reasons.append("RSI indicates overbought condition")
            if macd_diff < 0:
                reasons.append("MACD bearish crossover")
            if adx > 25:
                reasons.append("Strong downtrend detected")
        else:
            reasons.append("Market consolidation, waiting for clear signal")
        
        if not reasons:
            reasons.append("Mixed signals, maintaining current position")
        
        return " | ".join(reasons)
    
    def _default_signal(self) -> Dict:
        """Return default HOLD signal"""
        return {
            'signal': 'HOLD',
            'confidence': 0.5,
            'buy_score': 0,
            'sell_score': 0,
            'risk_score': 50,
            'position_size': 0,
            'price_prediction': {
                'predicted_change_pct': 0,
                'target_price': 0,
                'time_horizon': '1h'
            },
            'model_version': self.model_version,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'reasoning': 'Insufficient data for prediction'
        }
