# AI Trading Platform - Comprehensive

Platform trading cryptocurrency yang komprehensif dengan AI Prediction, Smart Contract Validation, Oracle Verification, dan Risk Management.

## 🚀 Fitur Utama

### 1. AI Prediction Engine
- Analisis teknikal multi-indikator (RSI, MACD, Bollinger Bands, Moving Averages)
- Confidence scoring untuk setiap signal
- Risk assessment otomatis
- Position sizing dinamis

### 2. Smart Contract Validation
- Validasi otomatis setiap trading signal
- Risk limits yang dapat dikonfigurasi
- On-chain recording untuk transparansi
- Automatic settlement

### 3. Oracle Layer
- Verifikasi integritas data market
- Hash-based verification
- Anomaly detection

### 4. Trading Engine
- Eksekusi trade otomatis
- Performance tracking
- P&L calculation
- Trade history

### 5. Risk Management
- Maximum position size limits
- Daily loss limits
- Confidence thresholds
- Daily trade limits

## 📋 Requirements

- Python 3.8+
- Node.js 16+
- npm atau yarn

## 🛠️ Installation

### Cara 1: Menggunakan Script (Recommended)

```bash
# Berikan permission untuk script
chmod +x run.sh

# Jalankan aplikasi
./run.sh
```

### Cara 2: Manual Setup

#### Backend

```bash
cd comprehensive_backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Di Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend
python main.py
```

Backend akan berjalan di: http://localhost:8000

#### Frontend

```bash
cd comprehensive_frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend akan berjalan di: http://localhost:3000

## 📊 API Endpoints

### Dashboard
- `GET /api/dashboard` - Get complete dashboard data

### Market Data
- `GET /api/market/prices` - Get current market prices
- `GET /api/predictions/{symbol}` - Get AI prediction for symbol

### Trading
- `POST /api/trades/execute` - Execute trade
- `GET /api/trades/history` - Get trade history
- `GET /api/trades/performance` - Get performance metrics

### Smart Contract
- `GET /api/smartcontract/records` - Get on-chain records
- `GET /api/smartcontract/validations` - Get validation history
- `GET /api/smartcontract/risk-limits` - Get risk limits
- `POST /api/smartcontract/risk-limits` - Update risk limits

### Oracle
- `GET /api/oracle/verifications` - Get oracle verifications

### WebSocket
- `WS /ws` - Real-time market updates

## 🎯 Cara Menggunakan

1. **Akses Dashboard**
   - Buka browser dan akses http://localhost:3000
   - Dashboard akan menampilkan data real-time

2. **Monitor AI Signal**
   - Lihat signal BUY/SELL/HOLD
   - Check confidence level dan risk score
   - Review buy/sell scores

3. **Execute Trade**
   - Klik tombol "Execute Trade"
   - Sistem akan:
     - Verify signal dengan Oracle
     - Validate dengan Smart Contract
     - Execute trade jika lolos validasi
     - Record on-chain
     - Settle trade

4. **Monitor Performance**
   - Track P&L real-time
   - Review win rate
   - Analyze trade history

## 🔧 Konfigurasi

### Risk Limits (Smart Contract)

Default risk limits dapat diubah melalui API:

```json
{
  "max_position_size_pct": 20,
  "max_daily_loss_pct": 5,
  "min_confidence": 0.65,
  "max_daily_trades": 50
}
```

### Supported Symbols

- BTC (Bitcoin)
- ETH (Ethereum)
- BNB (Binance Coin)
- SOL (Solana)

## 📈 Arsitektur

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API   │
│   (FastAPI)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────┐   ┌─────────────┐
│ AI  │   │   Smart     │
│ AI  │   │  Contract   │
└─────┘   └─────────────┘
    │         │
    └────┬────┘
         ▼
    ┌─────────┐
    │ Oracle  │
    └─────────┘
         │
         ▼
    ┌─────────┐
    │ Trading │
    │ Engine  │
    └─────────┘
```

## 🔐 Security Features

1. **Smart Contract Validation**
   - Multi-layer validation
   - Risk limit enforcement
   - Automatic rejection of high-risk trades

2. **Oracle Verification**
   - Data integrity checks
   - Anomaly detection
   - Hash-based verification

3. **Risk Management**
   - Position size limits
   - Daily loss limits
   - Confidence thresholds

## 📝 Development

### Backend Development

```bash
cd comprehensive_backend
source venv/bin/activate
python main.py
```

API documentation tersedia di: http://localhost:8000/docs

### Frontend Development

```bash
cd comprehensive_frontend
npm run dev
```

## 🐛 Troubleshooting

### Backend tidak start
- Pastikan Python 3.8+ terinstall
- Check apakah port 8000 sudah digunakan
- Pastikan semua dependencies terinstall

### Frontend tidak start
- Pastikan Node.js 16+ terinstall
- Check apakah port 3000 sudah digunakan
- Hapus folder `node_modules` dan `.next`, lalu install ulang

### WebSocket connection error
- Pastikan backend sudah running
- Check firewall settings
- Refresh browser

## 📄 License

MIT License

## 👥 Support

Untuk pertanyaan dan support, silakan buat issue di repository ini.

---

**Note**: Ini adalah platform demo untuk tujuan pembelajaran. Jangan gunakan dengan uang sungguhan tanpa testing dan validasi yang menyeluruh.
