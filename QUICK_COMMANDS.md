# ⚡ Quick Commands Reference

## Super Fast Migration (11 minutes)

### 1️⃣ Run Super Script (2 min)
```bash
./super-migrate-polygon.sh
```
✅ Creates GitHub repo automatically
✅ Pushes all files automatically
✅ Updates all configs automatically

---

### 2️⃣ Deploy Contract (5 min)

**Via Remix (Recommended):**
```
1. Open: https://remix.ethereum.org/
2. Upload: blockchain/AITradeUSDT.sol
3. Compile: Solidity 0.8.19
4. Deploy: Polygon Amoy (80002)
5. Copy: Contract address
```

**Via Python:**
```bash
cd ../ai-power-trade-polygon/blockchain
python3 deploy_polygon.py
```

---

### 3️⃣ Update Config (1 min)
```bash
cd ../ai-power-trade-polygon/comprehensive_backend
cp .env.polygon .env
nano .env
# Update: CONTRACT_ADDRESS=0x...
# Update: PRIVATE_KEY=0x...
# Save: Ctrl+O, Enter, Ctrl+X
```

---

### 4️⃣ Deploy Frontend (3 min)
```bash
cd ../ai-power-trade-polygon
./quick-deploy-polygon.sh
```

---

## Useful Commands

### Check GitHub CLI
```bash
gh --version
gh auth status
gh auth switch --user 0xCryptotech
```

### Get MATIC
```bash
# Open faucet
open https://faucet.polygon.technology/
```

### Check Repo
```bash
# View on GitHub
gh repo view 0xCryptotech/ai-power-trade-polygon --web

# Clone repo
gh repo clone 0xCryptotech/ai-power-trade-polygon
```

### Test Backend
```bash
cd comprehensive_backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Test endpoints
curl http://localhost:8000/api/prices
curl http://localhost:8000/api/dashboard
```

### Test Frontend
```bash
cd comprehensive_frontend
npm install
npm run dev
# Open: http://localhost:3000
```

### Deploy to Vercel
```bash
cd comprehensive_frontend
vercel --prod
vercel alias set ai-power-trade-polygon
```

### Check Contract
```bash
# Open explorer
open https://amoy.polygonscan.com/address/YOUR_CONTRACT_ADDRESS
```

---

## Troubleshooting Commands

### Fix GitHub CLI
```bash
# Reinstall
brew upgrade gh

# Re-login
gh auth login

# Switch account
gh auth switch --user 0xCryptotech
```

### Delete & Retry
```bash
# Delete GitHub repo
gh repo delete 0xCryptotech/ai-power-trade-polygon --yes

# Delete local folder
rm -rf ../ai-power-trade-polygon

# Run super script again
./super-migrate-polygon.sh
```

### Check Network
```bash
# Test Polygon RPC
curl -X POST https://rpc-amoy.polygon.technology/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Check MATIC Balance
```bash
# Via MetaMask or
# Via Python
python3 -c "
from web3 import Web3
w3 = Web3(Web3.HTTPProvider('https://rpc-amoy.polygon.technology/'))
address = 'YOUR_ADDRESS'
balance = w3.eth.get_balance(address)
print(f'{w3.from_wei(balance, \"ether\")} MATIC')
"
```

---

## One-Liner Commands

### Complete Migration
```bash
./super-migrate-polygon.sh && echo "✅ Repo created! Now deploy contract."
```

### Quick Deploy
```bash
cd ../ai-power-trade-polygon && ./quick-deploy-polygon.sh
```

### Open All Resources
```bash
open https://github.com/0xCryptotech/ai-power-trade-polygon && \
open https://remix.ethereum.org/ && \
open https://faucet.polygon.technology/ && \
open https://amoy.polygonscan.com/
```

### Full Test
```bash
cd comprehensive_backend && \
uvicorn main:app --reload --port 8000 & \
cd ../comprehensive_frontend && \
npm run dev
```

---

## Keyboard Shortcuts

### Terminal
- `Ctrl+C` - Stop process
- `Ctrl+Z` - Suspend process
- `Ctrl+L` - Clear screen
- `Ctrl+R` - Search history

### Nano Editor
- `Ctrl+O` - Save file
- `Ctrl+X` - Exit
- `Ctrl+K` - Cut line
- `Ctrl+U` - Paste line

### VS Code
- `Cmd+P` - Quick open
- `Cmd+Shift+P` - Command palette
- `Cmd+B` - Toggle sidebar
- `Cmd+J` - Toggle terminal

---

## Environment Variables

### Required in .env
```bash
# Blockchain
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology/
POLYGON_CHAIN_ID=80002

# APIs (optional)
BINANCE_API_KEY=...
BINANCE_API_SECRET=...
WEEX_API_KEY=...
WEEX_API_SECRET=...
```

---

## Git Commands

### Basic
```bash
git status
git add .
git commit -m "message"
git push origin main
```

### Branches
```bash
git branch
git checkout -b feature-name
git merge feature-name
```

### Undo
```bash
git reset --soft HEAD~1  # Undo last commit
git reset --hard HEAD~1  # Undo & delete changes
git checkout -- file.js  # Discard file changes
```

---

## NPM Commands

### Install
```bash
npm install
npm install package-name
npm install -g package-name
```

### Run
```bash
npm run dev
npm run build
npm start
```

### Clean
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Python Commands

### Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
deactivate
```

### Packages
```bash
pip install -r requirements.txt
pip install package-name
pip freeze > requirements.txt
```

### Run
```bash
python3 script.py
uvicorn main:app --reload
```

---

## Vercel Commands

### Deploy
```bash
vercel
vercel --prod
vercel alias set domain-name
```

### Logs
```bash
vercel logs
vercel logs --follow
```

### Env
```bash
vercel env add
vercel env ls
vercel env rm
```

---

## Docker Commands (if needed)

### Build & Run
```bash
docker build -t ai-power-trade .
docker run -p 8000:8000 ai-power-trade
```

### Clean
```bash
docker ps -a
docker stop container-id
docker rm container-id
docker system prune -a
```

---

## Monitoring Commands

### Check Processes
```bash
ps aux | grep python
ps aux | grep node
```

### Kill Process
```bash
kill -9 PID
killall python3
killall node
```

### Check Ports
```bash
lsof -i :8000
lsof -i :3000
```

---

## Quick Links

### Open in Browser
```bash
# GitHub Repo
open https://github.com/0xCryptotech/ai-power-trade-polygon

# Remix IDE
open https://remix.ethereum.org/

# Faucet
open https://faucet.polygon.technology/

# Explorer
open https://amoy.polygonscan.com/

# Polygon Docs
open https://docs.polygon.technology/
```

---

## Aliases (Add to ~/.zshrc)

```bash
# Migration
alias migrate="./super-migrate-polygon.sh"
alias deploy="./quick-deploy-polygon.sh"

# Navigation
alias polygon="cd ../ai-power-trade-polygon"
alias backend="cd comprehensive_backend"
alias frontend="cd comprehensive_frontend"

# Quick commands
alias serve-backend="uvicorn main:app --reload --port 8000"
alias serve-frontend="npm run dev"

# Git shortcuts
alias gs="git status"
alias ga="git add ."
alias gc="git commit -m"
alias gp="git push origin main"

# Open resources
alias remix="open https://remix.ethereum.org/"
alias faucet="open https://faucet.polygon.technology/"
alias explorer="open https://amoy.polygonscan.com/"
```

**Apply aliases:**
```bash
source ~/.zshrc
```

---

## Cheat Sheet

### Full Migration Flow
```bash
# 1. Migrate (2 min)
./super-migrate-polygon.sh

# 2. Get MATIC (2 min)
open https://faucet.polygon.technology/

# 3. Deploy contract (5 min)
open https://remix.ethereum.org/
# Upload blockchain/AITradeUSDT.sol
# Deploy to Polygon Amoy (80002)

# 4. Update config (1 min)
cd ../ai-power-trade-polygon/comprehensive_backend
cp .env.polygon .env
nano .env  # Add CONTRACT_ADDRESS & PRIVATE_KEY

# 5. Deploy frontend (3 min)
cd ..
./quick-deploy-polygon.sh

# Done! ✅
```

---

## Emergency Commands

### Rollback Migration
```bash
# Delete GitHub repo
gh repo delete 0xCryptotech/ai-power-trade-polygon --yes

# Delete local folder
rm -rf ../ai-power-trade-polygon

# Start over
./super-migrate-polygon.sh
```

### Fix Broken Deployment
```bash
# Re-deploy frontend
cd comprehensive_frontend
vercel --prod --force

# Restart backend
cd ../comprehensive_backend
pkill -f uvicorn
uvicorn main:app --reload --port 8000
```

### Clear Cache
```bash
# Frontend
rm -rf comprehensive_frontend/.next
rm -rf comprehensive_frontend/node_modules
cd comprehensive_frontend && npm install

# Backend
rm -rf comprehensive_backend/__pycache__
rm -rf comprehensive_backend/.pytest_cache
```

---

**Quick Start:**
```bash
./super-migrate-polygon.sh
```

**Total Time:** 11 minutes
**Automation:** 80%
**Result:** Perfect migration! 🚀
