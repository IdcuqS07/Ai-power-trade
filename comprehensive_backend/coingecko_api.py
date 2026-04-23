"""
CoinGecko API Integration for Additional Market Data
Free API - No authentication required
"""

import requests
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import time

logger = logging.getLogger(__name__)


class CoinGeckoAPI:
    """CoinGecko API client for cryptocurrency market data"""
    
    BASE_URL = "https://api.coingecko.com/api/v3"
    
    # Coin ID mapping
    COIN_IDS = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'BNB': 'binancecoin',
        'SOL': 'solana',
        'ADA': 'cardano',
        'XRP': 'ripple',
        'DOT': 'polkadot',
        'DOGE': 'dogecoin',
        'MATIC': 'matic-network',
        'AVAX': 'avalanche-2'
    }
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'User-Agent': 'AI-Power-Trade/1.0'
        })
        self.last_request_time = 0
        self.rate_limit_delay = 1.5  # Seconds between requests (free tier)
    
    def _rate_limit(self):
        """Implement rate limiting for free tier"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - time_since_last)
        self.last_request_time = time.time()
    
    def _make_request(self, endpoint: str, params: Dict = None) -> Optional[Dict]:
        """Make API request with error handling"""
        self._rate_limit()
        
        try:
            url = f"{self.BASE_URL}/{endpoint}"
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"CoinGecko API error: {e}")
            return None
    
    def get_coin_id(self, symbol: str) -> Optional[str]:
        """Get CoinGecko coin ID from symbol"""
        return self.COIN_IDS.get(symbol.upper())
    
    def get_price(self, symbol: str) -> Optional[Dict]:
        """Get current price and market data"""
        coin_id = self.get_coin_id(symbol)
        if not coin_id:
            return None
        
        data = self._make_request(
            f"coins/{coin_id}",
            params={
                'localization': 'false',
                'tickers': 'false',
                'community_data': 'false',
                'developer_data': 'false'
            }
        )
        
        if not data:
            return None
        
        try:
            market_data = data.get('market_data', {})
            return {
                'symbol': symbol.upper(),
                'price': market_data.get('current_price', {}).get('usd', 0),
                'market_cap': market_data.get('market_cap', {}).get('usd', 0),
                'volume_24h': market_data.get('total_volume', {}).get('usd', 0),
                'price_change_24h': market_data.get('price_change_percentage_24h', 0),
                'price_change_7d': market_data.get('price_change_percentage_7d', 0),
                'price_change_30d': market_data.get('price_change_percentage_30d', 0),
                'high_24h': market_data.get('high_24h', {}).get('usd', 0),
                'low_24h': market_data.get('low_24h', {}).get('usd', 0),
                'ath': market_data.get('ath', {}).get('usd', 0),
                'ath_change_percentage': market_data.get('ath_change_percentage', {}).get('usd', 0),
                'atl': market_data.get('atl', {}).get('usd', 0),
                'atl_change_percentage': market_data.get('atl_change_percentage', {}).get('usd', 0),
                'circulating_supply': market_data.get('circulating_supply', 0),
                'total_supply': market_data.get('total_supply', 0),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error parsing CoinGecko data: {e}")
            return None
    
    def get_market_chart(self, symbol: str, days: int = 7) -> Optional[Dict]:
        """Get historical market data"""
        coin_id = self.get_coin_id(symbol)
        if not coin_id:
            return None
        
        data = self._make_request(
            f"coins/{coin_id}/market_chart",
            params={
                'vs_currency': 'usd',
                'days': days,
                'interval': 'daily' if days > 1 else 'hourly'
            }
        )
        
        if not data:
            return None
        
        try:
            prices = data.get('prices', [])
            volumes = data.get('total_volumes', [])
            market_caps = data.get('market_caps', [])
            
            return {
                'symbol': symbol.upper(),
                'days': days,
                'prices': [{'timestamp': p[0], 'price': p[1]} for p in prices],
                'volumes': [{'timestamp': v[0], 'volume': v[1]} for v in volumes],
                'market_caps': [{'timestamp': m[0], 'market_cap': m[1]} for m in market_caps],
                'data_points': len(prices)
            }
        except Exception as e:
            logger.error(f"Error parsing market chart data: {e}")
            return None
    
    def get_global_market_data(self) -> Optional[Dict]:
        """Get global cryptocurrency market data"""
        data = self._make_request("global")
        
        if not data:
            return None
        
        try:
            global_data = data.get('data', {})
            return {
                'total_market_cap_usd': global_data.get('total_market_cap', {}).get('usd', 0),
                'total_volume_24h_usd': global_data.get('total_volume', {}).get('usd', 0),
                'bitcoin_dominance': global_data.get('market_cap_percentage', {}).get('btc', 0),
                'ethereum_dominance': global_data.get('market_cap_percentage', {}).get('eth', 0),
                'active_cryptocurrencies': global_data.get('active_cryptocurrencies', 0),
                'markets': global_data.get('markets', 0),
                'market_cap_change_24h': global_data.get('market_cap_change_percentage_24h_usd', 0),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error parsing global market data: {e}")
            return None
    
    def get_trending_coins(self) -> Optional[List[Dict]]:
        """Get trending coins"""
        data = self._make_request("search/trending")
        
        if not data:
            return None
        
        try:
            coins = data.get('coins', [])
            return [
                {
                    'id': coin['item']['id'],
                    'symbol': coin['item']['symbol'],
                    'name': coin['item']['name'],
                    'market_cap_rank': coin['item'].get('market_cap_rank', 0),
                    'price_btc': coin['item'].get('price_btc', 0)
                }
                for coin in coins[:10]
            ]
        except Exception as e:
            logger.error(f"Error parsing trending coins: {e}")
            return None
    
    def get_market_sentiment(self, symbol: str) -> Optional[Dict]:
        """Get market sentiment indicators"""
        coin_id = self.get_coin_id(symbol)
        if not coin_id:
            return None
        
        data = self._make_request(f"coins/{coin_id}")
        
        if not data:
            return None
        
        try:
            sentiment = data.get('sentiment_votes_up_percentage', 50)
            community = data.get('community_data', {})
            developer = data.get('developer_data', {})
            
            return {
                'symbol': symbol.upper(),
                'sentiment_up': sentiment,
                'sentiment_down': 100 - sentiment,
                'twitter_followers': community.get('twitter_followers', 0),
                'reddit_subscribers': community.get('reddit_subscribers', 0),
                'github_stars': developer.get('stars', 0),
                'github_forks': developer.get('forks', 0),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error parsing sentiment data: {e}")
            return None
    
    def get_enhanced_market_data(self, symbol: str) -> Optional[Dict]:
        """Get comprehensive market data for a coin"""
        price_data = self.get_price(symbol)
        sentiment_data = self.get_market_sentiment(symbol)
        
        if not price_data:
            return None
        
        result = {
            **price_data,
            'sentiment': sentiment_data if sentiment_data else {}
        }
        
        return result


# Singleton instance
coingecko_api = CoinGeckoAPI()
