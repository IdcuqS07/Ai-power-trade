"""Mock Market Data Generator for AI Trading Platform"""
import random
import time
from datetime import datetime, timedelta, timezone
import math
import numpy as np
from typing import List, Dict


class MarketDataGenerator:
    """Generates realistic mock cryptocurrency market data"""
    
    def __init__(self):
        self.base_prices = {
            'BTC': 65000,
            'ETH': 3500,
            'BNB': 450,
            'SOL': 120
        }
        self.current_prices = self.base_prices.copy()
        self.volatility = {
            'BTC': 0.02,
            'ETH': 0.03,
            'BNB': 0.025,
            'SOL': 0.04
        }
        self.trend = 0  # Market trend: -1 (bearish), 0 (neutral), 1 (bullish)
        
    def generate_price_tick(self, symbol: str) -> Dict:
        """Generate a single price tick for a symbol"""
        if symbol not in self.current_prices:
            return None
            
        # Add trend and random walk
        trend_factor = self.trend * 0.001
        volatility = self.volatility[symbol]
        
        # Random walk with trend
        change = np.random.normal(trend_factor, volatility)
        self.current_prices[symbol] *= (1 + change)
        
        # Ensure price doesn't deviate too much from base
        max_deviation = 0.3  # 30%
        if abs(self.current_prices[symbol] - self.base_prices[symbol]) / self.base_prices[symbol] > max_deviation:
            self.current_prices[symbol] = self.base_prices[symbol] * (1 + max_deviation * np.sign(change))
        
        price = round(self.current_prices[symbol], 2)
        volume = random.uniform(100, 10000)
        
        return {
            'symbol': symbol,
            'price': price,
            'volume': round(volume, 2),
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'change_24h': round(random.uniform(-5, 5), 2),
            'high_24h': round(price * 1.05, 2),
            'low_24h': round(price * 0.95, 2)
        }
    
    def generate_orderbook(self, symbol: str, depth: int = 10) -> Dict:
        """Generate mock orderbook data"""
        if symbol not in self.current_prices:
            return None
            
        price = self.current_prices[symbol]
        
        # Generate bids (buy orders)
        bids = []
        for i in range(depth):
            bid_price = price * (1 - (i + 1) * 0.001)
            bid_volume = random.uniform(0.1, 10)
            bids.append({
                'price': round(bid_price, 2),
                'volume': round(bid_volume, 4)
            })
        
        # Generate asks (sell orders)
        asks = []
        for i in range(depth):
            ask_price = price * (1 + (i + 1) * 0.001)
            ask_volume = random.uniform(0.1, 10)
            asks.append({
                'price': round(ask_price, 2),
                'volume': round(ask_volume, 4)
            })
        
        return {
            'symbol': symbol,
            'bids': bids,
            'asks': asks,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    def generate_historical_data(self, symbol: str, periods: int = 100) -> List[Dict]:
        """Generate historical OHLCV data"""
        if symbol not in self.base_prices:
            return []
        
        data = []
        current_time = datetime.now(timezone.utc)
        price = self.base_prices[symbol]
        
        for i in range(periods, 0, -1):
            # Random walk
            change = np.random.normal(0, self.volatility[symbol])
            price *= (1 + change)
            
            open_price = price
            high = price * (1 + abs(np.random.normal(0, 0.01)))
            low = price * (1 - abs(np.random.normal(0, 0.01)))
            close = price * (1 + np.random.normal(0, 0.005))
            volume = random.uniform(1000, 50000)
            
            data.append({
                'timestamp': (current_time - timedelta(minutes=i)).isoformat(),
                'open': round(open_price, 2),
                'high': round(high, 2),
                'low': round(low, 2),
                'close': round(close, 2),
                'volume': round(volume, 2)
            })
        
        return data
    
    def set_market_trend(self, trend: int):
        """Set market trend: -1 (bearish), 0 (neutral), 1 (bullish)"""
        self.trend = max(-1, min(1, trend))
