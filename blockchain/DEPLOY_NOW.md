# 🚀 Deploy AITradeUSDT Contract - Manual Steps

## Quick Deploy (5 minutes)

### Step 1: Open Terminal

```bash
cd blockchain
python deploy.py
```

### Step 2: Enter Your Private Key

When prompted:
```
Enter your private key (or press Enter to skip):
```

**Get your private key from MetaMask:**
1. Open MetaMask
2. Click account icon (top right)
3. Account details
4. Export Private Key
5. Enter password
6. Copy private key

**Paste it** (it will be hidden for security)

### Step 3: Confirm Deployment

Script will show:
```
Address: 0x...
Balance: 0.29 tBNB ✅

Deploy contract? (y/n):
```

Type: `y` and press Enter

### Step 4: Wait for Confirmation

```
📤 Sending transaction...
⏳ Waiting for confirmation...
✅ CONTRACT DEPLOYED SUCCESSFULLY!

Contract Address: 0x...
Transaction: 0x...
Gas Used: ~2,000,000
Deployment Cost: ~0.02 tBNB
```

### Step 5: Save Contract Address

Script automatically saves to `deployment.json`

---

## Alternative: Use Remix IDE (No Command Line)

If you prefer GUI:

### 1. Go to Remix
https://remix.ethereum.org

### 2. Create New File
- File name: `AITradeUSDT.sol`
- Copy content from `blockchain/AITradeUSDT.sol`

### 3. Compile
- Click "Solidity Compiler" (left sidebar)
- Compiler version: 0.8.0
- Click "Compile AITradeUSDT.sol"

### 4. Deploy
- Click "Deploy & Run" (left sidebar)
- Environment: "Injected Provider - MetaMask"
- MetaMask will popup → Connect
- Switch to BSC Testnet in MetaMask
- Constructor parameter: `1000000` (initial supply)
- Click "Deploy"
- Confirm in MetaMask

### 5. Get Contract Address
- After deployment, contract appears under "Deployed Contracts"
- Copy address
- Save to `blockchain/deployment.json`:

```json
{
  "contract_address": "0xYOUR_CONTRACT_ADDRESS",
  "network": "BSC Testnet",
  "chain_id": 97
}
```

---

## After Deployment

### Test Faucet

1. Go to BscScan Testnet
2. Search your contract address
3. Click "Contract" → "Write Contract"
4. Connect MetaMask
5. Find `claimFaucet` function
6. Click "Write"
7. Confirm transaction
8. Check balance (should have 100 atUSDT)

### Add Token to MetaMask

1. Open MetaMask
2. Click "Import tokens"
3. Token address: [your contract address]
4. Symbol: `atUSDT`
5. Decimals: `18`
6. Click "Add"

---

## Need Help?

**Connection issues?**
- Check internet connection
- Try different RPC in script

**Low balance?**
- Get more tBNB: https://testnet.bnbchain.org/faucet-smart

**Transaction failed?**
- Check gas price
- Increase gas limit
- Try again

---

## Ready?

Choose your method:
- **Command Line**: `python deploy.py`
- **Remix IDE**: https://remix.ethereum.org

Both work perfectly! 🚀
