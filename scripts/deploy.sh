#!/usr/bin/env bash
set -e

echo "🚀 Starting deployment for Kyron Realty AI..."

# Ensure we are in the project root
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "📥 Syncing latest changes from git..."
git fetch origin main
git reset --hard origin/main

echo "📦 Installing production dependencies..."
npm ci --legacy-peer-deps || npm install

echo "🛠️ Applying database migrations..."
# A failed or unconfigured migration aborts the deploy (set -e); drizzle.config.ts refuses to run without DATABASE_URL.
npx drizzle-kit migrate

echo "🏗️ Building Next.js application..."
npm run build

echo "📂 Ensuring persistent upload storage..."
mkdir -p "$PROJECT_DIR/public/uploads/properties"

echo "📂 Copying public and static assets to standalone directory..."
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/
if [ -d public ]; then
  cp -r public .next/standalone/
fi

# Ensure standalone public/uploads symlinks to root persistent uploads directory
rm -rf "$PROJECT_DIR/.next/standalone/public/uploads"
ln -sfn "$PROJECT_DIR/public/uploads" "$PROJECT_DIR/.next/standalone/public/uploads"

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
