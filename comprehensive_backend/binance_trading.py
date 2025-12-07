"""
Binance Trading Integration
Full trading functionality with testnet & production support
"""

import os
import time
import hmac
import hashlib
import requests
from typing import Dict, List, Optional
from datetime import datetime
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class BinanceTrading:
    def __init__(self):
        # Get mode from environment (testnet or production)
        self.mode = os.getenv('BINANCE_MODE', 'testnet').lower()
        
        # Set base URL based on mode
        if self.mode == 'production':
            self.base_url = "https://api.binance.com"
            self.api_key = os.getenv('BINANCE_API_KEY', '')
            self.api_secret = os.getenv('BINANCE_SECRET', '')
        else:  # testnet
            self.base_url = "https://testnet.binance.vision"
            self.api_key = os.getenv('BINANCE_TESTNET_API_KEY', '')
            self.api_secret = os.getenv('BINANCE_TESTNET_SECRET', '')
        
        self.headers = {
            'X-MBX-APIKEY': self.api_key
        }
        
        # Trading pairs mapping
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
        
        # Check if credentials are configured
        self.is_configured = bool(self.api_key and self.api_secret)
        
        if self.is_configured:
            logger.info(f"✓ Binance Trading initialized in {self.mode.upper()} mode")
        else:
            logger.warning(f"✗ Binance Trading not configured - credentials missing")
    
    def _generate_signature(self, params: Dict) -> str:
        """Generate HMAC SHA256 signature"""
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def _make_request(self, method: str, endpoint: str, params: Dict = None, signed: bool = False) -> Optional[Dict]:
        """Make API request to Binance"""
        if not self.is_configured:
            logger.error("Binance credentials not configured")
            return None
        
        try:
            url = f"{self.base_url}{endpoint}"
            
            if params is None:
                params = {}
            
            # Add timestamp for signed requests
            if signed:
                params['timestamp'] = int(time.time() * 1000)
                params['signature'] = self._generate_signature(params)
            
            if method == 'GET':
                response = requests.get(url, params=params, headers=self.headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, params=params, headers=self.headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, params=params, headers=self.headers, timeout=10)
            else:
                logger.error(f"Unsupported method: {method}")
                return None
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Binance API error: {response.status_code} - {response.text}")
                return None
        
        except Exception as e:
            logger.error(f"Error making Binance request: {e}")
            return None
    
    def test_connection(self) -> bool:
        """Test API connection"""
        try:
            result = self._make_request('GET', '/api/v3/ping')
            return result is not None
        except:
            return False
    
    def get_account_info(self) -> Optional[Dict]:
        """Get account information"""
        return self._make_request('GET', '/api/v3/account', signed=True)
    
    def get_balance(self, asset: str = 'USDT') -> Optional[float]:
        """Get balance for specific asset"""
        account = self.get_account_info()
        if not account:
            return None
        
        for balance in account.get('balances', []):
            if balance['asset'] == asset:
                return float(balance['free'])
        
        return 0.0
    
    def get_all_balances(self) -> Dict[str, float]:
        """Get all non-zero balances"""
        account = self.get_account_info()
        if not account:
            return {}
        
        balances = {}
        for balance in account.get('balances', []):
            free = float(balance['free'])
            locked = float(balance['locked'])
            total = free + locked
            
            if total > 0:
                balances[balance['asset']] = {
                    'free': free,
                    'locked': locked,
                    'total': total
                }
        
        return balances
    
    def place_market_order(self, symbol: str, side: str, quantity: float) -> Optional[Dict]:
        """
        Place market order
        
        Args:
            symbol: Trading pair (e.g., 'BTC/USDT')
            side: 'BUY' or 'SELL'
            quantity: Amount to trade
        """
        binance_symbol = self.pair_mapping.get(symbol, symbol.replace('/', ''))
        
        params = {
            'symbol': binance_symbol,
            'side': side.upper(),
            'type': 'MARKET',
            'quantity': quantity
        }
        
        logger.info(f"Placing {side} market order: {quantity} {symbol}")
        result = self._make_request('POST', '/api/v3/order', params=params, signed=True)
        
        if result:
            logger.info(f"✓ Order placed successfully: {result.get('orderId')}")
        
        return result
    
    def place_limit_order(self, symbol: str, side: str, quantity: float, price: float) -> Optional[Dict]:
        """
        Place limit order
        
        Args:
            symbol: Trading pair (e.g., 'BTC/USDT')
            side: 'BUY' or 'SELL'
            quantity: Amount to trade
            price: Limit price
        """
        binance_symbol = self.pair_mapping.get(symbol, symbol.replace('/', ''))
        
        params = {
            'symbol': binance_symbol,
            'side': side.upper(),
            'type': 'LIMIT',
            'timeInForce': 'GTC',  # Good Till Cancel
            'quantity': quantity,
            'price': price
        }
        
        logger.info(f"Placing {side} limit order: {quantity} {symbol} @ {price}")
        result = self._make_request('POST', '/api/v3/order', params=params, signed=True)
        
        if result:
            logger.info(f"✓ Limit order placed: {result.get('orderId')}")
        
        return result
    
    def cancel_order(self, symbol: str, order_id: int) -> Optional[Dict]:
        """Cancel an order"""
        binance_symbol = self.pair_mapping.get(symbol, symbol.replace('/', ''))
        
        params = {
            'symbol': binance_symbol,
            'orderId': order_id
        }
        
        logger.info(f"Cancelling order {order_id} for {symbol}")
        result = self._make_request('DELETE', '/api/v3/order', params=params, signed=True)
        
        if result:
            logger.info(f"✓ Order cancelled: {order_id}")
        
        return result
    
    def get_order_status(self, symbol: str, order_id: int) -> Optional[Dict]:
        """Get order status"""
        binance_symbol = self.pair_mapping.get(symbol, symbol.replace('/', ''))
        
        params = {
            'symbol': binance_symbol,
            'orderId': order_id
        }
        
        return self._make_request('GET', '/api/v3/order', params=params, signed=True)
    
    def get_open_orders(self, symbol: Optional[str] = None) -> List[Dict]:
        """Get all open orders"""
        params = {}
        
        if symbol:
            binance_symbol = self.pair_mapping.get(symbol, symbol.replace('/', ''))
            params['symbol'] = binance_symbol
        
        result = self._make_request('GET', '/api/v3/openOrders', params=params, signed=True)
        
        return result if result else []
    
    def get_trade_history(self, symbol: str, limit: int = 50) -> List[Dict]:
        """Get trade history for a symbol"""
        binance_symbol = self.pair_mapping.get(symbol, symbol.replace('/', ''))
        
        params = {
            'symbol': binance_symbol,
            'limit': limit
        }
        
        result = self._make_request('GET', '/api/v3/myTrades', params=params, signed=True)
        
        return result if result else []
    
    def get_all_orders(self, symbol: str, limit: int = 50) -> List[Dict]:
        """Get all orders (filled, cancelled, etc.)"""
        binance_symbol = self.pair_mapping.get(symbol, symbol.replace('/', ''))
        
        params = {
            'symbol': binance_symbol,
            'limit': limit
        }
        
        result = self._make_request('GET', '/api/v3/allOrders', params=params, signed=True)
        
        return result if result else []
    
    def calculate_quantity(self, symbol: str, usdt_amount: float, current_price: float) -> float:
        """Calculate quantity based on USDT amount"""
        quantity = usdt_amount / current_price
        
        # Round to appropriate decimal places based on symbol
        if 'BTC' in symbol:
            return round(quantity, 6)
        elif 'ETH' in symbol:
            return round(quantity, 5)
        elif 'DOGE' in symbol or 'XRP' in symbol:
            return round(quantity, 0)
        else:
            return round(quantity, 4)
    
    def get_trading_info(self) -> Dict:
        """Get trading account info summary"""
        account = self.get_account_info()
        
        if not account:
            return {
                'configured': False,
                'mode': self.mode,
                'error': 'Failed to fetch account info'
            }
        
        balances = self.get_all_balances()
        open_orders = self.get_open_orders()
        
        return {
            'configured': True,
            'mode': self.mode,
            'can_trade': account.get('canTrade', False),
            'can_withdraw': account.get('canWithdraw', False),
            'can_deposit': account.get('canDeposit', False),
            'balances': balances,
            'open_orders_count': len(open_orders),
            'account_type': account.get('accountType', 'UNKNOWN')
        }

# Global instance
binance_trading = BinanceTrading()
