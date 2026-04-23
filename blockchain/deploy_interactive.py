"""
Interactive deployment script for AITradeUSDT
Run this manually to deploy the contract
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🚀 AITradeUSDT Deployment - Interactive Mode         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

This script will deploy the AITradeUSDT smart contract to BSC Testnet.

📋 What you need:
   1. MetaMask wallet with BSC Testnet configured
   2. At least 0.05 tBNB in your wallet (you have 0.29 ✅)
   3. Your wallet's private key (TESTNET ONLY!)

⚠️  SECURITY:
   - Use TESTNET wallet only
   - Never share your private key
   - tBNB has no real value

🔗 Get testnet BNB: https://testnet.bnbchain.org/faucet-smart

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ready to deploy? Let's go! 🚀

""")

# Import and run the deployment
try:
    exec(open('deploy.py').read())
except KeyboardInterrupt:
    print("\n\n❌ Deployment cancelled by user")
    sys.exit(0)
except Exception as e:
    print(f"\n\n❌ Deployment failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
