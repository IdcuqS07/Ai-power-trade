"""
WEEX API Integration
Real-time market data from WEEX Exchange
Falls back to CoinGecko for demo purposes
"""
import requests
import logging
import os
from typing import Dict, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)

# WEEX Competition Trading Pairs - CoinGecko IDs
COIN_IDS = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'DOGE': 'dogecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'BNB': 'binancecoin',
    'LTC': 'litecoin'
}

# Try to import official WEEX client
try:
    from weex_client import WeexAPIClient
    WEEX_CLIENT_AVAILABLE = True
except ImportError:
    WEEX_CLIENT_AVAILABLE = False
    logger.warning("Official WEEX client not available")

class WeexAPI:
    """WEEX Exchange API Client"""
    
    def __init__(self):
        # Check for WEEX API credentials
        weex_api_key = os.getenv('WEEX_API_KEY')
        weex_secret_key = os.getenv('WEEX_SECRET_KEY')
        
        # Try to use official WEEX API if credentials available
        if WEEX_CLIENT_AVAILABLE and weex_api_key and weex_secret_key:
            try:
                self.weex_client = WeexAPIClient(
                    api_key=weex_api_key,
                    secret_key=weex_secret_key,
                    base_url='https://api.weex.com'
                )
                
                # Test connection
                if self.weex_client.ping():
                    self.api_type = "weex_official"
                    self.base_url = "https://api.weex.com"
                    logger.info("✓ Using official WEEX API")
                    return
            except Exception as e:
                logger.warning(f"WEEX API initialization failed: {e}")
        
        # Fallback to CoinGecko for live data
        self.base_url = "https://api.coingecko.com/api/v3"
        self.api_type = "coingecko"
        self.weex_client = None
        
        # Add caching to avoid rate limits
        self.cache = {}
        self.cache_duration = 10  # Cache for 10 seconds
        
        logger.info("Using CoinGecko API for live market data (WEEX credentials not configured)")
        
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'AI-Trading-Platform/3.0'
        })
        
        # Symbol mapping: Our symbols -> Exchange symbols
        self.symbol_map = {
            'BTC': 'BTCUSDT',
            'ETH': 'ETHUSDT',
            'BNB': 'BNBUSDT',
            'SOL': 'SOLUSDT'
        }
    
    def get_ticker(self, symbol: str) -> Optional[Dict]:
        """Get live ticker data with caching"""
        try:
            # Check cache first
            cache_key = f"ticker_{symbol}"
            if cache_key in self.cache:
                cached_data, cached_time = self.cache[cache_key]
                if (datetime.now() - cached_time).total_seconds() < self.cache_duration:
                    return cached_data
            
            coin_id = COIN_IDS.get(symbol)
            if not coin_id:
                return None
            
            # CoinGecko API endpoint
            url = f"{self.base_url}/simple/price"
            params = {
                'ids': coin_id,
                'vs_currencies': 'usd',
                'include_24hr_change': 'true',
                'include_24hr_vol': 'true'
            }
            
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                coin_data = data.get(coin_id, {})
                
                if not coin_data:
                    return None
                
                price = coin_data.get('usd', 0)
                change_24h = coin_data.get('usd_24h_change', 0)
                volume_24h = coin_data.get('usd_24h_vol', 0)
                
                if price > 0:
                    result = {
                        'symbol': symbol,
                        'price': float(price),
                        'high_24h': float(price * (1 + abs(change_24h) / 100)),
                        'low_24h': float(price * (1 - abs(change_24h) / 100)),
                        'volume_24h': float(volume_24h),
                        'change_24h': float(change_24h),
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    # Cache the result
                    self.cache[cache_key] = (result, datetime.now())
                    
                    logger.info(f"✓ Live price for {symbol}: ${price:,.2f}")
                    return result
            
            return None
                
        except Exception as e:
            logger.error(f"Error fetching ticker for {symbol}: {e}")
            return None
    
    def get_all_tickers(self, symbols: List[str]) -> Dict[str, Dict]:
        """Get ticker data for multiple symbols (batch request)"""
        try:
            # Check cache first
            cache_key = "all_tickers"
            if cache_key in self.cache:
                cached_data, cached_time = self.cache[cache_key]
                if (datetime.now() - cached_time).total_seconds() < self.cache_duration:
                    return cached_data
            
            # Get all coin IDs
            ids = [COIN_IDS[s] for s in symbols if s in COIN_IDS]
            
            # Single batch request for all symbols
            url = f"{self.base_url}/simple/price"
            params = {
                'ids': ','.join(ids),
                'vs_currencies': 'usd',
                'include_24hr_change': 'true',
                'include_24hr_vol': 'true'
            }
            
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                tickers = {}
                
                for symbol in symbols:
                    coin_id = COIN_IDS.get(symbol)
                    if coin_id and coin_id in data:
                        coin_data = data[coin_id]
                        price = coin_data.get('usd', 0)
                        change_24h = coin_data.get('usd_24h_change', 0)
                        volume_24h = coin_data.get('usd_24h_vol', 0)
                        
                        if price > 0:
                            tickers[symbol] = {
                                'symbol': symbol,
                                'price': float(price),
                                'high_24h': float(price * (1 + abs(change_24h) / 100)),
                                'low_24h': float(price * (1 - abs(change_24h) / 100)),
                                'volume_24h': float(volume_24h),
                                'change_24h': float(change_24h),
                                'timestamp': datetime.now().isoformat()
                            }
                
                # Cache the result
                self.cache[cache_key] = (tickers, datetime.now())
                
                logger.info(f"✓ Fetched {len(tickers)} live prices")
                return tickers
            
            return {}
            
        except Exception as e:
            logger.error(f"Error fetching all tickers: {e}")
            return {}
    
    def get_orderbook(self, symbol: str, limit: int = 20) -> Optional[Dict]:
        """Get orderbook data"""
        try:
            exchange_symbol = self.symbol_map.get(symbol, f"{symbol}USDT")
            
            url = f"{self.base_url}/depth"
            params = {
                'symbol': exchange_symbol,
                'limit': limit
            }
            
            response = self.session.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                return {
                    'symbol': symbol,
                    'bids': [[float(price), float(qty)] for price, qty in data.get('bids', [])[:limit]],
                    'asks': [[float(price), float(qty)] for price, qty in data.get('asks', [])[:limit]],
                    'timestamp': datetime.now().isoformat()
                }
            else:
                logger.warning(f"API returned status {response.status_code} for orderbook {symbol}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching orderbook for {symbol}: {e}")
            return None
    
    def get_klines(self, symbol: str, interval: str = '1h', limit: int = 100) -> Optional[List]:
        """Get candlestick/kline data"""
        try:
            exchange_symbol = self.symbol_map.get(symbol, f"{symbol}USDT")
            
            url = f"{self.base_url}/klines"
            params = {
                'symbol': exchange_symbol,
                'interval': interval,
                'limit': limit
            }
            
            response = self.session.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                # Parse kline data
                klines = []
                for kline in data:
                    klines.append({
                        'timestamp': kline[0],
                        'open': float(kline[1]),
                        'high': float(kline[2]),
                        'low': float(kline[3]),
                        'close': float(kline[4]),
                        'volume': float(kline[5])
                    })
                
                return klines
            else:
                logger.warning(f"API returned status {response.status_code} for klines {symbol}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching klines for {symbol}: {e}")
            return None
    
    def get_price_history(self, symbol: str, limit: int = 100) -> List[float]:
        """Get price history from CoinGecko"""
        try:
            coin_id = COIN_IDS.get(symbol)
            if not coin_id:
                return []
            
            # Get market chart data (last 7 days, hourly)
            url = f"{self.base_url}/coins/{coin_id}/market_chart"
            params = {
                'vs_currency': 'usd',
                'days': '7',
                'interval': 'hourly'
            }
            
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                prices = data.get('prices', [])
                
                # Extract just the price values (prices is [[timestamp, price], ...])
                price_values = [p[1] for p in prices[-limit:]]
                
                logger.info(f"✓ Loaded {len(price_values)} historical prices for {symbol}")
                return price_values
            
            return []
                
        except Exception as e:
            logger.error(f"Error fetching price history for {symbol}: {e}")
            return []
    
    def health_check(self) -> bool:
        """Check if API is accessible"""
        try:
            # CoinGecko ping endpoint
            url = f"{self.base_url}/ping"
            logger.info(f"Health check: {url}")
            
            response = self.session.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('gecko_says') == '(V3) To the Moon!':
                    logger.info("✓ Live market data API connected successfully")
                    return True
            
            logger.warning(f"Health check failed: HTTP {response.status_code}")
            return False
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
