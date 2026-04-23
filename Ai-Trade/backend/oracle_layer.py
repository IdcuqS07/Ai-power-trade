"""Oracle Layer - Bridge between AI Engine and Smart Contract"""
import hashlib
import json
from datetime import datetime, timezone
from typing import Dict
import uuid


class OracleLayer:
    """Simulates oracle service for data verification and transmission"""
    
    def __init__(self):
        self.oracle_version = "1.0"
        self.verification_history = []
        
    def verify_and_transmit(self, signal: Dict, market_data: Dict) -> Dict:
        """Verify AI signal and market data before transmitting to smart contract"""
        verification_id = str(uuid.uuid4())
        
        # Verify data integrity
        checks = []
        is_verified = True
        
        # Check signal completeness
        required_signal_fields = ['signal', 'confidence', 'risk_score', 'position_size']
        signal_complete = all(field in signal for field in required_signal_fields)
        checks.append({
            'check': 'signal_completeness',
            'passed': signal_complete,
            'message': 'Signal data complete' if signal_complete else 'Missing signal fields'
        })
        if not signal_complete:
            is_verified = False
        
        # Check market data validity
        market_data_valid = 'price' in market_data and market_data['price'] > 0
        checks.append({
            'check': 'market_data_validity',
            'passed': market_data_valid,
            'message': 'Market data valid' if market_data_valid else 'Invalid market data'
        })
        if not market_data_valid:
            is_verified = False
        
        # Check timestamp freshness (data should be recent)
        if 'timestamp' in signal:
            signal_time = datetime.fromisoformat(signal['timestamp'].replace('Z', '+00:00'))
            time_diff = (datetime.now(timezone.utc) - signal_time).total_seconds()
            is_fresh = time_diff < 60  # Data should be less than 60 seconds old
            checks.append({
                'check': 'data_freshness',
                'passed': is_fresh,
                'message': f'Data is {time_diff:.1f}s old' if is_fresh else 'Data too old'
            })
            if not is_fresh:
                is_verified = False
        
        # Anti-manipulation check (signal confidence range)
        confidence_valid = 0 <= signal.get('confidence', 0) <= 1
        checks.append({
            'check': 'confidence_range',
            'passed': confidence_valid,
            'message': 'Confidence in valid range' if confidence_valid else 'Invalid confidence value'
        })
        if not confidence_valid:
            is_verified = False
        
        # Generate data hash for integrity
        data_hash = self._generate_data_hash(signal, market_data)
        
        # Create verification record
        verification = {
            'verification_id': verification_id,
            'signal': signal['signal'],
            'confidence': signal['confidence'],
            'is_verified': is_verified,
            'checks': checks,
            'data_hash': data_hash,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'oracle_version': self.oracle_version
        }
        
        self.verification_history.append(verification)
        
        return verification
    
    def encrypt_data(self, data: Dict) -> Dict:
        """Simulate data encryption for secure transmission"""
        # In production, this would use actual encryption
        # For demo, we just add encryption metadata
        encrypted = {
            'encrypted': True,
            'encryption_method': 'AES-256-GCM',
            'data_hash': self._generate_data_hash(data, {}),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        return encrypted
    
    def get_verification_history(self, limit: int = 50) -> list:
        """Get verification history"""
        return self.verification_history[-limit:][::-1]
    
    def get_verification_stats(self) -> Dict:
        """Get oracle verification statistics"""
        total = len(self.verification_history)
        verified = len([v for v in self.verification_history if v['is_verified']])
        
        return {
            'total_verifications': total,
            'verified_count': verified,
            'failed_count': total - verified,
            'verification_rate': round(verified / total * 100, 2) if total > 0 else 0,
            'oracle_version': self.oracle_version
        }
    
    def _generate_data_hash(self, signal: Dict, market_data: Dict) -> str:
        """Generate hash for data integrity"""
        combined_data = json.dumps({**signal, **market_data}, sort_keys=True)
        return hashlib.sha256(combined_data.encode()).hexdigest()[:16]
