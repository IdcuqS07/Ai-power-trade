"""
Deploy AITradeUSDT to BSC Testnet
"""
from web3 import Web3
from solcx import compile_source, install_solc
import json
import os
from pathlib import Path

# Install solidity compiler
print("Installing Solidity compiler...")
install_solc('0.8.0')

# BSC Testnet Configuration - Try multiple RPCs
BSC_TESTNET_RPCS = [
    "https://data-seed-prebsc-1-s1.binance.org:8545",
    "https://data-seed-prebsc-2-s1.binance.org:8545",
    "https://bsc-testnet.public.blastapi.io",
    "https://bsc-testnet.publicnode.com"
]
CHAIN_ID = 97

# Try to connect to any available RPC
BSC_TESTNET_RPC = None
w3 = None

# Connect to BSC Testnet - Try multiple RPCs
print("Connecting to BSC Testnet...")
for rpc in BSC_TESTNET_RPCS:
    print(f"Trying: {rpc}")
    try:
        w3 = Web3(Web3.HTTPProvider(rpc, request_kwargs={'timeout': 10}))
        if w3.is_connected():
            BSC_TESTNET_RPC = rpc
            print(f"✅ Connected to: {rpc}")
            break
    except Exception as e:
        print(f"   Failed: {e}")
        continue

if not w3 or not w3.is_connected():
    print("\n❌ Failed to connect to any BSC Testnet RPC")
    print("Please check your internet connection or try again later")
    exit(1)

print(f"✅ Connected to BSC Testnet")
print(f"Latest block: {w3.eth.block_number}")

# Load contract source (V2 with trading)
contract_path = Path(__file__).parent / "AITradeUSDT_V2.sol"
with open(contract_path, 'r') as file:
    contract_source = file.read()

# Compile contract
print("\nCompiling contract...")
compiled_sol = compile_source(
    contract_source,
    output_values=['abi', 'bin'],
    solc_version='0.8.0'
)

contract_id, contract_interface = compiled_sol.popitem()
bytecode = contract_interface['bin']
abi = contract_interface['abi']

print("✅ Contract compiled successfully")

# Get deployment account
print("\n" + "="*60)
print("DEPLOYMENT SETUP")
print("="*60)
print("\nYou need to provide your wallet private key to deploy.")
print("⚠️  NEVER share your private key!")
print("⚠️  This is for TESTNET only (tBNB has no value)")
print("\nYour wallet should have at least 0.05 tBNB for deployment.")
print("\nGet testnet BNB from: https://testnet.bnbchain.org/faucet-smart")

private_key = input("\nEnter your private key (or press Enter to skip): ").strip()

if not private_key:
    print("\n📝 Deployment skipped. To deploy later, run:")
    print("   python blockchain/deploy.py")
    print("\n💾 Saving ABI and bytecode...")
    
    # Save ABI and bytecode for later deployment
    deployment_data = {
        'abi': abi,
        'bytecode': bytecode,
        'contract_name': 'AITradeUSDT',
        'network': 'BSC Testnet',
        'chain_id': CHAIN_ID
    }
    
    with open('contract_data.json', 'w') as f:
        json.dump(deployment_data, f, indent=2)
    
    print("✅ Contract data saved to contract_data.json")
    print("\nTo deploy, you'll need:")
    print("1. MetaMask wallet with BSC Testnet added")
    print("2. At least 0.05 tBNB (get from faucet)")
    print("3. Your wallet private key")
    exit(0)

# Validate private key
if not private_key.startswith('0x'):
    private_key = '0x' + private_key

try:
    account = w3.eth.account.from_key(private_key)
    deployer_address = account.address
    balance = w3.eth.get_balance(deployer_address)
    balance_bnb = w3.from_wei(balance, 'ether')
    
    print(f"\n✅ Wallet loaded")
    print(f"Address: {deployer_address}")
    print(f"Balance: {balance_bnb} tBNB")
    
    if balance_bnb < 0.05:
        print(f"\n⚠️  Warning: Low balance ({balance_bnb} tBNB)")
        print("Recommended: At least 0.05 tBNB")
        print("Get more from: https://testnet.bnbchain.org/faucet-smart")
        
        proceed = input("\nProceed anyway? (y/n): ").lower()
        if proceed != 'y':
            print("Deployment cancelled")
            exit(0)
    
except Exception as e:
    print(f"\n❌ Invalid private key: {e}")
    exit(1)

# Deploy contract
print("\n" + "="*60)
print("DEPLOYING CONTRACT")
print("="*60)

initial_supply = 1000000000  # 1 billion tokens

print(f"\nContract: AITradeUSDT")
print(f"Initial Supply: {initial_supply:,} atUSDT")
print(f"Faucet Amount: 100 atUSDT per claim")
print(f"Cooldown: 24 hours")

confirm = input("\nDeploy contract? (y/n): ").lower()
if confirm != 'y':
    print("Deployment cancelled")
    exit(0)

try:
    # Create contract instance
    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    
    # Get nonce
    nonce = w3.eth.get_transaction_count(deployer_address)
    
    # Build transaction
    print("\n📝 Building transaction...")
    transaction = Contract.constructor(initial_supply).build_transaction({
        'chainId': CHAIN_ID,
        'gas': 5000000,  # Increased for V2 contract
        'gasPrice': w3.eth.gas_price,
        'nonce': nonce,
    })
    
    # Sign transaction
    print("✍️  Signing transaction...")
    signed_txn = w3.eth.account.sign_transaction(transaction, private_key)
    
    # Send transaction
    print("📤 Sending transaction...")
    tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
    print(f"Transaction hash: {tx_hash.hex()}")
    print(f"View on BscScan: https://testnet.bscscan.com/tx/{tx_hash.hex()}")
    
    # Wait for confirmation
    print("\n⏳ Waiting for confirmation...")
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    
    if tx_receipt['status'] == 1:
        contract_address = tx_receipt['contractAddress']
        print("\n" + "="*60)
        print("✅ CONTRACT DEPLOYED SUCCESSFULLY!")
        print("="*60)
        print(f"\nContract Address: {contract_address}")
        print(f"Deployer: {deployer_address}")
        print(f"Transaction: {tx_hash.hex()}")
        print(f"Gas Used: {tx_receipt['gasUsed']:,}")
        print(f"Block Number: {tx_receipt['blockNumber']}")
        
        gas_cost = tx_receipt['gasUsed'] * transaction['gasPrice']
        gas_cost_bnb = w3.from_wei(gas_cost, 'ether')
        print(f"Deployment Cost: {gas_cost_bnb} tBNB")
        
        print(f"\n🔍 View on BscScan:")
        print(f"https://testnet.bscscan.com/address/{contract_address}")
        
        # Save deployment info
        deployment_info = {
            'contract_address': contract_address,
            'deployer_address': deployer_address,
            'transaction_hash': tx_hash.hex(),
            'block_number': tx_receipt['blockNumber'],
            'gas_used': tx_receipt['gasUsed'],
            'deployment_cost_bnb': str(gas_cost_bnb),
            'abi': abi,
            'network': 'BSC Testnet',
            'chain_id': CHAIN_ID,
            'rpc_url': BSC_TESTNET_RPC,
            'initial_supply': initial_supply,
            'faucet_amount': 100,
            'faucet_cooldown': 24
        }
        
        with open('deployment.json', 'w') as f:
            json.dump(deployment_info, f, indent=2)
        
        print("\n💾 Deployment info saved to deployment.json")
        
        # Create .env template
        env_content = f"""# BSC Testnet Configuration
BSC_TESTNET_RPC={BSC_TESTNET_RPC}
BSC_CHAIN_ID={CHAIN_ID}
CONTRACT_ADDRESS={contract_address}
DEPLOYER_ADDRESS={deployer_address}

# Private key for backend operations (KEEP SECRET!)
# PRIVATE_KEY=your_private_key_here
"""
        
        with open('.env.example', 'w') as f:
            f.write(env_content)
        
        print("📝 Environment template saved to .env.example")
        
        print("\n" + "="*60)
        print("NEXT STEPS")
        print("="*60)
        print("\n1. Verify contract on BscScan (optional):")
        print(f"   https://testnet.bscscan.com/verifyContract")
        print(f"   Contract Address: {contract_address}")
        print(f"   Compiler: v0.8.0")
        print(f"   Optimization: No")
        
        print("\n2. Update backend configuration:")
        print(f"   CONTRACT_ADDRESS={contract_address}")
        
        print("\n3. Test faucet function:")
        print(f"   Call claimFaucet() from any address")
        
        print("\n4. Add token to MetaMask:")
        print(f"   Address: {contract_address}")
        print(f"   Symbol: atUSDT")
        print(f"   Decimals: 18")
        
    else:
        print("\n❌ Deployment failed!")
        print(f"Transaction receipt: {tx_receipt}")
        
except Exception as e:
    print(f"\n❌ Deployment error: {e}")
    import traceback
    traceback.print_exc()
