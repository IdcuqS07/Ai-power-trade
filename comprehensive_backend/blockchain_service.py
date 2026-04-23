"""
Blockchain Service - BSC Testnet Integration
Handles smart contract interactions for AITradeUSDT token
"""
from web3 import Web3
import json
import os
from pathlib import Path
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class BlockchainService:
    def __init__(self):
        # BSC Testnet RPCs (fallback support)
        self.rpcs = [
            "https://bsc-testnet.publicnode.com",
            "https://data-seed-prebsc-1-s1.binance.org:8545",
            "https://data-seed-prebsc-2-s1.binance.org:8545",
            "https://bsc-testnet.public.blastapi.io"
        ]
        
        self.chain_id = 97
        self.w3 = None
        self.contract = None
        self.contract_address = None
        self.connected = False
        
        # Try to connect
        self._connect()
        
        # Load contract if deployed
        self._load_contract()
    
    def _connect(self):
        """Connect to BSC Testnet with fallback"""
        for rpc in self.rpcs:
            try:
                w3 = Web3(Web3.HTTPProvider(rpc, request_kwargs={'timeout': 10}))
                if w3.is_connected():
                    self.w3 = w3
                    self.connected = True
                    logger.info(f"✓ Connected to BSC Testnet: {rpc}")
                    return True
            except Exception as e:
                logger.warning(f"Failed to connect to {rpc}: {e}")
                continue
        
        logger.error("Failed to connect to any BSC Testnet RPC")
        return False
    
    def _load_contract(self):
        """Load deployed contract from deployment.json"""
        deployment_file = Path(__file__).parent.parent / "blockchain" / "deployment.json"
        
        if not deployment_file.exists():
            logger.warning("Contract not deployed yet. Run: cd blockchain && python deploy.py")
            return False
        
        try:
            with open(deployment_file, 'r') as f:
                deployment = json.load(f)
            
            self.contract_address = deployment['contract_address']
            abi = deployment['abi']
            
            if self.w3:
                self.contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(self.contract_address),
                    abi=abi
                )
                logger.info(f"✓ Contract loaded: {self.contract_address}")
                return True
        except Exception as e:
            logger.error(f"Failed to load contract: {e}")
            return False
    
    def is_ready(self) -> bool:
        """Check if blockchain service is ready"""
        return self.connected and self.contract is not None
    
    def get_balance(self, address: str) -> float:
        """Get token balance for address"""
        if not self.is_ready():
            return 0.0
        
        try:
            checksum_address = Web3.to_checksum_address(address)
            balance_wei = self.contract.functions.balanceOf(checksum_address).call()
            balance = self.w3.from_wei(balance_wei, 'ether')
            return float(balance)
        except Exception as e:
            logger.error(f"Failed to get balance: {e}")
            return 0.0
    
    def can_claim_faucet(self, address: str) -> bool:
        """Check if address can claim from faucet"""
        if not self.is_ready():
            return False
        
        try:
            checksum_address = Web3.to_checksum_address(address)
            can_claim = self.contract.functions.canClaimFaucet(checksum_address).call()
            return can_claim
        except Exception as e:
            logger.error(f"Failed to check faucet eligibility: {e}")
            return False
    
    def time_until_next_claim(self, address: str) -> int:
        """Get seconds until next faucet claim"""
        if not self.is_ready():
            return 0
        
        try:
            checksum_address = Web3.to_checksum_address(address)
            seconds = self.contract.functions.timeUntilNextClaim(checksum_address).call()
            return int(seconds)
        except Exception as e:
            logger.error(f"Failed to get cooldown time: {e}")
            return 0
    
    def verify_transaction(self, tx_hash: str) -> Optional[Dict]:
        """Verify a transaction on blockchain"""
        if not self.connected:
            return None
        
        try:
            tx_receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            
            if tx_receipt:
                return {
                    'success': tx_receipt['status'] == 1,
                    'block_number': tx_receipt['blockNumber'],
                    'gas_used': tx_receipt['gasUsed'],
                    'from': tx_receipt['from'],
                    'to': tx_receipt['to'],
                    'transaction_hash': tx_hash
                }
        except Exception as e:
            logger.error(f"Failed to verify transaction: {e}")
            return None
    
    def get_token_info(self) -> Dict:
        """Get token information"""
        if not self.is_ready():
            return {
                'name': 'AI Trade USDT',
                'symbol': 'atUSDT',
                'decimals': 18,
                'deployed': False
            }
        
        try:
            return {
                'name': self.contract.functions.name().call(),
                'symbol': self.contract.functions.symbol().call(),
                'decimals': self.contract.functions.decimals().call(),
                'total_supply': float(self.w3.from_wei(
                    self.contract.functions.totalSupply().call(), 'ether'
                )),
                'faucet_amount': float(self.w3.from_wei(
                    self.contract.functions.faucetAmount().call(), 'ether'
                )),
                'contract_address': self.contract_address,
                'deployed': True,
                'network': 'BSC Testnet',
                'chain_id': self.chain_id,
                'explorer': f'https://testnet.bscscan.com/address/{self.contract_address}'
            }
        except Exception as e:
            logger.error(f"Failed to get token info: {e}")
            return {'deployed': False}
    
    def get_network_info(self) -> Dict:
        """Get network information"""
        if not self.connected:
            return {'connected': False}
        
        try:
            return {
                'connected': True,
                'chain_id': self.chain_id,
                'network': 'BSC Testnet',
                'latest_block': self.w3.eth.block_number,
                'gas_price': self.w3.from_wei(self.w3.eth.gas_price, 'gwei'),
                'explorer': 'https://testnet.bscscan.com'
            }
        except Exception as e:
            logger.error(f"Failed to get network info: {e}")
            return {'connected': False}

# Global instance
blockchain_service = BlockchainService()
