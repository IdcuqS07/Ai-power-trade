"""
Backtesting Engine for AI Trading Strategies
Special feature for WEEX AI Trading Hackathon
"""
import numpy as np
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import random


class BacktestEngine:
    """Backtest trading strategies with historical data"""
    
    def __init__(self):
        self.results = []
        
    def run_backtest(
        self,
        symbol: str,
        strategy: str = "ai_multi_indicator",
        period_days: int = 30,
        initial_balance: float = 10000.0
    ) -> Dict:
        """
        Run backtest simulation
        
        Args:
            symbol: Trading symbol (BTC, ETH, etc.)
            strategy: Strategy name
            period_days: Backtest period in days
            initial_balance: Starting balance
            
        Returns:
            Backtest results with metrics
        """
        
        # Generate historical price data
        prices = self._generate_historical_prices(symbol, period_days * 24)  # Hourly data
        
        # Initialize backtest state
        balance = initial_balance
        position = 0
        trades = []
        equity_curve = [initial_balance]
        
        # Run simulation
        for i in range(len(prices) - 1):
            current_price = prices[i]
            next_price = prices[i + 1]
            
            # Generate signal based on strategy
            signal = self._generate_signal(prices[:i+1], strategy)
            
            # Execute trade
            if signal == "BUY" and position == 0:
                # Open long position
                position_size = balance * 0.1  # 10% of balance
                quantity = position_size / current_price
                position = quantity
                balance -= position_size
                
                trades.append({
                    "type": "BUY",
                    "price": current_price,
                    "quantity": quantity,
                    "value": position_size,
                    "timestamp": i
                })
                
            elif signal == "SELL" and position > 0:
                # Close position
                position_value = position * current_price
                profit = position_value - (position * trades[-1]["price"])
                balance += position_value
                
                trades.append({
                    "type": "SELL",
                    "price": current_price,
                    "quantity": position,
                    "value": position_value,
                    "profit": profit,
                    "timestamp": i
                })
                
                position = 0
            
            # Update equity curve
            total_equity = balance + (position * current_price if position > 0 else 0)
            equity_curve.append(total_equity)
        
        # Close any open position at end
        if position > 0:
            final_value = position * prices[-1]
            balance += final_value
            trades.append({
                "type": "SELL",
                "price": prices[-1],
                "quantity": position,
                "value": final_value,
                "profit": final_value - (position * trades[-1]["price"]),
                "timestamp": len(prices) - 1
            })
        
        # Calculate metrics
        metrics = self._calculate_metrics(
            trades, equity_curve, initial_balance, balance
        )
        
        result = {
            "symbol": symbol,
            "strategy": strategy,
            "period_days": period_days,
            "initial_balance": initial_balance,
            "final_balance": balance,
            "total_return": ((balance - initial_balance) / initial_balance) * 100,
            "total_trades": len([t for t in trades if t["type"] == "BUY"]),
            "winning_trades": len([t for t in trades if t.get("profit", 0) > 0]),
            "losing_trades": len([t for t in trades if t.get("profit", 0) < 0]),
            "metrics": metrics,
            "trades": trades[-10:],  # Last 10 trades
            "equity_curve": equity_curve[-100:],  # Last 100 points
            "timestamp": datetime.now().isoformat()
        }
        
        self.results.append(result)
        return result
    
    def compare_strategies(
        self,
        symbol: str,
        strategies: List[str],
        period_days: int = 30
    ) -> Dict:
        """Compare multiple strategies"""
        
        results = []
        for strategy in strategies:
            result = self.run_backtest(symbol, strategy, period_days)
            results.append({
                "strategy": strategy,
                "return": result["total_return"],
                "win_rate": result["metrics"]["win_rate"],
                "sharpe_ratio": result["metrics"]["sharpe_ratio"],
                "max_drawdown": result["metrics"]["max_drawdown"],
                "total_trades": result["total_trades"]
            })
        
        # Sort by return
        results.sort(key=lambda x: x["return"], reverse=True)
        
        return {
            "symbol": symbol,
            "period_days": period_days,
            "strategies": results,
            "best_strategy": results[0]["strategy"] if results else None,
            "timestamp": datetime.now().isoformat()
        }
    
    def _generate_historical_prices(self, symbol: str, periods: int) -> List[float]:
        """Generate realistic historical price data"""
        base_prices = {
            "BTC": 50000,
            "ETH": 3000,
            "BNB": 300,
            "SOL": 100
        }
        
        base = base_prices.get(symbol, 1000)
        prices = [base]
        
        # Generate price movement with trend and volatility
        trend = random.uniform(-0.0001, 0.0002)  # Slight upward bias
        volatility = 0.02
        
        for _ in range(periods - 1):
            change = np.random.normal(trend, volatility)
            new_price = prices[-1] * (1 + change)
            prices.append(max(new_price, base * 0.5))  # Floor at 50% of base
        
        return prices
    
    def _generate_signal(self, prices: List[float], strategy: str) -> str:
        """Generate trading signal based on strategy"""
        
        if len(prices) < 20:
            return "HOLD"
        
        prices_arr = np.array(prices)
        
        if strategy == "ai_multi_indicator":
            # Multi-indicator strategy
            rsi = self._calculate_rsi(prices_arr)
            ma_short = np.mean(prices_arr[-5:])
            ma_long = np.mean(prices_arr[-20:])
            
            if rsi < 30 and ma_short > ma_long:
                return "BUY"
            elif rsi > 70 and ma_short < ma_long:
                return "SELL"
                
        elif strategy == "momentum":
            # Momentum strategy
            momentum = (prices_arr[-1] - prices_arr[-10]) / prices_arr[-10]
            if momentum > 0.02:
                return "BUY"
            elif momentum < -0.02:
                return "SELL"
                
        elif strategy == "mean_reversion":
            # Mean reversion strategy
            ma = np.mean(prices_arr[-20:])
            std = np.std(prices_arr[-20:])
            
            if prices_arr[-1] < ma - 2 * std:
                return "BUY"
            elif prices_arr[-1] > ma + 2 * std:
                return "SELL"
        
        return "HOLD"
    
    def _calculate_rsi(self, prices: np.ndarray, period: int = 14) -> float:
        """Calculate RSI indicator"""
        deltas = np.diff(prices[-period-1:])
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gain = np.mean(gains) if len(gains) > 0 else 0
        avg_loss = np.mean(losses) if len(losses) > 0 else 0
        
        if avg_loss == 0:
            return 100
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    def _calculate_metrics(
        self,
        trades: List[Dict],
        equity_curve: List[float],
        initial_balance: float,
        final_balance: float
    ) -> Dict:
        """Calculate performance metrics"""
        
        # Filter completed trades (with profit)
        completed_trades = [t for t in trades if "profit" in t]
        
        if not completed_trades:
            return {
                "win_rate": 0,
                "profit_factor": 0,
                "sharpe_ratio": 0,
                "max_drawdown": 0,
                "avg_profit": 0,
                "avg_loss": 0
            }
        
        # Win rate
        winning = [t for t in completed_trades if t["profit"] > 0]
        win_rate = (len(winning) / len(completed_trades)) * 100 if completed_trades else 0
        
        # Profit factor
        total_profit = sum(t["profit"] for t in winning)
        total_loss = abs(sum(t["profit"] for t in completed_trades if t["profit"] < 0))
        profit_factor = total_profit / total_loss if total_loss > 0 else 0
        
        # Sharpe ratio (simplified)
        returns = np.diff(equity_curve) / equity_curve[:-1]
        sharpe_ratio = (np.mean(returns) / np.std(returns)) * np.sqrt(252) if len(returns) > 0 and np.std(returns) > 0 else 0
        
        # Maximum drawdown
        peak = equity_curve[0]
        max_dd = 0
        for value in equity_curve:
            if value > peak:
                peak = value
            dd = (peak - value) / peak
            if dd > max_dd:
                max_dd = dd
        
        # Average profit/loss
        avg_profit = np.mean([t["profit"] for t in winning]) if winning else 0
        losing = [t for t in completed_trades if t["profit"] < 0]
        avg_loss = np.mean([t["profit"] for t in losing]) if losing else 0
        
        return {
            "win_rate": round(win_rate, 2),
            "profit_factor": round(profit_factor, 2),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "max_drawdown": round(max_dd * 100, 2),
            "avg_profit": round(avg_profit, 2),
            "avg_loss": round(avg_loss, 2),
            "total_profit": round(total_profit, 2),
            "total_loss": round(total_loss, 2)
        }
    
    def get_results_summary(self) -> Dict:
        """Get summary of all backtest results"""
        if not self.results:
            return {"message": "No backtest results available"}
        
        return {
            "total_backtests": len(self.results),
            "results": self.results[-5:],  # Last 5 results
            "timestamp": datetime.now().isoformat()
        }
