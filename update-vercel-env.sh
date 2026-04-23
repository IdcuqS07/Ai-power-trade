#!/bin/bash

# Update Vercel environment variable to HTTPS
echo "Updating NEXT_PUBLIC_API_URL to HTTPS..."

# Remove old variable (auto-confirm with yes)
echo "y" | vercel env rm NEXT_PUBLIC_API_URL production

# Add new variable with HTTPS
echo "https://ai-powertrade.duckdns.org" | vercel env add NEXT_PUBLIC_API_URL production

echo "✓ Environment variable updated!"
echo "Deploying to production..."

# Deploy
vercel --prod

echo "✓ Deployment complete!"
