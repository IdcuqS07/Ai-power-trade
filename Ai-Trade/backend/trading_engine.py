"""Trading Execution Engine"""
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
import random


class TradingEngine:
    """Simulated trading execution and portfolio management"""
    
    def __init__(self):
        self.portfolio = {
            'cash': 100000.0,  # Starting with $100k
            'positions': {},  # {symbol: {quantity, avg_price, value}}
            'total_value': 100000.0,
            'profit_loss': 0.0,
            'profit_loss_pct': 0.0
        }
        self.trade_history = []
        self.pending_orders = []
        
    def execute_trade(self, signal: Dict, symbol: str, current_price: float) -> Dict:
        """Execute a trade based on AI signal"""
        trade_id = str(uuid.uuid4())
        
        if signal['signal'] == 'HOLD' or signal['confidence'] < 0.6:
            return {
                'success': False,
                'reason': 'Signal confidence too low or HOLD signal',
                'trade_id': None
            }
        
        # Calculate position size in dollars
        position_size_pct = signal['position_size'] / 100
        position_value = self.portfolio['total_value'] * position_size_pct
        
        if signal['signal'] == 'BUY':
            # Check if we have enough cash
            if self.portfolio['cash'] < position_value:
                position_value = self.portfolio['cash'] * 0.95  # Use 95% of available cash
            
            if position_value < 100:  # Minimum trade size
                return {
                    'success': False,
                    'reason': 'Insufficient funds',
                    'trade_id': None
                }
            
            quantity = position_value / current_price
            
            # Execute buy
            if symbol not in self.portfolio['positions']:
                self.portfolio['positions'][symbol] = {
                    'quantity': quantity,
                    'avg_price': current_price,
                    'value': position_value
                }
            else:
                # Add to existing position
                pos = self.portfolio['positions'][symbol]
                total_quantity = pos['quantity'] + quantity
                pos['avg_price'] = ((pos['quantity'] * pos['avg_price']) + (quantity * current_price)) / total_quantity
                pos['quantity'] = total_quantity
                pos['value'] = total_quantity * current_price
            
            self.portfolio['cash'] -= position_value
            
            trade = {
                'trade_id': trade_id,
                'symbol': symbol,
                'type': 'BUY',
                'quantity': round(quantity, 6),
                'price': current_price,
                'value': round(position_value, 2),
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'status': 'EXECUTED',
                'confidence': signal['confidence'],
                'reasoning': signal['reasoning']
            }
            
        elif signal['signal'] == 'SELL':
            # Check if we have position
            if symbol not in self.portfolio['positions']:
                return {
                    'success': False,
                    'reason': 'No position to sell',
                    'trade_id': None
                }
            
            pos = self.portfolio['positions'][symbol]
            sell_quantity = pos['quantity'] * (position_size_pct * 2)  # Sell proportionally
            sell_quantity = min(sell_quantity, pos['quantity'])  # Don't sell more than we have
            
            if sell_quantity < 0.0001:  # Minimum sell quantity
                return {
                    'success': False,
                    'reason': 'Position too small to sell',
                    'trade_id': None
                }
            
            sell_value = sell_quantity * current_price
            
            # Execute sell
            self.portfolio['cash'] += sell_value
            pos['quantity'] -= sell_quantity
            
            # Calculate P&L for this trade
            cost_basis = sell_quantity * pos['avg_price']
            trade_pnl = sell_value - cost_basis
            
            # Remove position if fully sold
            if pos['quantity'] < 0.0001:
                del self.portfolio['positions'][symbol]
            else:
                pos['value'] = pos['quantity'] * current_price
            
            trade = {
                'trade_id': trade_id,
                'symbol': symbol,
                'type': 'SELL',
                'quantity': round(sell_quantity, 6),
                'price': current_price,
                'value': round(sell_value, 2),
                'profit_loss': round(trade_pnl, 2),
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'status': 'EXECUTED',
                'confidence': signal['confidence'],
                'reasoning': signal['reasoning']
            }
        
        self.trade_history.append(trade)
        self._update_portfolio_value()
        
        return {
            'success': True,
            'trade': trade,
            'trade_id': trade_id
        }
    
    def _update_portfolio_value(self, current_prices: Optional[Dict] = None):
        """Update total portfolio value"""
        positions_value = 0
        
        for symbol, pos in self.portfolio['positions'].items():
            if current_prices and symbol in current_prices:
                price = current_prices[symbol]
                pos['value'] = pos['quantity'] * price
            positions_value += pos['value']
        
        self.portfolio['total_value'] = self.portfolio['cash'] + positions_value
        
        # Calculate P&L
        initial_value = 100000.0
        self.portfolio['profit_loss'] = self.portfolio['total_value'] - initial_value
        self.portfolio['profit_loss_pct'] = (self.portfolio['profit_loss'] / initial_value) * 100
    
    def get_portfolio(self, current_prices: Optional[Dict] = None) -> Dict:
        """Get current portfolio status"""
        self._update_portfolio_value(current_prices)
        
        return {
            'cash': round(self.portfolio['cash'], 2),
            'positions': {
                symbol: {
                    'quantity': round(pos['quantity'], 6),
                    'avg_price': round(pos['avg_price'], 2),
                    'current_value': round(pos['value'], 2)
                }
                for symbol, pos in self.portfolio['positions'].items()
            },
            'total_value': round(self.portfolio['total_value'], 2),
            'profit_loss': round(self.portfolio['profit_loss'], 2),
            'profit_loss_pct': round(self.portfolio['profit_loss_pct'], 2),
            'positions_count': len(self.portfolio['positions'])
        }
    
    def get_trade_history(self, limit: int = 50) -> List[Dict]:
        """Get trade history"""
        return self.trade_history[-limit:][::-1]  # Most recent first
    
    def get_performance_metrics(self) -> Dict:
        """Calculate performance metrics"""
        if not self.trade_history:
            return {
                'total_trades': 0,
                'winning_trades': 0,
                'losing_trades': 0,
                'win_rate': 0,
                'avg_profit': 0,
                'avg_loss': 0,
                'profit_factor': 0
            }
        
        total_trades = len(self.trade_history)
        sell_trades = [t for t in self.trade_history if t['type'] == 'SELL']
        
        winning_trades = [t for t in sell_trades if t.get('profit_loss', 0) > 0]
        losing_trades = [t for t in sell_trades if t.get('profit_loss', 0) < 0]
        
        total_profit = sum(t.get('profit_loss', 0) for t in winning_trades)
        total_loss = abs(sum(t.get('profit_loss', 0) for t in losing_trades))
        
        return {
            'total_trades': total_trades,
            'winning_trades': len(winning_trades),
            'losing_trades': len(losing_trades),
            'win_rate': round(len(winning_trades) / len(sell_trades) * 100, 2) if sell_trades else 0,
            'avg_profit': round(total_profit / len(winning_trades), 2) if winning_trades else 0,
            'avg_loss': round(total_loss / len(losing_trades), 2) if losing_trades else 0,
            'profit_factor': round(total_profit / total_loss, 2) if total_loss > 0 else 0,
            'total_profit': round(total_profit, 2),
            'total_loss': round(total_loss, 2)
        }
