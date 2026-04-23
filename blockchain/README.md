# AITradeUSDT Smart Contract

ERC-20 token with built-in faucet for AI Trading Platform testnet.

## Features

- ✅ Standard ERC-20 token
- ✅ Built-in faucet (100 atUSDT per claim)
- ✅ 24-hour cooldown between claims
- ✅ Anti-abuse protection
- ✅ Owner can mint more tokens
- ✅ Deployed on BSC Testnet

## Deployment

### Prerequisites

1. Python 3.8+
2. At least 0.05 tBNB in your wallet
3. MetaMask with BSC Testnet configured

### Get Testnet BNB

Visit: https://testnet.bnbchain.org/faucet-smart

### Install Dependencies

```bash
cd blockchain
pip install -r requirements.txt
```

### Deploy Contract

```bash
python deploy.py
```

Follow the prompts:
1. Enter your private key (testnet wallet)
2. Confirm deployment
3. Wait for confirmation (~5 seconds)

### After Deployment

The script will create:
- `deployment.json` - Contract address and deployment info
- `.env.example` - Environment variables template

## Contract Details

- **Name:** AI Trade USDT
- **Symbol:** atUSDT
- **Decimals:** 18
- **Initial Supply:** 1,000,000 atUSDT
- **Faucet Amount:** 100 atUSDT per claim
- **Cooldown:** 24 hours

## Functions

### User Functions

- `claimFaucet()` - Claim 100 atUSDT (once per 24 hours)
- `transfer(address to, uint256 amount)` - Transfer tokens
- `approve(address spender, uint256 amount)` - Approve spending
- `canClaimFaucet(address)` - Check if address can claim
- `timeUntilNextClaim(address)` - Get cooldown time remaining

### Owner Functions

- `setFaucetAmount(uint256 amount)` - Update faucet amount
- `mint(uint256 amount)` - Mint more tokens

## Integration

### Add to MetaMask

1. Open MetaMask
2. Click "Import tokens"
3. Enter contract address from `deployment.json`
4. Symbol: atUSDT
5. Decimals: 18

### Backend Integration

See `comprehensive_backend/blockchain_service.py` for integration code.

## Testing

### Test Faucet

```bash
# Using web3.py
python test_faucet.py
```

### Manual Testing

1. Go to BscScan testnet
2. Find your contract
3. Connect wallet
4. Call `claimFaucet()`
5. Check balance

## Security

⚠️ **TESTNET ONLY** - These tokens have no real value.

- Private keys are for testnet wallets only
- Never use mainnet private keys
- Contract is not audited (testnet demo)

## Support

For issues or questions:
- Check BscScan for transaction status
- Verify you have enough tBNB for gas
- Ensure 24-hour cooldown has passed

## License

MIT License - Free to use for hackathon and educational purposes.
