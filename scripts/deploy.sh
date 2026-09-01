#!/usr/bin/env bash
set -e

echo "🚀 Starting deployment for Kyron Realty AI..."

# Ensure we are in the project root
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "📥 Pulling latest changes from git..."
git pull origin main

echo "📦 Installing production dependencies..."
npm ci --legacy-peer-deps || npm install

echo "🛠️ Generating database migrations & applying (if any)..."
if [ -f .env ] && grep -q "DATABASE_URL" .env; then
  npx drizzle-kit push || echo "Database sync skipped or already up to date"
fi

echo "🏗️ Building Next.js application..."
npm run build

echo "📂 Copying public and static assets to standalone directory..."
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/
if [ -d public ]; then
  cp -r public .next/standalone/
fi
if [ -f .env ]; then
  cp .env .next/standalone/
fi

echo "🔄 Reloading PM2 application with zero downtime..."
if pm2 describe kyron-realty-ai > /dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi

pm2 save

echo "✅ Kyron Realty AI deployment completed successfully!"
