#!/bin/bash

echo "🔧 Starting Vercel build process..."

# Installer les dépendances
echo "📦 Installing dependencies..."
pnpm install

# Générer le client Prisma
echo "🗄️ Generating Prisma client..."
pnpm prisma generate

# Build Next.js
echo "🏗️ Building Next.js application..."
pnpm next build

echo "✅ Build completed successfully!" 