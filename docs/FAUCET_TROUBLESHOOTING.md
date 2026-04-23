# 🎁 Faucet Claim Troubleshooting Guide

## ✅ Requirements Checklist

Before claiming from the faucet, make sure you have:

1. **MetaMask Installed** ✓
   - Download from: https://metamask.io/download/

2. **Connected to BSC Testnet** ✓
   - Network Name: BSC Testnet
   - Chain ID: 97
   - RPC URL: https://bsc-testnet.publicnode.com
   - Currency: tBNB
   - Explorer: https://testnet.bscscan.com

3. **tBNB for Gas Fees** ✓ (MOST IMPORTANT!)
   - You need at least 0.001 tBNB for gas
   - Get free tBNB from: https://testnet.bnbchain.org/faucet-smart
   - Alternative faucet: https://testnet.binance.org/faucet-smart

4. **Wait 24 Hours Between Claims** ✓
   - Cooldown period: 24 hours
   - Check "Next claim available in" timer

---

## 🔧 Common Issues & Solutions

### Issue 1: "Insufficient tBNB for gas"

**Problem:** You don't have enough tBNB to pay for transaction gas fees.

**Solution:**
1. Go to: https://testnet.bnbchain.org/faucet-smart
2. Connect your MetaMask wallet
3. Complete the captcha
4. Click "Give me BNB"
5. Wait 1-2 minutes for tBNB to arrive
6. Try claiming again

**Note:** You need tBNB BEFORE you can claim atUSDT!

---

### Issue 2: "Please switch to BSC Testnet"

**Problem:** Your MetaMask is connected to wrong network.

**Solution:**
1. Open MetaMask
2. Click network dropdown (top of MetaMask)
3. Select "BSC Testnet"
4. If not listed, click "Add Network" and enter:
   - Network Name: BSC Testnet
   - RPC URL: https://bsc-testnet.publicnode.com
   - Chain ID: 97
   - Currency Symbol: tBNB
   - Block Explorer: https://testnet.bscscan.com

---

### Issue 3: "Please wait 24 hours between claims"

**Problem:** You already claimed within the last 24 hours.

**Solution:**
- Wait for the cooldown timer to reach zero
- Timer shows: "Next claim available in: Xh Ym"
- You can only claim once every 24 hours

---

### Issue 4: "Transaction rejected by user"

**Problem:** You clicked "Reject" in MetaMask popup.

**Solution:**
- Click "Claim 100 atUSDT" button again
- When MetaMask popup appears, click "Confirm"

---

### Issue 5: Balance shows 0.00 after claiming

**Problem:** Balance not updated yet.

**Solution:**
1. Wait 10-30 seconds for blockchain confirmation
2. Refresh the page
3. Check MetaMask - token should appear there
4. If not in MetaMask, click "Add to MetaMask" button

---

### Issue 6: "Internal error" or "Transaction failed"

**Possible causes:**
1. Not enough tBNB for gas
2. Network congestion
3. Wrong network

**Solution:**
1. Check tBNB balance in MetaMask
2. Make sure you're on BSC Testnet (Chain ID: 97)
3. Try again in a few minutes
4. Increase gas limit in MetaMask (Advanced settings)

---

## 📋 Step-by-Step Guide

### First Time Setup:

1. **Install MetaMask**
   - Go to https://metamask.io/download/
   - Install browser extension
   - Create or import wallet

2. **Add BSC Testnet**
   - Open MetaMask
   - Click network dropdown
   - Click "Add Network"
   - Enter BSC Testnet details (see above)

3. **Get tBNB for Gas**
   - Go to https://testnet.bnbchain.org/faucet-smart
   - Connect MetaMask
   - Complete captcha
   - Click "Give me BNB"
   - Wait for confirmation

4. **Connect Wallet to App**
   - Go to Wallet page
   - Click "Connect MetaMask"
   - Approve connection in MetaMask

5. **Claim atUSDT**
   - Click "Claim 100 atUSDT"
   - Confirm transaction in MetaMask
   - Wait for confirmation (10-30 seconds)
   - Check balance

---

## 🔍 Verify Your Setup

### Check Network:
```
Network: BSC Testnet
Chain ID: 97
RPC: https://bsc-testnet.publicnode.com
```

### Check Contract:
```
Contract Address: 0x00D6B7946E0c636Be59f79356e73fe4E42c60a33
Token Symbol: atUSDT
Decimals: 18
```

### Check Balance:
- Open MetaMask
- Make sure you're on BSC Testnet
- You should see:
  - tBNB balance (for gas)
  - atUSDT balance (after claiming)

---

## 🆘 Still Having Issues?

### Debug Checklist:

1. ✓ MetaMask installed and unlocked?
2. ✓ Connected to BSC Testnet (Chain ID 97)?
3. ✓ Have at least 0.001 tBNB?
4. ✓ Waited 24 hours since last claim?
5. ✓ Approved connection to website?
6. ✓ Confirmed transaction in MetaMask?

### View Transaction on Blockchain:

After claiming, you can verify on BscScan:
1. Copy transaction hash from success message
2. Go to: https://testnet.bscscan.com
3. Paste transaction hash in search
4. Check transaction status

### Browser Console Logs:

If still not working:
1. Press F12 to open browser console
2. Go to "Console" tab
3. Try claiming again
4. Look for error messages
5. Share error message for support

---

## 💡 Tips

- **Always get tBNB first** before trying to claim atUSDT
- **Keep some tBNB** in your wallet for future transactions
- **Add atUSDT token** to MetaMask to see balance easily
- **Check cooldown timer** before attempting to claim
- **Use official faucets** only (links provided above)

---

## 📞 Support

If you've tried everything and still can't claim:

1. Check browser console for errors (F12)
2. Verify contract on BscScan: https://testnet.bscscan.com/address/0x00D6B7946E0c636Be59f79356e73fe4E42c60a33
3. Make sure you're using latest version of MetaMask
4. Try different browser (Chrome, Firefox, Brave)
5. Clear browser cache and try again

---

## ✅ Success Indicators

You'll know it worked when:
- ✓ MetaMask shows "Transaction confirmed"
- ✓ Success message: "🎉 Successfully claimed 100 atUSDT!"
- ✓ Balance updates to show 100 atUSDT
- ✓ Cooldown timer resets to 24 hours
- ✓ Transaction visible on BscScan

---

**Remember:** This is TESTNET only. All tokens have no real value and are for testing purposes only!
