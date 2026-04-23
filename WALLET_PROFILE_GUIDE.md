# 👤💰 Wallet & Profile - User Guide

## 🚀 Quick Start

### Menjalankan Platform dengan Fitur Wallet & Profile

1. **Start Backend:**
```bash
cd comprehensive_backend
python main.py
```
Backend akan berjalan di: `http://localhost:8000`

2. **Start Frontend:**
```bash
cd comprehensive_frontend
npm run dev
```
Frontend akan berjalan di: `http://localhost:3000`

3. **Akses Fitur Baru:**
- 🏠 Dashboard: `http://localhost:3000`
- 💰 Wallet: `http://localhost:3000/wallet`
- 👤 Profile: `http://localhost:3000/profile`

---

## 💰 Wallet Features

### 1. **Wallet Overview**
Dashboard wallet menampilkan:
- **Total Value**: Total nilai semua aset dalam USDT
- **Available Balance**: Dana yang siap untuk trading
- **Locked Balance**: Dana yang sedang digunakan dalam posisi aktif

### 2. **Multi-Currency Balances**
Platform mendukung 5 cryptocurrency:
- 💵 **USDT** - Base currency untuk trading
- ₿ **BTC** - Bitcoin
- Ξ **ETH** - Ethereum
- 🔶 **BNB** - Binance Coin
- ◎ **SOL** - Solana

Setiap balance menampilkan:
- Total balance
- Locked amount (dalam posisi aktif)
- Available amount (siap trading)
- Current price dalam USDT
- Total value dalam USDT

### 3. **Deposit Funds**
Cara deposit:
1. Klik tombol **"Deposit"** di halaman Wallet
2. Pilih currency (USDT, BTC, ETH, BNB, atau SOL)
3. Masukkan jumlah yang ingin di-deposit
4. Klik **"Confirm Deposit"**
5. Balance akan langsung terupdate

**Contoh:**
```
Currency: USDT
Amount: 5000
Result: Balance USDT bertambah $5,000
```

### 4. **Withdraw Funds**
Cara withdraw:
1. Klik tombol **"Withdraw"** di halaman Wallet
2. Pilih currency
3. Masukkan jumlah yang ingin di-withdraw
4. Klik **"Confirm Withdraw"**
5. Sistem akan validasi available balance
6. Jika cukup, withdrawal akan diproses

**Validasi:**
- ✅ Amount harus > 0
- ✅ Available balance harus cukup
- ✅ Tidak bisa withdraw locked balance

### 5. **Transaction History**
Semua transaksi tercatat dengan detail:
- Transaction ID (TX_1, TX_2, ...)
- Type (DEPOSIT, WITHDRAW, TRADE)
- Currency
- Amount
- Status (COMPLETED)
- Timestamp

---

## 👤 Profile Features

### 1. **Profile Information**
Data profil yang bisa dikelola:
- **User ID**: Unique identifier (read-only)
- **Username**: Nama display Anda
- **Email**: Email address
- **Risk Tolerance**: Level risiko trading
- **Trading Strategy**: Strategi yang digunakan
- **Member Since**: Tanggal bergabung

### 2. **Risk Tolerance Levels**

#### 🛡️ **Conservative (Aman)**
- Minimum confidence: **75%**
- Maximum position size: **10%**
- Cocok untuk: Trader yang mengutamakan keamanan
- Karakteristik: Lower risk, steady returns

#### ⚖️ **Moderate (Seimbang)**
- Minimum confidence: **65%**
- Maximum position size: **20%**
- Cocok untuk: Trader dengan pendekatan balanced
- Karakteristik: Balanced risk-reward

#### 🚀 **Aggressive (Agresif)**
- Minimum confidence: **55%**
- Maximum position size: **30%**
- Cocok untuk: Trader yang mencari high returns
- Karakteristik: Higher risk, higher potential reward

### 3. **Trading Strategies**

**AI Multi-Indicator** (Default)
- Menggunakan 6+ technical indicators
- RSI, MACD, Bollinger Bands, Moving Averages
- Confidence-based position sizing

**Momentum**
- Focus pada trend following
- Buy pada uptrend, sell pada downtrend

**Mean Reversion**
- Buy saat oversold, sell saat overbought
- Cocok untuk ranging market

### 4. **Trading Statistics**
Profile menampilkan performa trading Anda:
- **Total Trades**: Jumlah trade yang sudah dilakukan
- **Win Rate**: Persentase trade yang profit
- **Total Profit**: Total P&L keseluruhan
- **Best Trade**: Trade dengan profit tertinggi
- **Days Active**: Berapa lama sudah trading

### 5. **Edit Profile**
Cara update profile:
1. Klik tombol **"Edit Profile"**
2. Update field yang ingin diubah:
   - Username
   - Email
   - Risk Tolerance
   - Trading Strategy
3. Klik **"Save"** untuk menyimpan
4. Atau **"Cancel"** untuk membatalkan

---

## 🔄 Integration: Wallet + Profile + Trading

### **Complete Trading Flow:**

```
1. User Setup
   ↓
   - Set risk tolerance di Profile
   - Deposit funds ke Wallet
   
2. Trading Preparation
   ↓
   - System check available balance
   - AI generate signal (adjusted by risk tolerance)
   
3. Trade Execution
   ↓
   - Lock balance untuk trade
   - Execute trade
   - Update wallet balances
   
4. Post-Trade
   ↓
   - Unlock balance
   - Record transaction
   - Update user stats
   - Update portfolio value
```

### **Example Scenario:**

**User: John (Moderate Risk Tolerance)**

1. **Initial Setup:**
   - Deposit: $10,000 USDT
   - Risk Tolerance: Moderate
   - Strategy: AI Multi-Indicator

2. **AI Signal Generated:**
   - Signal: BUY BTC
   - Confidence: 78.5%
   - Base Position Size: 15%
   - Risk Score: 45

3. **Trade Execution:**
   - Available Balance: $10,000
   - Trade Amount: $1,500 (15% of balance)
   - Lock: $1,500 USDT
   - Buy: 0.0298 BTC @ $50,234

4. **After Trade:**
   - Unlock: $1,500 USDT
   - Add: 0.0298 BTC to wallet
   - P&L: +$45.67
   - Update Stats: Total Trades +1

5. **Updated Balances:**
   - USDT: $8,545.67
   - BTC: 0.0298
   - Total Value: $10,045.67

---

## 🎯 Best Practices

### **Wallet Management:**
1. ✅ Selalu maintain minimum balance untuk trading
2. ✅ Diversifikasi portfolio (jangan all-in satu coin)
3. ✅ Monitor locked balance sebelum withdraw
4. ✅ Review transaction history secara berkala

### **Profile Settings:**
1. ✅ Pilih risk tolerance sesuai pengalaman
2. ✅ Start dengan Conservative jika pemula
3. ✅ Adjust strategy berdasarkan market condition
4. ✅ Monitor stats untuk evaluasi performa

### **Risk Management:**
1. ✅ Jangan trade dengan semua balance
2. ✅ Set realistic profit targets
3. ✅ Respect daily loss limits
4. ✅ Review dan adjust risk tolerance secara berkala

---

## 🔧 Troubleshooting

### **Wallet Issues:**

**Problem: Deposit tidak masuk**
- Solution: Refresh halaman, check transaction history

**Problem: Tidak bisa withdraw**
- Check: Available balance cukup?
- Check: Ada locked balance?
- Solution: Tunggu posisi aktif selesai

**Problem: Balance tidak update**
- Solution: Refresh halaman atau tunggu 5 detik (auto-refresh)

### **Profile Issues:**

**Problem: Update profile gagal**
- Check: Email format valid?
- Check: Username tidak kosong?
- Solution: Coba lagi atau refresh halaman

**Problem: Stats tidak update**
- Solution: Stats update setelah trade selesai, tunggu beberapa detik

---

## 📊 Dashboard Navigation

### **Main Menu:**
```
🏠 Dashboard    → Overview & AI signals
💰 Wallet       → Manage funds & balances
👤 Profile      → User settings & stats
📊 Trades       → Trade history
📈 Analytics    → Performance analytics
🔬 Backtest     → Strategy testing
```

### **Quick Actions:**
- **From Dashboard**: Click "Wallet" or "Profile" button di header
- **From Wallet**: Click "Home" untuk kembali ke dashboard
- **From Profile**: Click "Home" untuk kembali ke dashboard

---

## 🎨 UI Features

### **Wallet Page:**
- 💚 Green gradient: Total Value card
- 🟢 Green button: Deposit action
- 🔴 Red button: Withdraw action
- 📊 Table view: All balances dengan real-time prices
- 📜 Timeline: Transaction history

### **Profile Page:**
- 🔵 Blue gradient: Trading stats card
- ⚙️ Edit mode: Inline editing dengan Save/Cancel
- 🎨 Color-coded risk levels:
  - Green: Conservative
  - Yellow: Moderate
  - Red: Aggressive
- 📊 Stats cards: Visual performance metrics

---

## 🚀 Advanced Features

### **Auto-Refresh:**
- Wallet balances: Update setiap 5 detik
- Profile stats: Update setelah setiap trade
- Transaction history: Real-time updates

### **Validation:**
- Deposit: Amount > 0
- Withdraw: Available balance check
- Profile: Email format validation
- Risk tolerance: Valid options only

### **Security:**
- Transaction recording: Immutable history
- Balance locking: Prevent double-spending
- Validation layers: Multiple checks before execution

---

## 📱 Responsive Design

Platform fully responsive untuk:
- 💻 Desktop (1920x1080+)
- 💻 Laptop (1366x768+)
- 📱 Tablet (768x1024+)
- 📱 Mobile (375x667+)

---

## 🎯 Next Steps

1. **Explore Wallet:**
   - Deposit some funds
   - Check balances
   - View transaction history

2. **Setup Profile:**
   - Set your risk tolerance
   - Choose trading strategy
   - Monitor your stats

3. **Start Trading:**
   - Go to Dashboard
   - Check AI signals
   - Execute trades
   - Watch your portfolio grow!

---

**Happy Trading! 🚀💰**

Platform ini sekarang memiliki sistem user management yang lengkap dengan wallet multi-currency dan profile management yang production-ready!
