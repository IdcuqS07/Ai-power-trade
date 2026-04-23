import hashlib
import json
from datetime import datetime, timedelta
import random
from typing import Dict, List, Optional

class GovernanceSystem:
    def __init__(self):
        self.proposals = []
        self.votes = []
        self.voting_power = {}
        self.quorum_threshold = 0.51  # 51% quorum
        self.proposal_duration = timedelta(days=7)
    
    def create_proposal(self, proposer_id: str, title: str, description: str, proposal_type: str, parameters: Dict):
        proposal = {
            'id': len(self.proposals) + 1,
            'proposer_id': proposer_id,
            'title': title,
            'description': description,
            'type': proposal_type,  # 'PARAMETER_CHANGE', 'STRATEGY_UPDATE', 'FUND_ALLOCATION'
            'parameters': parameters,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + self.proposal_duration,
            'status': 'ACTIVE',
            'votes_for': 0,
            'votes_against': 0,
            'total_voting_power': 0
        }
        self.proposals.append(proposal)
        return proposal
    
    def cast_vote(self, voter_id: str, proposal_id: int, vote: str, voting_power: float):
        if vote not in ['FOR', 'AGAINST']:
            return {'success': False, 'reason': 'Invalid vote'}
        
        proposal = next((p for p in self.proposals if p['id'] == proposal_id), None)
        if not proposal:
            return {'success': False, 'reason': 'Proposal not found'}
        
        if proposal['status'] != 'ACTIVE':
            return {'success': False, 'reason': 'Proposal not active'}
        
        if datetime.now() > proposal['expires_at']:
            proposal['status'] = 'EXPIRED'
            return {'success': False, 'reason': 'Proposal expired'}
        
        # Check if already voted
        existing_vote = next((v for v in self.votes if v['voter_id'] == voter_id and v['proposal_id'] == proposal_id), None)
        if existing_vote:
            return {'success': False, 'reason': 'Already voted'}
        
        vote_record = {
            'voter_id': voter_id,
            'proposal_id': proposal_id,
            'vote': vote,
            'voting_power': voting_power,
            'timestamp': datetime.now()
        }
        
        self.votes.append(vote_record)
        
        if vote == 'FOR':
            proposal['votes_for'] += voting_power
        else:
            proposal['votes_against'] += voting_power
        
        proposal['total_voting_power'] += voting_power
        
        # Check if proposal passes
        self.check_proposal_result(proposal)
        
        return {'success': True, 'vote_id': len(self.votes)}
    
    def check_proposal_result(self, proposal):
        total_possible_power = sum(self.voting_power.values()) if self.voting_power else 1000
        participation_rate = proposal['total_voting_power'] / total_possible_power
        
        if participation_rate >= self.quorum_threshold:
            if proposal['votes_for'] > proposal['votes_against']:
                proposal['status'] = 'PASSED'
                self.execute_proposal(proposal)
            else:
                proposal['status'] = 'REJECTED'
    
    def execute_proposal(self, proposal):
        # Execute the proposal based on type
        if proposal['type'] == 'PARAMETER_CHANGE':
            # Update system parameters
            pass
        elif proposal['type'] == 'STRATEGY_UPDATE':
            # Update trading strategies
            pass
        elif proposal['type'] == 'FUND_ALLOCATION':
            # Allocate funds
            pass

class LiquidityPool:
    def __init__(self):
        self.total_liquidity = 0
        self.providers = {}
        self.rewards_pool = 0
        self.fee_rate = 0.003  # 0.3% fee
    
    def add_liquidity(self, provider_id: str, amount: float):
        if provider_id not in self.providers:
            self.providers[provider_id] = {'amount': 0, 'share': 0, 'rewards_earned': 0}
        
        old_total = self.total_liquidity
        self.total_liquidity += amount
        self.providers[provider_id]['amount'] += amount
        
        # Calculate new share
        if old_total == 0:
            self.providers[provider_id]['share'] = 1.0
        else:
            self.providers[provider_id]['share'] = self.providers[provider_id]['amount'] / self.total_liquidity
        
        return {
            'success': True,
            'new_share': self.providers[provider_id]['share'],
            'total_liquidity': self.total_liquidity
        }
    
    def remove_liquidity(self, provider_id: str, amount: float):
        if provider_id not in self.providers:
            return {'success': False, 'reason': 'Provider not found'}
        
        if self.providers[provider_id]['amount'] < amount:
            return {'success': False, 'reason': 'Insufficient liquidity'}
        
        self.providers[provider_id]['amount'] -= amount
        self.total_liquidity -= amount
        
        # Recalculate shares
        for pid in self.providers:
            if self.total_liquidity > 0:
                self.providers[pid]['share'] = self.providers[pid]['amount'] / self.total_liquidity
            else:
                self.providers[pid]['share'] = 0
        
        return {
            'success': True,
            'remaining_amount': self.providers[provider_id]['amount'],
            'total_liquidity': self.total_liquidity
        }
    
    def distribute_rewards(self, total_rewards: float):
        if self.total_liquidity == 0:
            return
        
        for provider_id in self.providers:
            provider_reward = total_rewards * self.providers[provider_id]['share']
            self.providers[provider_id]['rewards_earned'] += provider_reward
        
        self.rewards_pool += total_rewards

class EnhancedSmartContract:
    def __init__(self):
        self.governance = GovernanceSystem()
        self.liquidity_pool = LiquidityPool()
        self.trading_rules = {
            'min_confidence': 70,
            'max_position_size': 0.1,
            'max_daily_trades': 50,
            'min_time_between_trades': 30,
            'allowed_symbols': ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'],
            'max_slippage': 0.005,
            'stop_loss_threshold': 0.05,
            'take_profit_threshold': 0.03
        }
        self.performance_metrics = {
            'total_trades': 0,
            'winning_trades': 0,
            'total_pnl': 0,
            'max_drawdown': 0,
            'sharpe_ratio': 0,
            'win_rate': 0
        }
        self.circuit_breakers = {
            'daily_loss_limit': 1000,
            'consecutive_losses': 5,
            'volatility_threshold': 0.1
        }
        self.emergency_stop = False
        self.whitelisted_addresses = set()
        self.blacklisted_addresses = set()
    
    def validate_advanced_signal(self, signal_data: Dict) -> Dict:
        """Enhanced signal validation with multiple checks"""
        
        # Basic validation
        basic_validation = self.validate_signal(signal_data)
        if not basic_validation['valid']:
            return basic_validation
        
        # Advanced validations
        validations = []
        
        # 1. Confidence threshold
        if signal_data.get('confidence', 0) < self.trading_rules['min_confidence']:
            validations.append(f"Confidence {signal_data.get('confidence')}% below threshold {self.trading_rules['min_confidence']}%")
        
        # 2. Position size validation
        position_size = signal_data.get('position_size', 0)
        if position_size > self.trading_rules['max_position_size']:
            validations.append(f"Position size {position_size} exceeds limit {self.trading_rules['max_position_size']}")
        
        # 3. Symbol validation
        symbol = signal_data.get('symbol', '')
        if symbol not in self.trading_rules['allowed_symbols']:
            validations.append(f"Symbol {symbol} not in allowed list")
        
        # 4. Slippage check
        expected_slippage = signal_data.get('expected_slippage', 0)
        if expected_slippage > self.trading_rules['max_slippage']:
            validations.append(f"Expected slippage {expected_slippage} exceeds limit {self.trading_rules['max_slippage']}")
        
        # 5. Circuit breaker checks
        if self.emergency_stop:
            validations.append("Emergency stop activated")
        
        # 6. Address validation
        trader_address = signal_data.get('trader_address', '')
        if trader_address in self.blacklisted_addresses:
            validations.append("Trader address is blacklisted")
        
        if validations:
            return {
                'valid': False,
                'reason': '; '.join(validations),
                'validation_details': validations
            }
        
        return {'valid': True, 'reason': 'All advanced validations passed'}
    
    def validate_signal(self, signal_data: Dict) -> Dict:
        """Basic signal validation (existing method)"""
        if signal_data.get('confidence', 0) < 70:
            return {'valid': False, 'reason': 'Confidence below threshold'}
        
        if signal_data.get('symbol', '') not in ['BTCUSDT', 'ETHUSDT']:
            return {'valid': False, 'reason': 'Symbol not allowed'}
        
        if random.random() < 0.1:
            return {'valid': False, 'reason': 'Random validation failure'}
        
        return {'valid': True, 'reason': 'Basic validation passed'}
    
    def execute_trade_with_risk_management(self, trade_data: Dict) -> Dict:
        """Execute trade with comprehensive risk management"""
        
        # Pre-execution risk checks
        risk_assessment = self.assess_trade_risk(trade_data)
        if risk_assessment['risk_level'] == 'HIGH':
            return {
                'success': False,
                'reason': 'Trade rejected due to high risk',
                'risk_assessment': risk_assessment
            }
        
        # Execute trade
        execution_result = self.execute_trade(trade_data)
        
        # Post-execution updates
        if execution_result['success']:
            self.update_performance_metrics(trade_data, execution_result)
            self.check_circuit_breakers()
        
        return execution_result
    
    def assess_trade_risk(self, trade_data: Dict) -> Dict:
        """Comprehensive risk assessment"""
        risk_factors = []
        risk_score = 0
        
        # Market volatility risk
        volatility = trade_data.get('market_volatility', 0)
        if volatility > self.circuit_breakers['volatility_threshold']:
            risk_factors.append('High market volatility')
            risk_score += 30
        
        # Position concentration risk
        position_size = trade_data.get('position_size', 0)
        if position_size > 0.05:  # 5% of portfolio
            risk_factors.append('Large position size')
            risk_score += 20
        
        # Correlation risk (simplified)
        if len(risk_factors) > 1:
            risk_score += 15
        
        # Liquidity risk
        if trade_data.get('market_depth', 1) < 0.5:
            risk_factors.append('Low market liquidity')
            risk_score += 25
        
        risk_level = 'LOW'
        if risk_score > 50:
            risk_level = 'HIGH'
        elif risk_score > 25:
            risk_level = 'MEDIUM'
        
        return {
            'risk_level': risk_level,
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'recommendation': 'REJECT' if risk_level == 'HIGH' else 'PROCEED'
        }
    
    def execute_trade(self, trade_data: Dict) -> Dict:
        """Execute trade (existing method enhanced)"""
        trade_id = f"trade_{len(self.on_chain_records) + 1}"
        
        # Simulate execution
        execution_price = trade_data.get('price', 50000) * (1 + random.uniform(-0.001, 0.001))
        slippage = abs(execution_price - trade_data.get('price', 50000)) / trade_data.get('price', 50000)
        
        result = {
            'success': True,
            'trade_id': trade_id,
            'execution_price': execution_price,
            'slippage': slippage,
            'timestamp': datetime.now().isoformat(),
            'gas_used': random.uniform(21000, 50000)
        }
        
        # Record on-chain
        self.record_on_chain(result)
        
        return result
    
    def update_performance_metrics(self, trade_data: Dict, execution_result: Dict):
        """Update performance tracking"""
        self.performance_metrics['total_trades'] += 1
        
        # Simulate P&L calculation
        pnl = random.uniform(-100, 150)
        self.performance_metrics['total_pnl'] += pnl
        
        if pnl > 0:
            self.performance_metrics['winning_trades'] += 1
        
        # Update win rate
        self.performance_metrics['win_rate'] = (
            self.performance_metrics['winning_trades'] / self.performance_metrics['total_trades']
        )
        
        # Update max drawdown (simplified)
        if pnl < 0:
            current_drawdown = abs(pnl) / 10000  # Assuming 10k portfolio
            self.performance_metrics['max_drawdown'] = max(
                self.performance_metrics['max_drawdown'], 
                current_drawdown
            )
    
    def check_circuit_breakers(self):
        """Check and activate circuit breakers if needed"""
        
        # Daily loss limit
        daily_pnl = self.get_daily_pnl()
        if daily_pnl < -self.circuit_breakers['daily_loss_limit']:
            self.emergency_stop = True
            return {'triggered': True, 'reason': 'Daily loss limit exceeded'}
        
        # Max drawdown
        if self.performance_metrics['max_drawdown'] > 0.2:  # 20%
            self.emergency_stop = True
            return {'triggered': True, 'reason': 'Maximum drawdown exceeded'}
        
        return {'triggered': False}
    
    def get_daily_pnl(self) -> float:
        """Calculate daily P&L (simplified)"""
        return random.uniform(-500, 300)
    
    def record_on_chain(self, trade_data: Dict) -> Dict:
        """Enhanced on-chain recording"""
        record = {
            'id': len(getattr(self, 'on_chain_records', [])) + 1,
            'data': trade_data,
            'block_hash': hashlib.sha256(json.dumps(trade_data).encode()).hexdigest()[:16],
            'timestamp': datetime.now().isoformat(),
            'gas_used': trade_data.get('gas_used', random.uniform(21000, 50000)),
            'tx_hash': f"0x{hashlib.sha256(str(random.random()).encode()).hexdigest()}",
            'validator': 'enhanced_smart_contract_v2',
            'merkle_root': self.calculate_merkle_root()
        }
        
        if not hasattr(self, 'on_chain_records'):
            self.on_chain_records = []
        
        self.on_chain_records.append(record)
        return record
    
    def calculate_merkle_root(self) -> str:
        """Calculate Merkle root for integrity verification"""
        if not hasattr(self, 'on_chain_records') or not self.on_chain_records:
            return hashlib.sha256(b'genesis').hexdigest()[:16]
        
        # Simplified Merkle root calculation
        hashes = [record['block_hash'] for record in self.on_chain_records[-10:]]
        combined = ''.join(hashes)
        return hashlib.sha256(combined.encode()).hexdigest()[:16]
    
    def get_governance_proposals(self) -> List[Dict]:
        """Get all governance proposals"""
        return self.governance.proposals
    
    def get_performance_report(self) -> Dict:
        """Get comprehensive performance report"""
        return {
            'metrics': self.performance_metrics,
            'circuit_breakers': self.circuit_breakers,
            'emergency_stop': self.emergency_stop,
            'total_on_chain_records': len(getattr(self, 'on_chain_records', [])),
            'liquidity_pool': {
                'total_liquidity': self.liquidity_pool.total_liquidity,
                'providers_count': len(self.liquidity_pool.providers),
                'rewards_pool': self.liquidity_pool.rewards_pool
            }
        }
    
    def emergency_shutdown(self, reason: str) -> Dict:
        """Emergency shutdown procedure"""
        self.emergency_stop = True
        
        shutdown_record = {
            'type': 'EMERGENCY_SHUTDOWN',
            'reason': reason,
            'timestamp': datetime.now().isoformat(),
            'triggered_by': 'system',
            'affected_trades': self.performance_metrics['total_trades']
        }
        
        self.record_on_chain(shutdown_record)
        
        return {
            'success': True,
            'message': 'Emergency shutdown activated',
            'reason': reason,
            'shutdown_record': shutdown_record
        }