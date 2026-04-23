# 🔷 Polygon Amoy Testnet Configuration

## ✅ Current Configuration Status

### Network Details
```
Network Name: Polygon Amoy Testnet
Chain ID: 80002
RPC URL: https://rpc-amoy.polygon.technology/
Currency Symbol: MATIC
Block Explorer: https://amoy.polygonscan.com/
```

### Smart Contract
```
Contract Address: 0xA2E0F4A542b700f437c27Ce28B31499023d9a53A
Token Name: AI Trade USDT (atUSDT)
Token Type: ERC-20
Network: Polygon Amoy Testnet
```

### Faucet
```
Get Testnet MATIC: https://faucet.polygon.technology/
```

---

## 📋 Configuration Checklist

### ✅ Backend Configuration
- [x] RPC URL: `https://rpc-amoy.polygon.technology/`
- [x] Chain ID: `80002`
- [x] Contract Address: `0xA2E0F4A542b700f437c27Ce28B31499023d9a53A`
- [x] Explorer: `https://amoy.polygonscan.com/`

### ✅ Frontend Configuration
- [x] Chain ID: `80002`
- [x] Contract Address: `0xA2E0F4A542b700f437c27Ce28B31499023d9a53A`
- [x] RPC URL: `https://rpc-amoy.polygon.technology/`
- [x] Explorer URL: `https://amoy.polygonscan.com/`
- [x] Network Name: `Polygon Amoy Testnet`
- [x] Currency Symbol: `MATIC`

### ✅ Documentation
- [x] README.md updated with Polygon Amoy details
- [x] Network configuration documented
- [x] Contract address documented
- [x] Explorer links correct

---

## 🔧 Setup Instructions

### 1. Add Polygon Amoy to MetaMask

**Manual Setup:**
```
Network Name: Polygon Amoy Testnet
RPC URL: https://rpc-amoy.polygon.technology/
Chain ID: 80002
Currency Symbol: MATIC
Block Explorer: https://amoy.polygonscan.com/
```

**Or use this link:**
```
https://chainlist.org/?search=amoy
```

### 2. Get Testnet MATIC

1. Visit: https://faucet.polygon.technology/
2. Select "Polygon Amoy"
3. Enter your wallet address
4. Complete captcha
5. Receive 0.5 MATIC (usually within 1 minute)

### 3. Configure Backend

```bash
cd comprehensive_backend
cp .env.example .env
nano .env
```

Update these values:
```env
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology/
POLYGON_CHAIN_ID=80002
CONTRACT_ADDRESS=0xA2E0F4A542b700f437c27Ce28B31499023d9a53A
OWNER_PRIVATE_KEY=your_private_key_here
```

### 4. Configure Frontend

```bash
cd comprehensive_frontend
cp .env.example .env.local
nano .env.local
```

Update these values:
```env
NEXT_PUBLIC_CHAIN_ID=80002
NEXT_PUBLIC_CONTRACT_ADDRESS=0xA2E0F4A542b700f437c27Ce28B31499023d9a53A
NEXT_PUBLIC_RPC_URL=https://rpc-amoy.polygon.technology/
NEXT_PUBLIC_EXPLORER_URL=https://amoy.polygonscan.com/
```

---

## 🧪 Verification

### Test RPC Connection

```bash
curl -X POST https://rpc-amoy.polygon.technology/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x..." // Current block number in hex
}
```

### Test Contract

```bash
curl -X POST https://rpc-amoy.polygon.technology/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getCode",
    "params":["0xA2E0F4A542b700f437c27Ce28B31499023d9a53A", "latest"],
    "id":1
  }'
```

Expected: Should return contract bytecode (long hex string)

### Check Balance

```javascript
const Web3 = require('web3');
const web3 = new Web3('https://rpc-amoy.polygon.technology/');

async function checkBalance(address) {
    const balance = await web3.eth.getBalance(address);
    console.log(`Balance: ${web3.utils.fromWei(balance, 'ether')} MATIC`);
}

checkBalance('YOUR_WALLET_ADDRESS');
```

---

## 📊 Network Information

### Polygon Amoy Testnet Specs

| Property | Value |
|----------|-------|
| **Network Name** | Polygon Amoy Testnet |
| **Chain ID** | 80002 |
| **Currency** | MATIC |
| **Block Time** | ~2 seconds |
| **Consensus** | Proof of Stake |
| **Type** | Testnet |
| **Launch Date** | 2024 |
| **Purpose** | Testing before Polygon PoS mainnet |

### RPC Endpoints

**Primary:**
```
https://rpc-amoy.polygon.technology/
```

**Alternative:**
```
https://polygon-amoy.drpc.org
https://polygon-amoy-bor-rpc.publicnode.com
```

### Explorer

**Primary:**
```
https://amoy.polygonscan.com/
```

**Alternative:**
```
https://www.oklink.com/amoy
```

### Faucets

**Official:**
```
https://faucet.polygon.technology/
```

**Alternative:**
```
https://www.alchemy.com/faucets/polygon-amoy
https://faucet.quicknode.com/polygon/amoy
```

---

## 🔗 Important Links

### Official Resources
- **Polygon Docs**: https://docs.polygon.technology/
- **Amoy Testnet Guide**: https://docs.polygon.technology/tools/gas/polygon-gas-station/
- **Faucet**: https://faucet.polygon.technology/
- **Explorer**: https://amoy.polygonscan.com/

### Developer Tools
- **Remix IDE**: https://remix.ethereum.org/
- **Hardhat**: https://hardhat.org/
- **Chainlist**: https://chainlist.org/?search=amoy
- **Gas Station**: https://gasstation.polygon.technology/

### Community
- **Discord**: https://discord.gg/polygon
- **Forum**: https://forum.polygon.technology/
- **Twitter**: https://twitter.com/0xPolygon

---

## 🎯 Contract Details

### AI Trade USDT (atUSDT)

```solidity
Contract Address: 0xA2E0F4A542b700f437c27Ce28B31499023d9a53A
Token Name: AI Trade USDT
Token Symbol: atUSDT
Decimals: 18
Total Supply: 1,000,000 atUSDT
Network: Polygon Amoy Testnet (80002)
```

### Key Functions

```solidity
// Get token balance
function balanceOf(address account) external view returns (uint256)

// Transfer tokens
function transfer(address to, uint256 amount) external returns (bool)

// Execute trade
function executeTrade(
    string memory symbol,
    string memory tradeType,
    uint256 amount
) external returns (bool)

// Get trade history
function getTradeHistory(address user) external view returns (Trade[] memory)

// Faucet (testnet only)
function faucet() external returns (bool)
```

### View on Explorer

```
Contract: https://amoy.polygonscan.com/address/0xA2E0F4A542b700f437c27Ce28B31499023d9a53A
Transactions: https://amoy.polygonscan.com/address/0xA2E0F4A542b700f437c27Ce28B31499023d9a53A#transactions
```

---

## ⚠️ Important Notes

### Testnet Limitations
- ✅ Free MATIC from faucet
- ✅ No real value
- ✅ Safe for testing
- ⚠️ Can be reset/wiped
- ⚠️ Not for production

### Security
- ❌ Never use mainnet private keys on testnet
- ❌ Never commit private keys to git
- ❌ Never share private keys
- ✅ Use separate wallet for testnet
- ✅ Keep private keys in .env (gitignored)

### Best Practices
1. Always test on Amoy before mainnet
2. Use faucet MATIC, don't buy
3. Keep testnet and mainnet wallets separate
4. Document all contract addresses
5. Verify contracts on PolygonScan

---

## 🐛 Troubleshooting

### Issue: RPC not responding
**Solution**: Try alternative RPC endpoints listed above

### Issue: Faucet not working
**Solution**: 
- Wait 24 hours between requests
- Try alternative faucets
- Check if you already have MATIC

### Issue: Transaction failing
**Solution**:
- Check you have enough MATIC for gas
- Verify contract address is correct
- Check network is Polygon Amoy (80002)

### Issue: MetaMask not connecting
**Solution**:
- Verify network configuration
- Clear MetaMask cache
- Re-add network manually

### Issue: Contract not found
**Solution**:
- Verify contract address: `0xA2E0F4A542b700f437c27Ce28B31499023d9a53A`
- Check you're on Polygon Amoy (80002)
- View on explorer to confirm deployment

---

## ✅ Configuration Complete

Your platform is now correctly configured for **Polygon Amoy Testnet**:

- ✅ Network: Polygon Amoy (Chain ID: 80002)
- ✅ RPC: https://rpc-amoy.polygon.technology/
- ✅ Contract: 0xA2E0F4A542b700f437c27Ce28B31499023d9a53A
- ✅ Explorer: https://amoy.polygonscan.com/
- ✅ Faucet: https://faucet.polygon.technology/

**Ready to test on Polygon Amoy! 🔷**

---

**Last Updated**: January 28, 2025  
**Network**: Polygon Amoy Testnet  
**Chain ID**: 80002  
**Status**: ✅ Configured and Ready
