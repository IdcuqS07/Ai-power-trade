# 🚀 Deployment Guide - AITradeUSDT

## Quick Start

### Step 1: Prepare Your Wallet

1. **Open MetaMask**
2. **Add BSC Testnet** (if not added):
   - Network Name: `BSC Testnet`
   - RPC URL: `https://data-seed-prebsc-1-s1.binance.org:8545`
   - Chain ID: `97`
   - Symbol: `tBNB`
   - Explorer: `https://testnet.bscscan.com`

3. **Get your private key**:
   - Click account icon → Account details → Export Private Key
   - ⚠️ **TESTNET WALLET ONLY!**

4. **Check balance**: You have 0.29 tBNB ✅

### Step 2: Deploy Contract

```bash
cd blockchain
python deploy.py
```

**What will happen:**
1. Script connects to BSC Testnet
2. Compiles AITradeUSDT.sol
3. Asks for your private key
4. Shows your wallet address & balance
5. Confirms deployment details
6. Deploys contract (~0.02 tBNB)
7. Waits for confirmation (~5 seconds)
8. Saves deployment info

### Step 3: After Deployment

Script will create:
- `deployment.json` - Contract address & info
- `.env.example` - Environment template

**You'll get:**
- ✅ Contract address
- ✅ Transaction hash
- ✅ BscScan link
- ✅ Deployment cost

### Step 4: Test Faucet

1. Go to BscScan (link provided)
2. Click "Contract" → "Write Contract"
3. Connect MetaMask
4. Call `claimFaucet()`
5. Confirm transaction
6. Check balance (should have 100 atUSDT)

### Step 5: Add to MetaMask

1. Open MetaMask
2. Click "Import tokens"
3. Paste contract address
4. Symbol: `atUSDT`
5. Decimals: `18`
6. Click "Add"

## Expected Costs

```
Deployment: ~0.02 tBNB
Testing (10 txs): ~0.01 tBNB
Total: ~0.03 tBNB

Your balance: 0.29 tBNB
Remaining after: ~0.26 tBNB ✅
```

## Troubleshooting

**"Insufficient funds"**
- Get more tBNB from faucet
- https://testnet.bnbchain.org/faucet-smart

**"Connection failed"**
- Check internet connection
- Try different RPC: `https://data-seed-prebsc-2-s1.binance.org:8545`

**"Invalid private key"**
- Make sure it starts with `0x`
- Use testnet wallet only
- Check for extra spaces

## Security Notes

⚠️ **IMPORTANT:**
- Use TESTNET wallet only
- Never share private key
- tBNB has no real value
- Contract is for demo purposes

## Ready to Deploy?

Run: `python deploy.py`

The script will guide you through each step! 🚀
