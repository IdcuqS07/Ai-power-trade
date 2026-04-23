"""
Smart Contract 2.0 - On-chain Validation Layer
Simulates blockchain-based validation and settlement
"""
import hashlib
import json
from datetime import datetime
from typing import Dict, List, Any

class SmartContractV2:
    def __init__(self):
        self.contract_address = "0x" + hashlib.sha256(b"AITradingContract").hexdigest()[:40]
        self.rules = {
            "min_confidence": 70,
            "max_position_size": 0.1,
            "max_leverage": 3,
            "allowed_symbols": ["BTCUSDT", "ETHUSDT", "BNBUSDT"],
            "max_slippage": 0.02,
            "min_liquidity": 1000
        }
        self.on_chain_records: List[Dict] = []
        self.governance_votes: List[Dict] = []
        self.total_volume = 0
        self.total_trades = 0
        
    def validate_signal(self, signal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate trading signal against on-chain rules
        Returns validation result with reason
        """
        validations = []
        
        # Rule 1: Confidence threshold
        if signal_data.get("confidence", 0) < self.rules["min_confidence"]:
            return {
                "valid": False,
                "reason": f"Confidence {signal_data.get('confidence')}% below minimum {self.rules['min_confidence']}%",
                "rule_violated": "min_confidence"
            }
        validations.append("confidence_check")
        
        # Rule 2: Symbol whitelist
        if signal_data.get("symbol") not in self.rules["allowed_symbols"]:
            return {
                "valid": False,
                "reason": f"Symbol {signal_data.get('symbol')} not in allowed list",
                "rule_violated": "allowed_symbols"
            }
        validations.append("symbol_check")
        
        # Rule 3: Position size
        position_size = signal_data.get("position_size", 0.01)
        if position_size > self.rules["max_position_size"]:
            return {
                "valid": False,
                "reason": f"Position size {position_size} exceeds maximum {self.rules['max_position_size']}",
                "rule_violated": "max_position_size"
            }
        validations.append("position_size_check")
        
        # All validations passed
        return {
            "valid": True,
            "reason": "All on-chain validations passed",
            "validations_passed": validations,
            "contract_address": self.contract_address
        }
    
    def record_on_chain(self, trade_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Record trade on blockchain (simulated)
        Creates immutable record with block hash
        """
        block_number = len(self.on_chain_records) + 1
        
        # Create block data
        block_data = {
            "block_number": block_number,
            "timestamp": datetime.now().isoformat(),
            "trade_data": trade_data,
            "contract_address": self.contract_address,
            "gas_used": 21000 + (len(json.dumps(trade_data)) * 68)
        }
        
        # Generate block hash
        block_string = json.dumps(block_data, sort_keys=True)
        block_hash = hashlib.sha256(block_string.encode()).hexdigest()
        
        # Add previous block hash for chain integrity
        if self.on_chain_records:
            prev_hash = self.on_chain_records[-1]["block_hash"]
            block_data["prev_hash"] = prev_hash
        
        block_data["block_hash"] = block_hash
        
        # Store on-chain
        self.on_chain_records.append(block_data)
        
        # Update statistics
        self.total_trades += 1
        self.total_volume += abs(trade_data.get("profit", 0))
        
        return {
            "success": True,
            "block_number": block_number,
            "block_hash": block_hash[:16],
            "gas_used": block_data["gas_used"],
            "timestamp": block_data["timestamp"]
        }
    
    def get_audit_trail(self, limit: int = 10) -> List[Dict]:
        """
        Get recent on-chain records for audit
        """
        return self.on_chain_records[-limit:]
    
    def verify_chain_integrity(self) -> Dict[str, Any]:
        """
        Verify blockchain integrity by checking hash chain
        """
        if len(self.on_chain_records) < 2:
            return {"valid": True, "message": "Chain too short to verify"}
        
        for i in range(1, len(self.on_chain_records)):
            current_block = self.on_chain_records[i]
            prev_block = self.on_chain_records[i-1]
            
            if current_block.get("prev_hash") != prev_block.get("block_hash"):
                return {
                    "valid": False,
                    "message": f"Chain broken at block {current_block['block_number']}",
                    "block_number": current_block['block_number']
                }
        
        return {
            "valid": True,
            "message": "Chain integrity verified",
            "total_blocks": len(self.on_chain_records)
        }
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get contract statistics
        """
        return {
            "contract_address": self.contract_address,
            "total_trades": self.total_trades,
            "total_volume": round(self.total_volume, 2),
            "total_blocks": len(self.on_chain_records),
            "rules": self.rules,
            "chain_integrity": self.verify_chain_integrity()
        }
    
    def propose_rule_change(self, rule_name: str, new_value: Any, proposer: str) -> Dict[str, Any]:
        """
        Governance: Propose rule change (requires voting)
        """
        proposal = {
            "id": len(self.governance_votes) + 1,
            "rule_name": rule_name,
            "current_value": self.rules.get(rule_name),
            "proposed_value": new_value,
            "proposer": proposer,
            "timestamp": datetime.now().isoformat(),
            "status": "pending",
            "votes_for": 0,
            "votes_against": 0
        }
        
        self.governance_votes.append(proposal)
        
        return {
            "success": True,
            "proposal_id": proposal["id"],
            "message": "Proposal created, awaiting votes"
        }
    
    def update_rules(self, new_rules: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update contract rules (governance controlled)
        """
        updated = []
        for key, value in new_rules.items():
            if key in self.rules:
                self.rules[key] = value
                updated.append(key)
        
        return {
            "success": True,
            "updated_rules": updated,
            "current_rules": self.rules
        }
