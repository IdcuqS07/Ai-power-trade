import requests
import websocket
import json
import threading
from datetime import datetime

class WeexAPI:
    def __init__(self):
        self.base_url = "https://api.weex.com"
        self.ws_url = "wss://stream.weex.com/ws"
        self.ws = None
        self.market_data = {}
        
    def get_market_data(self, symbol="BTCUSDT"):
        """Simulasi data market dari WEEX API"""
        try:
            # Simulasi response dari WEEX API
            price = 50000 + random.uniform(-2000, 2000)
            return {
                "symbol": symbol,
                "price": round(price, 2),
                "volume": random.uniform(1000, 10000),
                "change_24h": random.uniform(-5, 5),
                "high_24h": price + random.uniform(0, 1000),
                "low_24h": price - random.uniform(0, 1000),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {"error": str(e)}
    
    def get_orderbook(self, symbol="BTCUSDT"):
        """Simulasi orderbook data"""
        base_price = 50000
        return {
            "symbol": symbol,
            "bids": [[base_price - i*10, random.uniform(0.1, 5)] for i in range(10)],
            "asks": [[base_price + i*10, random.uniform(0.1, 5)] for i in range(10)],
            "timestamp": datetime.now().isoformat()
        }
    
    def place_order(self, symbol, side, amount, price=None):
        """Simulasi place order ke WEEX"""
        order_id = f"weex_{random.randint(100000, 999999)}"
        
        # Simulasi execution
        executed_price = price if price else (50000 + random.uniform(-100, 100))
        
        return {
            "order_id": order_id,
            "symbol": symbol,
            "side": side,
            "amount": amount,
            "price": executed_price,
            "status": "filled" if random.random() > 0.1 else "partial",
            "timestamp": datetime.now().isoformat()
        }
    
    def get_account_balance(self):
        """Simulasi account balance"""
        return {
            "USDT": random.uniform(8000, 12000),
            "BTC": random.uniform(0.1, 0.5),
            "timestamp": datetime.now().isoformat()
        }