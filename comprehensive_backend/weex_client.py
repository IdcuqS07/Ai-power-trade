"""
WEEX API Client - Python Implementation
Based on official WEEX API documentation
For AI Trading + Smart Contract 2.0
"""
import hmac
import hashlib
import time
import requests
import logging
from typing import Dict, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


class WeexAPIClient:
    """Official WEEX API Client"""
    
    def __init__(self, api_key: str = None, secret_key: str = None, base_url: str = 'https://api.weex.com'):
        self.api_key = api_key
        self.secret_key = secret_key
        self.base_url = base_url
        self.ws_url = 'wss://stream.weex.com/ws'
        self.session = requests.Session()
        
        logger.info(f"WEEX API Client initialized with base URL: {base_url}")
    
    # ========== HELPER FUNCTIONS ==========
    
    def generate_signature(self, params: Dict, timestamp: str) -> str:
        """Generate signature for authenticated requests"""
        # Sort parameters
        sorted_params = '&'.join([f"{k}={v}" for k, v in sorted(params.items())])
        
        # Create string to sign
        string_to_sign = f"{timestamp}{self.api_key}{sorted_params}"
        
        # Generate HMAC SHA256 signature
        signature = hmac.new(
            self.secret_key.encode('utf-8'),
            string_to_sign.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return signature
    
    def make_request(self, method: str, endpoint: str, params: Dict = None) -> Dict:
        """Make authenticated API request"""
        if params is None:
            params = {}
        
        timestamp = str(int(time.time() * 1000))
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        # Add authentication if credentials provided
        if self.api_key and self.secret_key:
            signature = self.generate_signature(params, timestamp)
            headers.update({
                'X-WEEX-APIKEY': self.api_key,
                'X-WEEX-TIMESTAMP': timestamp,
                'X-WEEX-SIGNATURE': signature
            })
        
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method == 'GET':
                response = self.session.get(url, params=params, headers=headers, timeout=10)
            elif method == 'POST':
                response = self.session.post(url, json=params, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = self.session.delete(url, params=params, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"WEEX API Error: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            raise
    
    # ========== MARKET DATA ==========
    
    def get_ticker(self, symbol: str = 'BTCUSDT') -> Dict:
        """Get current ticker price"""
        return self.make_request('GET', '/api/v1/ticker/price', {'symbol': symbol})
    
    def get_24hr_ticker(self, symbol: str = 'BTCUSDT') -> Dict:
        """Get 24hr ticker statistics"""
        return self.make_request('GET', '/api/v1/ticker/24hr', {'symbol': symbol})
    
    def get_order_book(self, symbol: str = 'BTCUSDT', limit: int = 100) -> Dict:
        """Get order book depth"""
        return self.make_request('GET', '/api/v1/depth', {'symbol': symbol, 'limit': limit})
    
    def get_recent_trades(self, symbol: str = 'BTCUSDT', limit: int = 500) -> List[Dict]:
        """Get recent trades"""
        return self.make_request('GET', '/api/v1/trades', {'symbol': symbol, 'limit': limit})
    
    def get_klines(self, symbol: str = 'BTCUSDT', interval: str = '1m', limit: int = 500) -> List:
        """Get kline/candlestick data"""
        return self.make_request('GET', '/api/v1/klines', {
            'symbol': symbol,
            'interval': interval,
            'limit': limit
        })
    
    # ========== TRADING ==========
    
    def place_order(self, params: Dict) -> Dict:
        """
        Place new order
        
        Args:
            params: {
                'symbol': 'BTCUSDT',
                'side': 'BUY' or 'SELL',
                'type': 'LIMIT', 'MARKET', 'STOP_LOSS', etc.,
                'quantity': '0.001',
                'price': '50000.00',  # required for LIMIT orders
                'timeInForce': 'GTC', 'IOC', 'FOK'  # optional
            }
        """
        order_params = {
            'symbol': params['symbol'],
            'side': params['side'],
            'type': params['type'],
            'quantity': params['quantity']
        }
        
        # Add price for LIMIT orders
        if params['type'] == 'LIMIT':
            order_params['price'] = params['price']
            order_params['timeInForce'] = params.get('timeInForce', 'GTC')
        
        return self.make_request('POST', '/api/v1/order', order_params)
    
    def cancel_order(self, symbol: str, order_id: str) -> Dict:
        """Cancel existing order"""
        return self.make_request('DELETE', '/api/v1/order', {
            'symbol': symbol,
            'orderId': order_id
        })
    
    def get_order(self, symbol: str, order_id: str) -> Dict:
        """Get order status"""
        return self.make_request('GET', '/api/v1/order', {
            'symbol': symbol,
            'orderId': order_id
        })
    
    def get_open_orders(self, symbol: str = None) -> List[Dict]:
        """Get all open orders"""
        params = {}
        if symbol:
            params['symbol'] = symbol
        return self.make_request('GET', '/api/v1/openOrders', params)
    
    def get_all_orders(self, symbol: str, limit: int = 500) -> List[Dict]:
        """Get all orders (filled, cancelled, etc.)"""
        return self.make_request('GET', '/api/v1/allOrders', {
            'symbol': symbol,
            'limit': limit
        })
    
    # ========== ACCOUNT ==========
    
    def get_account_info(self) -> Dict:
        """Get account information"""
        return self.make_request('GET', '/api/v1/account', {})
    
    def get_balance(self) -> List[Dict]:
        """Get account balance"""
        account_info = self.get_account_info()
        return account_info.get('balances', [])
    
    def get_asset_balance(self, asset: str = 'USDT') -> Optional[Dict]:
        """Get specific asset balance"""
        balances = self.get_balance()
        for balance in balances:
            if balance.get('asset') == asset:
                return balance
        return None
    
    # ========== HEALTH CHECK ==========
    
    def ping(self) -> bool:
        """Check if API is accessible"""
        try:
            # Try multiple ping endpoints
            endpoints = [
                '/api/v1/ping',
                '/api/v1/time',
                '/open/api/common/ping'
            ]
            
            for endpoint in endpoints:
                try:
                    response = self.session.get(
                        f"{self.base_url}{endpoint}",
                        timeout=5
                    )
                    if response.status_code == 200:
                        logger.info(f"✓ WEEX API accessible via {endpoint}")
                        return True
                except:
                    continue
            
            return False
            
        except Exception as e:
            logger.error(f"Ping failed: {e}")
            return False


class WeexRiskManager:
    """Risk Management for WEEX Trading"""
    
    def __init__(self, config: Dict = None):
        if config is None:
            config = {}
        
        self.config = {
            'max_position_size': config.get('max_position_size', 0.05),  # 5%
            'min_confidence': config.get('min_confidence', 70),
            'max_daily_loss': config.get('max_daily_loss', 0.02),  # 2%
            'max_open_positions': config.get('max_open_positions', 3)
        }
        
        self.daily_pnl = 0
        self.open_positions = 0
    
    def evaluate_signal(self, signal: Dict) -> Dict:
        """Evaluate AI signal against risk parameters"""
        confidence = signal.get('confidence', 0)
        
        # Check 1: Confidence threshold
        if confidence < self.config['min_confidence']:
            return {
                'approved': False,
                'reason': f"Confidence {confidence}% below minimum {self.config['min_confidence']}%"
            }
        
        # Check 2: Daily loss limit
        if self.daily_pnl < -self.config['max_daily_loss']:
            return {
                'approved': False,
                'reason': 'Daily loss limit reached'
            }
        
        # Check 3: Max open positions
        if self.open_positions >= self.config['max_open_positions']:
            return {
                'approved': False,
                'reason': 'Maximum open positions reached'
            }
        
        return {'approved': True}
    
    def get_risk_percentage(self, confidence: float) -> float:
        """Get risk percentage based on confidence"""
        min_conf = self.config['min_confidence']
        max_size = self.config['max_position_size']
        
        # Normalize confidence
        normalized = (confidence - min_conf) / (100 - min_conf)
        
        return min(normalized * max_size, max_size)
    
    def update_pnl(self, pnl: float):
        """Update P&L tracking"""
        self.daily_pnl += pnl
    
    def reset_daily(self):
        """Reset daily tracking"""
        self.daily_pnl = 0


class WeexTradingEngine:
    """Trading Engine - Integrates with AI and Risk Management"""
    
    def __init__(self, weex_client: WeexAPIClient, risk_manager: WeexRiskManager):
        self.client = weex_client
        self.risk_manager = risk_manager
        self.active_orders = {}
        self.market_data = {}
    
    async def execute_ai_signal(self, signal: Dict) -> Dict:
        """Execute trade based on AI signal"""
        symbol = signal.get('symbol', 'BTCUSDT')
        side = signal.get('side', 'BUY')
        confidence = signal.get('confidence', 0)
        price = signal.get('price', 0)
        
        # Step 1: Risk Management Check
        risk_check = self.risk_manager.evaluate_signal(signal)
        
        if not risk_check['approved']:
            logger.warning(f"Signal rejected: {risk_check['reason']}")
            return {
                'success': False,
                'reason': risk_check['reason']
            }
        
        # Step 2: Calculate position size
        try:
            quantity = self.calculate_position_size(symbol, side, confidence)
            
            # Step 3: Prepare order parameters
            order_params = {
                'symbol': symbol,
                'side': side,
                'type': 'LIMIT',
                'quantity': f"{quantity:.8f}",
                'price': f"{price:.2f}",
                'timeInForce': 'GTC'
            }
            
            # Step 4: Place order
            order = self.client.place_order(order_params)
            
            # Step 5: Track order
            self.active_orders[order['orderId']] = {
                **order,
                'signal': signal,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"✓ Order placed successfully: {order['orderId']}")
            
            return {
                'success': True,
                'order': order
            }
            
        except Exception as e:
            logger.error(f"Failed to place order: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def calculate_position_size(self, symbol: str, side: str, confidence: float) -> float:
        """Calculate position size based on risk parameters"""
        try:
            # Get USDT balance
            balance = self.client.get_asset_balance('USDT')
            available_balance = float(balance.get('free', 0))
            
            # Use confidence to adjust position size
            risk_percentage = self.risk_manager.get_risk_percentage(confidence)
            position_value = available_balance * risk_percentage
            
            # Get current price
            ticker = self.client.get_ticker(symbol)
            current_price = float(ticker.get('price', 0))
            
            # Calculate quantity
            quantity = position_value / current_price
            
            return quantity
            
        except Exception as e:
            logger.error(f"Error calculating position size: {e}")
            return 0.001  # Minimum quantity
    
    def get_market_data(self, symbol: str) -> Optional[Dict]:
        """Get current market data"""
        return self.market_data.get(symbol)
