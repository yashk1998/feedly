#!/bin/bash
# ─── Syncd Deploy Script ─────────────────────────────────────
# Build locally and deploy to VM via SSH
# Usage: bash deploy/deploy.sh user@your-vm-ip
# ──────────────────────────────────────────────────────────────

set -euo pipefail

VM_HOST="${1:?Usage: deploy.sh user@host}"
APP_DIR="/opt/syncd"

echo "═══ Building Syncd ═══"

# Build
npm run build

# Package standalone output
echo "Packaging..."
tar -czf /tmp/syncd-deploy.tar.gz \
  .next/standalone \
  .next/static \
  public \
  prisma \
  package.json

echo "═══ Deploying to $VM_HOST ═══"

# Upload
scp /tmp/syncd-deploy.tar.gz "$VM_HOST:/tmp/"

# Deploy on VM
ssh "$VM_HOST" << 'REMOTE'
  set -euo pipefail
  APP_DIR="/opt/syncd"

  # Extract
  sudo -u syncd mkdir -p $APP_DIR/backup
  sudo -u syncd cp -r $APP_DIR/.next $APP_DIR/backup/.next 2>/dev/null || true

  cd $APP_DIR
  sudo -u syncd tar -xzf /tmp/syncd-deploy.tar.gz --strip-components=0

  # Flatten standalone into app root
  sudo -u syncd cp -r .next/standalone/* .
  sudo -u syncd cp -r .next/static .next/

  # Run migrations
  sudo -u syncd npx prisma migrate deploy

  # Restart
  sudo systemctl restart syncd

  echo "Deployed! Checking status..."
  sleep 2
  sudo systemctl status syncd --no-pager -l
REMOTE

rm /tmp/syncd-deploy.tar.gz
echo "═══ Deploy complete ═══"
