# 🔍 Debug Trade "Decoding Failed" Issue

## Current Status
**Error:** "Contract error: Decoding failed"  
**When:** Trying to execute trade from dashboard  
**Contract:** 0x00D6B7946E0c636Be59f79356e73fe4E42c60a33

---

## Debugging Steps

### Step 1: Test Contract Directly

Open `test-contract.html` in browser:

```bash
# Serve the file
python3 -m http.server 8080
# Then open: http://localhost:8080/test-contract.html
```

Or just open the file directly in browser.

**Actions:**
1. Click "1. Connect Wallet"
2. Click "2. Check Balance"
3. Click "3. Test Trade"

This will show detailed error messages and help identify the exact issue.

---

### Step 2: Check Contract on BscScan

Visit: https://testnet.bscscan.com/address/0x00D6B7946E0c636Be59f79356e73fe4E42c60a33

**Verify:**
- Contract is verified ✅
- `executeTrade` function exists
- Function signature matches our ABI

---

### Step 3: Possible Causes

#### Cause 1: Wrong Parameter Types
**Issue:** Parameters not matching contract expectations

**Contract expects:**
```solidity
function executeTrade(
    string memory _symbol,
    string memory _tradeType,
    uint256 _amount,
    uint256 _price
) external returns (uint256)
```

**We're sending:**
```javascript
contract.executeTrade(
    "BTC",              // string ✅
    "BUY",              // string ✅
    tradeAmount,        // uint256 (Wei) ✅
    priceInteger        // uint256 ✅
)
```

#### Cause 2: Amount Too Large/Small
**Issue:** Amount might be 0 or exceed balance

**Check:**
- Amount > 0
- Amount <= user balance
- Amount in Wei format (18 decimals)

#### Cause 3: Price Format Wrong
**Issue:** Price might be too large for uint256

**Current:**
```javascript
const priceInteger = Math.floor(currentPrice * 100)
// Example: 50000.50 -> 5000050
```

**Potential issue:** If price is very large (e.g., BTC at $100,000), might overflow

#### Cause 4: String Encoding
**Issue:** String parameters might have encoding issues

**Test:** Try with simple ASCII strings only

#### Cause 5: Contract State
**Issue:** Contract might have restrictions we're not aware of

**Check:**
- Is contract paused?
- Are there any access controls?
- Is there a minimum/maximum trade amount?

---

### Step 4: Alternative Approach - Use Backend

Instead of calling contract directly from frontend, use backend as proxy:

**Backend endpoint:**
```python
@app.post("/api/trades/execute-blockchain")
async def execute_blockchain_trade(
    symbol: str,
    trade_type: str,
    amount: float,
    price: float,
    user_address: str
):
    # Backend calls contract
    # Better error handling
    # Can log detailed errors
```

**Advantages:**
- Better error logging
- Can retry with different parameters
- Easier to debug
- Can validate before sending

---

### Step 5: Simplified Test

Try calling with minimal parameters:

```javascript
// Simplest possible call
const tx = await contract.executeTrade(
    "BTC",                              // Simple string
    "BUY",                              // Simple string
    ethers.utils.parseEther("1"),       // Exactly 1 token
    100000                              // Simple integer
);
```

If this works, gradually add complexity.

---

## Quick Fixes to Try

### Fix 1: Simplify Price
```javascript
// Instead of:
const priceInteger = Math.floor(currentPrice * 100)

// Try:
const priceInteger = Math.floor(currentPrice) // No multiplication
```

### Fix 2: Use BigNumber
```javascript
// Instead of:
const priceInteger = Math.floor(currentPrice * 100)

// Try:
const priceInteger = ethers.BigNumber.from(Math.floor(currentPrice * 100))
```

### Fix 3: Validate Strings
```javascript
// Ensure strings are clean
const symbol = String(symbol).trim().toUpperCase()
const tradeType = String(signal.signal).trim().toUpperCase()
```

### Fix 4: Check Amount Format
```javascript
// Log exact values
console.log('Amount (Wei):', tradeAmount.toString())
console.log('Amount (Ether):', ethers.utils.formatEther(tradeAmount))
console.log('Price:', priceInteger)
console.log('Symbol:', symbol)
console.log('Type:', tradeType)
```

---

## Expected Console Output

### Success:
```
Trade params: {symbol: "BTC", tradeType: "BUY", amount: "1000000000000000000", price: 5000050, ...}
tBNB balance: 0.0123
Contract balance: 100
Gas estimate: 150000
Transaction sent: 0xabc123...
Transaction confirmed: {...}
```

### Failure (Decoding):
```
Trade params: {...}
tBNB balance: 0.0123
Contract balance: 100
Gas estimation failed: Decoding failed
```

---

## Next Steps

1. **Run test-contract.html** - Get detailed error
2. **Check BscScan** - Verify contract
3. **Try simplified parameters** - Isolate issue
4. **Consider backend proxy** - Better error handling
5. **Check contract source** - Verify function signature

---

## Contact Points

- **Contract:** https://testnet.bscscan.com/address/0x00D6B7946E0c636Be59f79356e73fe4E42c60a33
- **Network:** BSC Testnet (Chain ID: 97)
- **RPC:** https://bsc-testnet.publicnode.com

---

## Temporary Workaround

If contract call continues to fail, we can:

1. **Use simulated trading** - Record trades in database only
2. **Settle later** - Batch settle trades periodically
3. **Use backend proxy** - Backend calls contract
4. **Deploy new contract** - If current contract has issues

---

**Status:** 🔍 INVESTIGATING  
**Priority:** HIGH  
**Next:** Run test-contract.html for detailed error
