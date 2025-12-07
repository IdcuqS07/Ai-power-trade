"""
Auto-Settlement Service for Blockchain Trades
Monitors and settles trades automatically
"""
import asyncio
import logging
from web3 import Web3
from datetime import datetime
import json
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class SettlementService:
    def __init__(self):
        # Load deployment info
        deployment_file = Path(__file__).parent.parent / "blockchain" / "deployment.json"
        with open(deployment_file, 'r') as f:
            deployment = json.load(f)
        
        self.contract_address = deployment['contract_address']
        self.abi = deployment['abi']
        
        # Connect to BSC Testnet
        self.rpcs = [
            "https://bsc-testnet.publicnode.com",
            "https://data-seed-prebsc-1-s1.binance.org:8545"
        ]
        
        self.w3 = None
        self.contract = None
        self.account = None
        
        self._connect()
        self._load_account()
    
    def _connect(self):
        """Connect to BSC Testnet"""
        for rpc in self.rpcs:
            try:
                w3 = Web3(Web3.HTTPProvider(rpc, request_kwargs={'timeout': 10}))
                
                # Inject POA middleware for BSC (handles extraData field)
                try:
                    from web3.middleware import ExtraDataToPOAMiddleware
                    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
                except:
                    # Fallback for older web3.py versions
                    pass
                
                if w3.is_connected():
                    self.w3 = w3
                    self.contract = w3.eth.contract(
                        address=Web3.to_checksum_address(self.contract_address),
                        abi=self.abi
                    )
                    logger.info(f"✓ Settlement service connected to {rpc}")
                    return True
            except Exception as e:
                continue
        
        logger.error("Failed to connect settlement service")
        return False
    
    def _load_account(self):
        """Load owner account for settlement"""
        # For demo: Use environment variable or skip if not available
        private_key = os.getenv('OWNER_PRIVATE_KEY')
        if private_key:
            if not private_key.startswith('0x'):
                private_key = '0x' + private_key
            self.account = self.w3.eth.account.from_key(private_key)
            logger.info(f"✓ Settlement account loaded: {self.account.address}")
        else:
            logger.warning("⚠ No OWNER_PRIVATE_KEY found - auto-settlement disabled")
            logger.info("💡 Set OWNER_PRIVATE_KEY in .env to enable auto-settlement")
    
    async def monitor_and_settle(self):
        """Monitor trades and auto-settle"""
        if not self.account:
            logger.info("Auto-settlement disabled (no private key)")
            return
        
        logger.info("🤖 Auto-settlement service started")
        
        while True:
            try:
                # Get trade counter
                trade_counter = self.contract.functions.tradeCounter().call()
                logger.info(f"🔍 Checking trades... Total: {trade_counter}")
                
                # Check recent trades (last 10)
                unsettled_count = 0
                for trade_id in range(max(1, trade_counter - 10), trade_counter + 1):
                    try:
                        trade = self.contract.functions.getTrade(trade_id).call()
                        
                        # Check if unsettled and older than 1 minute
                        if not trade[8]:  # settled flag
                            unsettled_count += 1
                            trade_time = trade[7]  # timestamp
                            current_time = self.w3.eth.get_block('latest')['timestamp']
                            age = current_time - trade_time
                            
                            logger.info(f"📊 Trade {trade_id}: age={age}s, settled={trade[8]}")
                            
                            if age >= 60:  # 1 minute
                                logger.info(f"⏰ Trade {trade_id} ready for settlement (age: {age}s)")
                                await self._settle_trade(trade_id, trade)
                    
                    except Exception as e:
                        logger.warning(f"Error checking trade {trade_id}: {e}")
                        continue
                
                logger.info(f"✓ Found {unsettled_count} unsettled trades")
                
                # Wait 30 seconds before next check
                logger.info("💤 Waiting 30 seconds...")
                await asyncio.sleep(30)
                
            except Exception as e:
                logger.error(f"Settlement monitor error: {e}")
                await asyncio.sleep(30)
    
    async def _settle_trade(self, trade_id, trade):
        """Settle a trade with simulated P&L"""
        try:
            # Simulate P&L (random between -5% to +8%)
            import random
            amount = trade[4]  # amount
            pnl_percent = random.uniform(-0.05, 0.08)
            profit_loss = int(amount * pnl_percent)
            
            logger.info(f"Settling trade {trade_id}: P&L = {profit_loss}")
            
            # Build transaction
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            
            transaction = self.contract.functions.settleTrade(
                trade_id,
                profit_loss
            ).build_transaction({
                'chainId': 97,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
            })
            
            # Sign and send
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            logger.info(f"Settlement tx sent: {tx_hash.hex()}")
            
            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt['status'] == 1:
                logger.info(f"✓ Trade {trade_id} settled successfully!")
            else:
                logger.error(f"✗ Trade {trade_id} settlement failed")
            
        except Exception as e:
            logger.error(f"Settlement error for trade {trade_id}: {e}")

# Global instance
settlement_service = SettlementService()
