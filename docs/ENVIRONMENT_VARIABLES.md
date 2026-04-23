# 🔐 Environment Variables Guide

Complete reference for all environment variables used in the AI Trading Platform.

---

## 📋 Quick Reference

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BINANCE_MODE` | ✅ Yes | `testnet` | Trading mode: `testnet` or `production` |
| `BINANCE_TESTNET_API_KEY` | ✅ Yes* | - | Binance Testnet API Key |
| `BINANCE_TESTNET_SECRET` | ✅ Yes* | - | Binance Testnet Secret Key |
| `BINANCE_API_KEY` | ⚠️ Prod** | - | Binance Production API Key |
| `BINANCE_SECRET` | ⚠️ Prod** | - | Binance Production Secret Key |
| `WEEX_API_KEY` | ❌ No | - | WEEX Exchange API Key |
| `WEEX_SECRET_KEY` | ❌ No | - | WEEX Exchange Secret Key |
| `OWNER_PRIVATE_KEY` | ❌ No | - | Blockchain owner private key |
| `PORT` | ❌ No | `8000` | Server port |
| `HOST` | ❌ No | `0.0.0.0` | Server host |
| `ENVIRONMENT` | ❌ No | `development` | Environment name |
| `LOG_LEVEL` | ❌ No | `INFO` | Logging level |
| `CORS_ORIGINS` | ❌ No | `*` | Allowed CORS origins |

\* Required when `BINANCE_MODE=testnet`  
\** Required when `BINANCE_MODE=production`

### Frontend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | `http://localhost:8000` | Backend API URL |
| `NEXT_PUBLIC_WS_URL` | ❌ No | Same as API_URL | WebSocket URL |

---

## 🔧 Setup Instructions

### Local Development

#### Backend (.env)
```bash
# Create .env file
cd comprehensive_backend
cp .env.example .env

# Edit with your values
nano .env
```

Example `.env`:
```bash
BINANCE_MODE=testnet
BINANCE_TESTNET_API_KEY=abc123xyz789
BINANCE_TESTNET_SECRET=secret123secret456
```

#### Frontend (.env.local)
```bash
# Create .env.local file
cd comprehensive_frontend
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Example `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### Production Deployment

#### Render.com
1. Go to your service → **Environment** tab
2. Click **Add Environment Variable**
3. Add each variable
4. Click **Save Changes**

#### Vercel
1. Go to project → **Settings** → **Environment Variables**
2. Add each variable
3. Select environment (Production/Preview/Development)
4. Click **Save**

#### Railway
1. Go to project → **Variables** tab
2. Click **New Variable**
3. Add each variable
4. Changes apply automatically

#### Heroku
```bash
heroku config:set BINANCE_MODE=testnet
heroku config:set BINANCE_TESTNET_API_KEY=your_key
heroku config:set BINANCE_TESTNET_SECRET=your_secret
```

---

## 📖 Detailed Variable Descriptions

### BINANCE_MODE
**Type:** String  
**Values:** `testnet` | `production`  
**Default:** `testnet`

Controls which Binance environment to use:
- `testnet`: Uses Binance Testnet (https://testnet.binance.vision/)
- `production`: Uses real Binance (https://www.binance.com/)

⚠️ **Warning:** Production mode uses real money!

**Example:**
```bash
BINANCE_MODE=testnet
```

---

### BINANCE_TESTNET_API_KEY
**Type:** String  
**Required:** Yes (when mode=testnet)

Your Binance Testnet API Key.

**How to get:**
1. Visit https://testnet.binance.vision/
2. Login with GitHub
3. Go to "API Keys" section
4. Click "Generate HMAC_SHA256 Key"
5. Copy the API Key

**Example:**
```bash
BINANCE_TESTNET_API_KEY=vmPUZE6mv9SD5VNHk4HlWFsOr6aKE2zvsw0MuIgwCIPy6utIco14y7Ju91duEh8A
```

---

### BINANCE_TESTNET_SECRET
**Type:** String  
**Required:** Yes (when mode=testnet)

Your Binance Testnet Secret Key.

⚠️ **Important:** This is shown only once when generated!

**Example:**
```bash
BINANCE_TESTNET_SECRET=NhqPtmdSJYdKjVHjA7PZj4Mge3R5YNiP1e3UZjInClVN65XAbvqqM6A7H5fATj0j
```

---

### BINANCE_API_KEY & BINANCE_SECRET
**Type:** String  
**Required:** Yes (when mode=production)

Your real Binance API credentials.

⚠️ **Warning:** 
- Only use in production
- Never commit to Git
- Enable IP whitelist
- Use API key restrictions
- Start with small amounts

**How to get:**
1. Login to https://www.binance.com/
2. Go to API Management
3. Create new API key
4. Enable "Enable Spot & Margin Trading"
5. Set IP restrictions
6. Save both keys securely

---

### WEEX_API_KEY & WEEX_SECRET_KEY
**Type:** String  
**Required:** No (optional)

WEEX Exchange API credentials for additional market data.

**How to get:**
1. Register at https://www.weex.com/
2. Complete KYC verification
3. Go to API Management
4. Generate API key

**Example:**
```bash
WEEX_API_KEY=your_weex_api_key
WEEX_SECRET_KEY=your_weex_secret_key
```

---

### OWNER_PRIVATE_KEY
**Type:** String (hex)  
**Required:** No (optional)

Blockchain private key for settlement contract operations.

⚠️ **Security Warning:**
- Never commit to Git
- Use only for testnet
- Keep secure and encrypted
- Rotate regularly

**Format:**
```bash
OWNER_PRIVATE_KEY=0x1234567890abcdef...
```

---

### PORT
**Type:** Number  
**Default:** `8000`

Port number for the backend server.

**Note:** Most hosting platforms set this automatically via `$PORT`.

**Example:**
```bash
PORT=8000
```

---

### ENVIRONMENT
**Type:** String  
**Values:** `development` | `staging` | `production`  
**Default:** `development`

Current environment name for logging and behavior.

**Example:**
```bash
ENVIRONMENT=production
```

---

### LOG_LEVEL
**Type:** String  
**Values:** `DEBUG` | `INFO` | `WARNING` | `ERROR` | `CRITICAL`  
**Default:** `INFO`

Logging verbosity level.

**Example:**
```bash
LOG_LEVEL=INFO
```

---

### NEXT_PUBLIC_API_URL
**Type:** String (URL)  
**Required:** Yes (frontend)

Backend API URL for frontend to connect to.

⚠️ **Important:** Must start with `NEXT_PUBLIC_` to be exposed to browser.

**Examples:**
```bash
# Local development
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production
NEXT_PUBLIC_API_URL=https://ai-trading-backend.onrender.com
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Use `.env.example` for documentation
- Store secrets in platform environment variables
- Use different keys for testnet and production
- Rotate API keys regularly
- Enable IP whitelist on Binance
- Use API key restrictions
- Enable 2FA on exchange accounts
- Keep private keys encrypted
- Use testnet for development

### ❌ DON'T:
- Commit `.env` files to Git
- Share API keys publicly
- Use production keys in testnet
- Store secrets in code
- Use same keys across environments
- Disable security features
- Share private keys
- Use production without testing

---

## 🧪 Testing Configuration

### Verify Backend Variables
```bash
# Check if variables are loaded
curl http://localhost:8000/api/status

# Should show:
# - binance.trading.configured: true
# - binance.trading.mode: "testnet"
```

### Verify Frontend Variables
```javascript
// In browser console
console.log(process.env.NEXT_PUBLIC_API_URL)
// Should output your backend URL
```

---

## 🐛 Troubleshooting

### "Binance credentials not configured"
**Problem:** API keys not loaded  
**Solution:** 
- Check variable names are correct
- Verify `.env` file exists
- Restart server after changes
- Check for typos in variable names

### "Invalid API key"
**Problem:** Wrong API key or mode mismatch  
**Solution:**
- Verify you're using testnet keys with `BINANCE_MODE=testnet`
- Check keys are copied correctly (no extra spaces)
- Regenerate keys if needed

### "Frontend can't connect to backend"
**Problem:** Wrong API URL  
**Solution:**
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is running
- Check for CORS issues
- Ensure URL includes protocol (http:// or https://)

### "Environment variables not updating"
**Problem:** Cached values  
**Solution:**
- Restart development server
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run build`
- Check platform dashboard for typos

---

## 📚 Additional Resources

- **Binance Testnet:** https://testnet.binance.vision/
- **Binance API Docs:** https://binance-docs.github.io/apidocs/
- **WEEX API Docs:** https://doc-en.weex.com/
- **Render Docs:** https://render.com/docs/environment-variables
- **Vercel Docs:** https://vercel.com/docs/environment-variables

---

## 📞 Support

Need help with environment variables?

1. Check `.env.example` files
2. Review `DEPLOYMENT_GUIDE.md`
3. See `TROUBLESHOOTING.md`
4. Open GitHub issue

---

**Keep your secrets safe! 🔐**
