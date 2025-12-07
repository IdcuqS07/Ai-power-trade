"""
Binance API Integration for Real-time Crypto Data
Provides fast, reliable price data for all trading pairs
"""

import requests
import time
from typing import Dict, List, Optional
from datetime import datetime, timedelta

class BinanceAPI:
    def __init__(self):
        self.base_url = "https://api.binance.com/api/v3"
        self.cache = {}
        self.cache_duration = 10  # Cache for 10 seconds (real-time feel)
        self.api_available = True  # Track if API is available
        self.last_check_time = 0
        self.check_interval = 60  # Check availability every 60 seconds
        
        # Map WEEX pairs to Binance symbols
        self.pair_mapping = {
            'BTC/USDT': 'BTCUSDT',
            'ETH/USDT': 'ETHUSDT',
            'SOL/USDT': 'SOLUSDT',
            'BNB/USDT': 'BNBUSDT',
            'XRP/USDT': 'XRPUSDT',
            'DOGE/USDT': 'DOGEUSDT',
            'ADA/USDT': 'ADAUSDT',
            'AVAX/USDT': 'AVAXUSDT'
        }
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid"""
        if cache_key not in self.cache:
            return False
        
        cached_time = self.cache[cache_key].get('timestamp', 0)
        return (time.time() - cached_time) < self.cache_duration
    
    def get_price(self, symbol: str) -> Optional[float]:
        """Get current price for a symbol"""
        try:
            # Skip if API is known to be unavailable
            current_time = time.time()
            if not self.api_available and (current_time - self.last_check_time) < self.check_interval:
                return None
            
            binance_symbol = self.pair_mapping.get(symbol, symbol.replace('/', ''))
            cache_key = f"price_{binance_symbol}"
            
            # Return cached data if valid
            if self._is_cache_valid(cache_key):
                return self.cache[cache_key]['price']
            
            # Fetch from Binance with short timeout
            url = f"{self.base_url}/ticker/price"
            params = {'symbol': binance_symbol}
            
            try:
                response = requests.get(url, params=params, timeout=0.5)  # Very short timeout
                
                if response.status_code == 200:
                    data = response.json()
                    price = float(data['price'])
                    
                    # Cache the result
                    self.cache[cache_key] = {
                        'price': price,
                        'timestamp': time.time()
                    }
                    
                    self.api_available = True
                    return price
            except:
                # Mark API as unavailable
                self.api_available = False
                self.last_check_time = current_time
            
            return None
            
        except Exception as e:
            return None
    
    def get_24h_stats(self, symbol: str) -> Optional[Dict]:
        """Get 24h statistics for a symbol"""
        try:
            # Skip if API is known to be unavailable
            current_time = time.time()
            if not self.api_available and (current_time - self.last_check_time) < self.check_interval:
                return None
            
            binance_symbol = self.pair_mapping.get(symbol, symbol.replace('/', ''))
            cache_key = f"stats_{binance_symbol}"
            
            # Return cached data if valid
            if self._is_cache_valid(cache_key):
                return self.cache[cache_key]['stats']
            
            # Fetch from Binance with shorter timeout
            url = f"{self.base_url}/ticker/24hr"
            params = {'symbol': binance_symbol}
            
            try:
                response = requests.get(url, params=params, timeout=0.5)  # Very short timeout
                
                if response.status_code == 200:
                    data = response.json()
                    
                    stats = {
                        'price': float(data['lastPrice']),
                        'change_24h': float(data['priceChangePercent']),
                        'high_24h': float(data['highPrice']),
                        'low_24h': float(data['lowPrice']),
                        'volume_24h': float(data['volume']),
                        'volume_usd': float(data['quoteVolume'])
                    }
                    
                    # Cache the result
                    self.cache[cache_key] = {
                        'stats': stats,
                        'timestamp': time.time()
                    }
                    
                    self.api_available = True
                    return stats
            except:
                # Mark API as unavailable
                self.api_available = False
                self.last_check_time = current_time
            
            return None
            
        except Exception as e:
            return None
    
    def get_all_prices(self) -> Dict[str, float]:
        """Get prices for all supported pairs"""
        prices = {}
        
        for weex_pair, binance_symbol in self.pair_mapping.items():
            price = self.get_price(weex_pair)
            if price:
                prices[weex_pair] = price
        
        return prices
    
    def get_all_stats(self) -> Dict[str, Dict]:
        """Get 24h stats for all supported pairs"""
        stats = {}
        
        for weex_pair in self.pair_mapping.keys():
            pair_stats = self.get_24h_stats(weex_pair)
            if pair_stats:
                stats[weex_pair] = pair_stats
        
        return stats
    
    def get_klines(self, symbol: str, interval: str = '1h', limit: int = 24) -> List[Dict]:
        """Get historical kline/candlestick data"""
        try:
            binance_symbol = self.pair_mapping.get(symbol, symbol.replace('/', ''))
            cache_key = f"klines_{binance_symbol}_{interval}_{limit}"
            
            # Return cached data if valid
            if self._is_cache_valid(cache_key):
                return self.cache[cache_key]['klines']
            
            # Fetch from Binance
            url = f"{self.base_url}/klines"
            params = {
                'symbol': binance_symbol,
                'interval': interval,
                'limit': limit
            }
            response = requests.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                klines = []
                for k in data:
                    klines.append({
                        'timestamp': k[0],
                        'open': float(k[1]),
                        'high': float(k[2]),
                        'low': float(k[3]),
                        'close': float(k[4]),
                        'volume': float(k[5])
                    })
                
                # Cache the result
                self.cache[cache_key] = {
                    'klines': klines,
                    'timestamp': time.time()
                }
                
                return klines
            
            return []
            
        except Exception as e:
            print(f"Error fetching klines for {symbol}: {e}")
            return []
    
    def get_market_summary(self) -> Dict:
        """Get summary of all markets"""
        try:
            all_stats = self.get_all_stats()
            
            if not all_stats:
                return {}
            
            # Calculate market summary
            total_volume = sum(s['volume_usd'] for s in all_stats.values())
            avg_change = sum(s['change_24h'] for s in all_stats.values()) / len(all_stats)
            
            gainers = sorted(
                [(pair, stats['change_24h']) for pair, stats in all_stats.items()],
                key=lambda x: x[1],
                reverse=True
            )[:3]
            
            losers = sorted(
                [(pair, stats['change_24h']) for pair, stats in all_stats.items()],
                key=lambda x: x[1]
            )[:3]
            
            return {
                'total_pairs': len(all_stats),
                'total_volume_24h': total_volume,
                'avg_change_24h': avg_change,
                'top_gainers': gainers,
                'top_losers': losers,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting market summary: {e}")
            return {}

# Global instance
binance_api = BinanceAPI()
