# 🪙 Coin Selector Guide - Multi-Coin Trading

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Trading Signal                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Signal: [BUY]    Confidence: ████████░░ 85%              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     Select Coin                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   BTC    │  │   ETH    │  │   BNB    │  │   SOL    │  │
│  │  $92,733 │  │  $3,184  │  │   $906   │  │   $142   │  │
│  │  -0.27%  │  │  +3.17%  │  │  +0.36%  │  │  +0.67%  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│      🔵           ⚪           ⚪           ⚪          │
│   (Selected)                                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                   Trade Amount: 50%                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ░░░░░░░░░░████████████░░░░░░░░░░                         │
│                                                             │
│  [10%] [25%] [50%] [75%] [100%]                           │
│                                                             │
│  = 50.00 atUSDT                                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         [ Execute Trade - BTC ]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Features Explained

### 1. Coin Cards
Setiap coin card menampilkan:
- **Symbol** (BTC, ETH, BNB, SOL)
- **Current Price** (real-time dari CoinGecko)
- **24h Change** (green untuk naik, red untuk turun)

### 2. Selection Indicator
- **Selected coin**: Blue background dengan border biru
- **Unselected coins**: Gray background
- Hover effect untuk better UX

### 3. Price Updates
Prices update otomatis setiap **5 detik**:
```
BTC: $92,733 → $92,850 → $92,720 ...
ETH: $3,184  → $3,195  → $3,180  ...
```

### 4. Trade Amount Integration
Trade amount dihitung berdasarkan:
- **Blockchain Balance** (atUSDT tokens)
- **Selected Percentage** (10% - 100%)
- **Preview**: Shows exact amount in atUSDT

## User Flow

### Scenario 1: Trade Bitcoin
```
1. User sees BTC is selected by default (blue)
2. Sets trade amount to 25%
3. Preview shows: "= 25.00 atUSDT"
4. Clicks "Execute Trade - BTC"
5. MetaMask confirms transaction
6. Trade executed at current BTC price ($92,733)
```

### Scenario 2: Switch to Ethereum
```
1. User clicks ETH card
2. ETH card turns blue, BTC turns gray
3. Button updates to "Execute Trade - ETH"
4. Sets amount to 50%
5. Clicks execute
6. Trade executed at current ETH price ($3,184)
```

### Scenario 3: Quick Switch
```
1. User trading BTC
2. Sees SOL is up +0.67%
3. Clicks SOL card
4. Immediately executes trade
5. Gets SOL at $142
```

## Color Coding

### Coin Selection
- 🔵 **Blue** = Selected coin
- ⚪ **Gray** = Available coins
- 🟢 **Green hover** = Hover effect

### Price Changes
- 🟢 **Green** = Positive 24h change (+3.17%)
- 🔴 **Red** = Negative 24h change (-0.27%)

### Trade Button
- 🔵 **Blue** = Ready to execute
- ⚫ **Gray** = Disabled (executing)
- 🔵 **Darker Blue** = Hover state

## Responsive Design

### Desktop (4 columns)
```
┌─────┬─────┬─────┬─────┐
│ BTC │ ETH │ BNB │ SOL │
└─────┴─────┴─────┴─────┘
```

### Mobile (2 columns)
```
┌─────┬─────┐
│ BTC │ ETH │
├─────┼─────┤
│ BNB │ SOL │
└─────┴─────┘
```

## Smart Features

### 1. Price-Based Selection
Platform menampilkan real-time prices, membantu user memilih coin:
- **High volatility** = Higher risk/reward
- **Positive momentum** = Green percentage
- **Price levels** = Support/resistance

### 2. AI Signal Integration
AI signal (BUY/SELL) berlaku untuk **semua coins**:
- Signal: BUY → Recommend buying any coin
- Signal: SELL → Recommend selling positions
- Confidence: Same for all coins

### 3. Risk Management
Trade amount slider membantu manage risk:
- **10%** = Conservative (test trade)
- **25%** = Moderate (standard trade)
- **50%** = Aggressive (high conviction)
- **100%** = All-in (maximum risk)

## Example Trades

### Conservative Multi-Coin Strategy
```
Trade 1: BTC - 10% = 10 atUSDT
Trade 2: ETH - 10% = 10 atUSDT
Trade 3: BNB - 10% = 10 atUSDT
Trade 4: SOL - 10% = 10 atUSDT
Total: 40% portfolio diversified
```

### Aggressive Single-Coin
```
Trade 1: ETH - 100% = 100 atUSDT
Total: All-in on Ethereum
```

### Momentum Trading
```
1. Check 24h changes
2. Select coin with highest positive %
3. Execute 50% trade
4. Ride the momentum
```

## Tips

✅ **Diversify**: Trade multiple coins untuk spread risk
✅ **Watch Changes**: Green percentages = positive momentum
✅ **Start Small**: Use 10-25% untuk test trades
✅ **Follow AI**: AI signal confidence helps decision
✅ **Check Balance**: Ensure sufficient atUSDT before trading

## Technical Notes

### Supported Coins
- ✅ BTC (Bitcoin) - Most liquid
- ✅ ETH (Ethereum) - Smart contract platform
- ✅ BNB (Binance Coin) - Exchange token
- ✅ SOL (Solana) - High-speed blockchain

### Price Sources
- **Live**: CoinGecko API (real-time)
- **Fallback**: Simulated data (if API fails)
- **Update**: Every 5 seconds

### On-Chain Recording
All trades recorded on BSC Testnet with:
- Correct symbol (BTC/ETH/BNB/SOL)
- Actual price at execution
- User address
- Timestamp
- Settlement status

## Status
✅ **LIVE** - Multi-coin selector active on dashboard!

Open http://localhost:3000 to start trading! 🚀
