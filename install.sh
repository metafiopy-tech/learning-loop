#!/usr/bin/env bash
set -e

REPO_URL="https://github.com/YOUR_USERNAME/learning-loop"
APP_DIR="learning-loop"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        Learning Loop Installer       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Prerequisites ──────────────────────────────────────────────────────────────

check() {
  if ! command -v "$1" &>/dev/null; then
    echo "✗ $1 is required but not installed."
    echo "  Install it at: $2"
    exit 1
  fi
  echo "✓ $1 found"
}

check node  "https://nodejs.org"
check npm   "https://nodejs.org"
check git   "https://git-scm.com"

NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "✗ Node.js 18+ required (you have $(node -v)). Upgrade at https://nodejs.org"
  exit 1
fi

echo ""

# ── Clone ──────────────────────────────────────────────────────────────────────

if [ -d "$APP_DIR" ]; then
  echo "📁 '$APP_DIR' folder already exists — pulling latest..."
  cd "$APP_DIR" && git pull --quiet && cd ..
else
  echo "📦 Cloning learning-loop..."
  git clone --quiet "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

# ── Install deps ───────────────────────────────────────────────────────────────

echo ""
echo "📥 Installing dependencies..."
npm install --silent

# ── Done ───────────────────────────────────────────────────────────────────────

echo ""
echo "✅ All done!"
echo ""
echo "   To start:  cd $APP_DIR && npm run dev"
echo "   Then open: http://localhost:3000"
echo ""

read -r -p "   Start it now? [Y/n] " START
if [[ "$START" =~ ^[Yy]$|^$ ]]; then
  echo ""
  echo "🚀 Starting Learning Loop at http://localhost:3000"
  echo "   Press Ctrl+C to stop."
  echo ""
  npm run dev
fi
