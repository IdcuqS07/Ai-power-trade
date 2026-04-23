#!/usr/bin/env python3
"""
Deploy AITradeUSDT to Polygon Amoy Testnet
"""
from web3 import Web3
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Polygon Amoy Configuration
POLYGON_RPC = os.getenv('POLYGON_RPC_URL', 'https://rpc-amoy.polygon.technology/')
CHAIN_ID = int(os.getenv('POLYGON_CHAIN_ID', '80002'))
PRIVATE_KEY = os.getenv('PRIVATE_KEY')

if not PRIVATE_KEY or PRIVATE_KEY == 'YOUR_PRIVATE_KEY_HERE':
    print("❌ Error: Please set PRIVATE_KEY in .env file")
    exit(1)

# Connect to Polygon
w3 = Web3(Web3.HTTPProvider(POLYGON_RPC))

if not w3.is_connected():
    print("❌ Error: Cannot connect to Polygon Amoy")
    exit(1)

print(f"✅ Connected to Polygon Amoy")
print(f"   Chain ID: {w3.eth.chain_id}")

# Get account
account = w3.eth.account.from_key(PRIVATE_KEY)
print(f"   Deployer: {account.address}")

# Check balance
balance = w3.eth.get_balance(account.address)
balance_matic = w3.from_wei(balance, 'ether')
print(f"   Balance: {balance_matic} MATIC")

if balance_matic < 0.1:
    print("⚠️  Warning: Low MATIC balance. Get more from faucet:")
    print("   https://faucet.polygon.technology/")

# Load contract
with open('AITradeUSDT.sol', 'r') as f:
    contract_source = f.read()

print("\n📝 Contract loaded. Ready to deploy!")
print("\n⚠️  Manual deployment recommended via Remix:")
print("   1. Go to https://remix.ethereum.org/")
print("   2. Upload AITradeUSDT.sol")
print("   3. Compile with Solidity 0.8.19")
print("   4. Deploy to Polygon Amoy (Chain ID: 80002)")
print("   5. Copy contract address")
print("   6. Update .env: CONTRACT_ADDRESS=0x...")
print("\n🔗 Polygon Amoy Explorer: https://amoy.polygonscan.com/")
