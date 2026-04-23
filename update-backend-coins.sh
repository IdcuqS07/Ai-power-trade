#!/bin/bash

# Update backend dengan koin baru
echo "🔄 Updating backend with new coins..."

# Copy file ke VPS
scp comprehensive_backend/main.py root@143.198.205.88:/root/comprehensive_backend/main.py

# Restart service
ssh root@143.198.205.88 "systemctl restart ai-trading-backend && systemctl status ai-trading-backend"

echo "✅ Backend updated with 20 trading pairs!"
