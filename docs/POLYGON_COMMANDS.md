# 🔷 Polygon Migration - Quick Commands

## 🚀 One-Line Setup

```bash
chmod +x migrate-to-polygon.sh && ./migrate-to-polygon.sh
```

---

## 📋 Step-by-Step Commands

### 1. Run Migration Script
```bash
chmod +x migrate-to-polygon.sh
./migrate-to-polygon.sh
```

### 2. Navigate to New Project
```bash
cd ../ai-power-trade-polygon
```

### 3. Create GitHub Repo
```bash
# Manual: Go to https://github.com/new as 0xCryptotech
# Name: ai-power-trade-polygon
# Then run:
git remote add origin https://github.com/0xCryptotech/ai-power-trade-polygon.git
git branch -M main
git push -u origin main
```

### 4. Get Polygon MATIC
```bash
# Visit: https://faucet.polygon.technology/
# Connect wallet, select Amoy, request MATIC
```

### 5. Add Network to MetaMask
```bash
# Visit: https://chainlist.org/chain/80002
# Click "Add to MetaMask"
```

### 6. Deploy Smart Contract
```bash
# Option A: Remix IDE (Recommended)
# Visit: https://remix.ethereum.org/
# Upload blockchain/AITradeUSDT.sol
# Deploy to Polygon Amoy

# Option B: Python Script
cd blockchain
python deploy_polygon.py
```

### 7. Configure Backend
```bash
cd comprehensive_backend
cp .env.polygon.example .env
nano .env
# Update CONTRACT_ADDRESS and PRIVATE_KEY
```

### 8. Test Backend Locally
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 9. Test API Endpoints
```bash
# Test prices
curl http://localhost:8000/api/prices

# Test dashboard
curl http://localhost:8000/api/dashboard

# Test AI signal
curl http://localhost:8000/api/ai-signal/BTC
```

### 10. Deploy Frontend to Vercel
```bash
cd ..
./deploy-polygon-vercel.sh
```

Or manual:
```bash
cd comprehensive_frontend
npm install
vercel --prod
vercel alias set ai-power-trade-polygon
```

---

## 🔍 Verification Commands

### Check GitHub Repo
```bash
git remote -v
git log --oneline -5
```

### Check Polygon Connection
```bash
curl -X POST https://rpc-amoy.polygon.technology/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Check Contract on PolygonScan
```bash
# Visit: https://amoy.polygonscan.com/address/YOUR_CONTRACT_ADDRESS
```

### Check Backend Health
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/prices | jq
```

### Check Frontend Build
```bash
cd comprehensive_frontend
npm run build
# Should complete without errors
```

---

## 🛠️ Maintenance Commands

### Update Code
```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

### Redeploy Frontend
```bash
cd comprehensive_frontend
vercel --prod
```

### Restart Backend (if on VPS)
```bash
ssh root@YOUR_VPS_IP
cd /opt/ai-power-trade-polygon/comprehensive_backend
pm2 restart ai-trading-backend
```

### View Backend Logs
```bash
ssh root@YOUR_VPS_IP
tail -f /opt/ai-power-trade-polygon/comprehensive_backend/backend.log
```

---

## 🧪 Testing Commands

### Test Wallet Connection
```bash
# In browser console (F12)
ethereum.request({ method: 'eth_chainId' })
// Should return: "0x13882" (80002 in hex)
```

### Test Contract Interaction
```bash
# In browser console
const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
const balance = await contract.methods.balanceOf(YOUR_ADDRESS).call();
console.log('Balance:', balance);
```

### Load Test API
```bash
# Install apache bench
brew install httpd  # Mac
sudo apt install apache2-utils  # Linux

# Test
ab -n 100 -c 10 http://localhost:8000/api/prices
```

---

## 🔧 Troubleshooting Commands

### Clear Node Modules
```bash
cd comprehensive_frontend
rm -rf node_modules package-lock.json
npm install
```

### Clear Python Cache
```bash
cd comprehensive_backend
find . -type d -name "__pycache__" -exec rm -r {} +
find . -type f -name "*.pyc" -delete
```

### Reset Git (if needed)
```bash
git reset --hard HEAD
git clean -fd
```

### Check Port Usage
```bash
# Mac/Linux
lsof -i :8000
lsof -i :3000

# Kill process
kill -9 PID
```

### Check Disk Space
```bash
df -h
du -sh *
```

---

## 📊 Monitoring Commands

### Check Vercel Deployment
```bash
vercel ls
vercel inspect YOUR_DEPLOYMENT_URL
```

### Check Backend Status
```bash
curl -s http://localhost:8000/health | jq
```

### Check Gas Prices
```bash
curl -s https://gasstation.polygon.technology/v2 | jq
```

### Check MATIC Balance
```bash
# In Python
from web3 import Web3
w3 = Web3(Web3.HTTPProvider('https://rpc-amoy.polygon.technology/'))
balance = w3.eth.get_balance('YOUR_ADDRESS')
print(f"Balance: {w3.from_wei(balance, 'ether')} MATIC")
```

---

## 🚨 Emergency Commands

### Rollback Deployment
```bash
vercel rollback
```

### Stop Backend
```bash
# If using uvicorn directly
pkill -f uvicorn

# If using PM2
pm2 stop ai-trading-backend

# If using systemd
sudo systemctl stop ai-trading-backend
```

### Backup Database
```bash
cd comprehensive_backend
cp trading.db trading.db.backup.$(date +%Y%m%d_%H%M%S)
```

### Restore Database
```bash
cd comprehensive_backend
cp trading.db.backup.TIMESTAMP trading.db
```

---

## 📝 Git Commands

### Create Feature Branch
```bash
git checkout -b feature/your-feature
git add .
git commit -m "feat: your feature"
git push origin feature/your-feature
```

### Merge to Main
```bash
git checkout main
git merge feature/your-feature
git push origin main
```

### Tag Release
```bash
git tag -a v1.0.0-polygon -m "Polygon Amoy release"
git push origin v1.0.0-polygon
```

---

## 🔗 Quick Links

### Faucets
```bash
# Polygon Amoy MATIC
open https://faucet.polygon.technology/

# Alchemy Faucet
open https://www.alchemy.com/faucets/polygon-amoy

# Chainlink Faucet
open https://faucets.chain.link/polygon-amoy
```

### Explorers
```bash
# PolygonScan Amoy
open https://amoy.polygonscan.com/

# Your Contract
open https://amoy.polygonscan.com/address/YOUR_CONTRACT_ADDRESS
```

### Tools
```bash
# Remix IDE
open https://remix.ethereum.org/

# Chainlist
open https://chainlist.org/chain/80002

# Vercel Dashboard
open https://vercel.com/dashboard
```

---

## 💡 Pro Tips

### Alias Commands (Add to ~/.zshrc or ~/.bashrc)
```bash
# Polygon shortcuts
alias polygon-cd='cd ~/projects/ai-power-trade-polygon'
alias polygon-backend='cd ~/projects/ai-power-trade-polygon/comprehensive_backend && uvicorn main:app --reload'
alias polygon-frontend='cd ~/projects/ai-power-trade-polygon/comprehensive_frontend && npm run dev'
alias polygon-deploy='cd ~/projects/ai-power-trade-polygon && ./deploy-polygon-vercel.sh'
alias polygon-test='curl http://localhost:8000/api/prices | jq'
```

### Environment Variables
```bash
# Add to ~/.zshrc or ~/.bashrc
export POLYGON_RPC="https://rpc-amoy.polygon.technology/"
export POLYGON_EXPLORER="https://amoy.polygonscan.com"
export POLYGON_FAUCET="https://faucet.polygon.technology/"
```

### Quick Test Script
```bash
# Create test.sh
cat > test-polygon.sh << 'EOF'
#!/bin/bash
echo "🔷 Testing Polygon Setup..."
echo ""
echo "1. Testing RPC..."
curl -s -X POST $POLYGON_RPC -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq
echo ""
echo "2. Testing Backend..."
curl -s http://localhost:8000/api/prices | jq '.success'
echo ""
echo "3. Testing Frontend..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000
echo ""
echo "✅ Tests complete!"
EOF

chmod +x test-polygon.sh
```

---

## 📚 Documentation Commands

### Generate API Docs
```bash
cd comprehensive_backend
python -c "import main; print(main.app.openapi())" > openapi.json
```

### Count Lines of Code
```bash
find . -name "*.py" -o -name "*.js" -o -name "*.sol" | xargs wc -l
```

### List Dependencies
```bash
# Python
pip list

# Node.js
npm list --depth=0
```

---

## 🎯 Complete Setup (Copy-Paste)

```bash
# Complete setup in one go
chmod +x migrate-to-polygon.sh && \
./migrate-to-polygon.sh && \
cd ../ai-power-trade-polygon && \
echo "✅ Migration complete! Next: Create GitHub repo and push"
```

---

**Quick Reference**: Keep this file handy during migration!
