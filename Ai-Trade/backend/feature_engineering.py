"""Feature Engineering Module - Technical Indicators"""
import pandas as pd
import numpy as np
from typing import List, Dict
import ta


class FeatureEngineer:
    """Calculate technical indicators for trading signals"""
    
    def __init__(self):
        pass
    
    def calculate_indicators(self, ohlcv_data: List[Dict]) -> pd.DataFrame:
        """Calculate all technical indicators"""
        if not ohlcv_data:
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(ohlcv_data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # RSI - Relative Strength Index
        df['rsi'] = ta.momentum.RSIIndicator(df['close'], window=14).rsi()
        
        # MACD - Moving Average Convergence Divergence
        macd = ta.trend.MACD(df['close'])
        df['macd'] = macd.macd()
        df['macd_signal'] = macd.macd_signal()
        df['macd_diff'] = macd.macd_diff()
        
        # Bollinger Bands
        bollinger = ta.volatility.BollingerBands(df['close'])
        df['bb_high'] = bollinger.bollinger_hband()
        df['bb_mid'] = bollinger.bollinger_mavg()
        df['bb_low'] = bollinger.bollinger_lband()
        df['bb_width'] = bollinger.bollinger_wband()
        
        # Moving Averages
        df['ema_12'] = ta.trend.EMAIndicator(df['close'], window=12).ema_indicator()
        df['ema_26'] = ta.trend.EMAIndicator(df['close'], window=26).ema_indicator()
        df['sma_20'] = ta.trend.SMAIndicator(df['close'], window=20).sma_indicator()
        df['sma_50'] = ta.trend.SMAIndicator(df['close'], window=50).sma_indicator()
        
        # ADX - Average Directional Index (trend strength)
        df['adx'] = ta.trend.ADXIndicator(df['high'], df['low'], df['close']).adx()
        
        # ATR - Average True Range (volatility)
        df['atr'] = ta.volatility.AverageTrueRange(df['high'], df['low'], df['close']).average_true_range()
        
        # Stochastic Oscillator
        stoch = ta.momentum.StochasticOscillator(df['high'], df['low'], df['close'])
        df['stoch_k'] = stoch.stoch()
        df['stoch_d'] = stoch.stoch_signal()
        
        # Volume indicators
        df['volume_sma'] = df['volume'].rolling(window=20).mean()
        df['volume_ratio'] = df['volume'] / df['volume_sma']
        
        # Price momentum
        df['momentum'] = df['close'].pct_change(periods=10) * 100
        
        # Fill NaN values
        df = df.fillna(method='bfill').fillna(0)
        
        return df
    
    def get_latest_features(self, df: pd.DataFrame) -> Dict:
        """Get latest feature values as dict"""
        if df.empty:
            return {}
        
        latest = df.iloc[-1]
        
        return {
            'price': float(latest['close']),
            'rsi': float(latest['rsi']),
            'macd': float(latest['macd']),
            'macd_signal': float(latest['macd_signal']),
            'macd_diff': float(latest['macd_diff']),
            'bb_high': float(latest['bb_high']),
            'bb_mid': float(latest['bb_mid']),
            'bb_low': float(latest['bb_low']),
            'bb_width': float(latest['bb_width']),
            'ema_12': float(latest['ema_12']),
            'ema_26': float(latest['ema_26']),
            'sma_20': float(latest['sma_20']),
            'sma_50': float(latest['sma_50']),
            'adx': float(latest['adx']),
            'atr': float(latest['atr']),
            'stoch_k': float(latest['stoch_k']),
            'stoch_d': float(latest['stoch_d']),
            'volume_ratio': float(latest['volume_ratio']),
            'momentum': float(latest['momentum'])
        }
    
    def calculate_support_resistance(self, df: pd.DataFrame, window: int = 20) -> Dict:
        """Calculate support and resistance levels"""
        if len(df) < window:
            return {'support': 0, 'resistance': 0}
        
        recent = df.tail(window)
        support = recent['low'].min()
        resistance = recent['high'].max()
        
        return {
            'support': float(support),
            'resistance': float(resistance)
        }
