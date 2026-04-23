"""Smart Contract 2.0 Simulator - On-chain Logic"""
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
import hashlib
import json


class SmartContract:
    """Simulates blockchain smart contract for trade validation and settlement"""
    
    def __init__(self):
        self.contract_version = "2.0"
        self.risk_limits = {
            'max_position_size_pct': 20,  # Max 20% per position
            'max_daily_loss_pct': 5,  # Max 5% daily loss
            'max_leverage': 1,  # No leverage for demo
            'min_confidence': 0.6  # Minimum confidence for trade
        }
        self.on_chain_records = []
        self.validation_history = []
        self.governance_votes = []
        self.settlement_history = []
        
    def validate_decision(self, signal: Dict, portfolio: Dict) -> Dict:
        """Validate AI trading decision against risk rules"""
        validation_id = str(uuid.uuid4())
        
        validations = []
        is_valid = True
        
        # Check confidence threshold
        if signal['confidence'] < self.risk_limits['min_confidence']:
            validations.append({
                'rule': 'min_confidence',
                'passed': False,
                'message': f"Confidence {signal['confidence']} below minimum {self.risk_limits['min_confidence']}"
            })
            is_valid = False
        else:
            validations.append({
                'rule': 'min_confidence',
                'passed': True,
                'message': 'Confidence threshold met'
            })
        
        # Check position size
        if signal['position_size'] > self.risk_limits['max_position_size_pct']:
            validations.append({
                'rule': 'max_position_size',
                'passed': False,
                'message': f"Position size {signal['position_size']}% exceeds maximum {self.risk_limits['max_position_size_pct']}%"
            })
            is_valid = False
        else:
            validations.append({
                'rule': 'max_position_size',
                'passed': True,
                'message': 'Position size within limits'
            })
        
        # Check daily loss limit
        if portfolio['profit_loss_pct'] < -self.risk_limits['max_daily_loss_pct']:
            validations.append({
                'rule': 'max_daily_loss',
                'passed': False,
                'message': f"Daily loss {portfolio['profit_loss_pct']}% exceeds limit {self.risk_limits['max_daily_loss_pct']}%"
            })
            is_valid = False
        else:
            validations.append({
                'rule': 'max_daily_loss',
                'passed': True,
                'message': 'Daily loss within acceptable range'
            })
        
        # Check risk score
        if signal['risk_score'] > 80:
            validations.append({
                'rule': 'risk_score',
                'passed': False,
                'message': f"Risk score {signal['risk_score']} too high"
            })
            is_valid = False
        else:
            validations.append({
                'rule': 'risk_score',
                'passed': True,
                'message': 'Risk score acceptable'
            })
        
        validation_record = {
            'validation_id': validation_id,
            'signal': signal['signal'],
            'confidence': signal['confidence'],
            'is_valid': is_valid,
            'validations': validations,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'block_hash': self._generate_block_hash(validation_id)
        }
        
        self.validation_history.append(validation_record)
        
        return validation_record
    
    def record_trade(self, trade: Dict) -> Dict:
        """Record trade on-chain (simulated)"""
        record_id = str(uuid.uuid4())
        
        # Create on-chain record
        on_chain_record = {
            'record_id': record_id,
            'trade_id': trade['trade_id'],
            'symbol': trade['symbol'],
            'type': trade['type'],
            'quantity': trade['quantity'],
            'price': trade['price'],
            'value': trade['value'],
            'timestamp': trade['timestamp'],
            'block_number': len(self.on_chain_records) + 1,
            'block_hash': self._generate_block_hash(record_id),
            'previous_hash': self.on_chain_records[-1]['block_hash'] if self.on_chain_records else '0' * 64,
            'verified': True
        }
        
        self.on_chain_records.append(on_chain_record)
        
        return on_chain_record
    
    def settle_trade(self, trade: Dict, portfolio: Dict) -> Dict:
        """Automatic settlement and P&L distribution"""
        settlement_id = str(uuid.uuid4())
        
        settlement = {
            'settlement_id': settlement_id,
            'trade_id': trade['trade_id'],
            'symbol': trade['symbol'],
            'type': trade['type'],
            'profit_loss': trade.get('profit_loss', 0),
            'portfolio_value': portfolio['total_value'],
            'portfolio_pnl': portfolio['profit_loss'],
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'status': 'SETTLED',
            'block_hash': self._generate_block_hash(settlement_id)
        }
        
        self.settlement_history.append(settlement)
        
        return settlement
    
    def get_on_chain_records(self, limit: int = 50) -> List[Dict]:
        """Get on-chain trading records"""
        return self.on_chain_records[-limit:][::-1]
    
    def get_validation_history(self, limit: int = 50) -> List[Dict]:
        """Get validation history"""
        return self.validation_history[-limit:][::-1]
    
    def get_settlement_history(self, limit: int = 50) -> List[Dict]:
        """Get settlement history"""
        return self.settlement_history[-limit:][::-1]
    
    def update_risk_limits(self, new_limits: Dict) -> Dict:
        """Update risk limits (governance function)"""
        vote_id = str(uuid.uuid4())
        
        # Simulate governance vote
        vote = {
            'vote_id': vote_id,
            'proposal': 'Update Risk Limits',
            'new_limits': new_limits,
            'votes_for': 75,  # Simulated
            'votes_against': 25,
            'status': 'PASSED',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        self.governance_votes.append(vote)
        
        # Update limits
        self.risk_limits.update(new_limits)
        
        return {
            'success': True,
            'vote': vote,
            'new_limits': self.risk_limits
        }
    
    def get_risk_limits(self) -> Dict:
        """Get current risk limits"""
        return self.risk_limits
    
    def verify_chain_integrity(self) -> Dict:
        """Verify blockchain integrity"""
        if not self.on_chain_records:
            return {'valid': True, 'message': 'No records to verify'}
        
        for i, record in enumerate(self.on_chain_records):
            if i == 0:
                if record['previous_hash'] != '0' * 64:
                    return {
                        'valid': False,
                        'message': f"Genesis block has invalid previous hash",
                        'block_number': record['block_number']
                    }
            else:
                if record['previous_hash'] != self.on_chain_records[i-1]['block_hash']:
                    return {
                        'valid': False,
                        'message': f"Chain broken at block {record['block_number']}",
                        'block_number': record['block_number']
                    }
        
        return {
            'valid': True,
            'message': 'Chain integrity verified',
            'total_blocks': len(self.on_chain_records)
        }
    
    def _generate_block_hash(self, data: str) -> str:
        """Generate block hash (simulated)"""
        timestamp = datetime.now(timezone.utc).isoformat()
        hash_input = f"{data}{timestamp}{len(self.on_chain_records)}"
        return hashlib.sha256(hash_input.encode()).hexdigest()
    
    def get_contract_stats(self) -> Dict:
        """Get smart contract statistics"""
        total_validations = len(self.validation_history)
        passed_validations = len([v for v in self.validation_history if v['is_valid']])
        
        return {
            'contract_version': self.contract_version,
            'total_validations': total_validations,
            'passed_validations': passed_validations,
            'failed_validations': total_validations - passed_validations,
            'validation_pass_rate': round(passed_validations / total_validations * 100, 2) if total_validations > 0 else 0,
            'total_on_chain_records': len(self.on_chain_records),
            'total_settlements': len(self.settlement_history),
            'governance_votes': len(self.governance_votes),
            'risk_limits': self.risk_limits
        }
