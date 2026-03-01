#!/bin/bash
# ─── Syncd VM Setup Script ───────────────────────────────────
# Run on a fresh Ubuntu 22.04/24.04 VM (Azure B2s / AWS t3.small)
# Usage: sudo bash vm-setup.sh
# ──────────────────────────────────────────────────────────────

set -euo pipefail

APP_USER="syncd"
APP_DIR="/opt/syncd"
DOMAIN="${SYNCD_DOMAIN:-syncd.yourdomain.com}"

echo "══════════════════════════════════════════"
echo "  Syncd VM Setup — PostgreSQL + Redis + Node.js"
echo "══════════════════════════════════════════"

# ─── 1. System packages ──────────────────────────────────────
echo "[1/7] Installing system packages..."
apt-get update -qq
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw

# ─── 2. Node.js 20 ───────────────────────────────────────────
echo "[2/7] Installing Node.js 20..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
echo "  Node $(node -v), npm $(npm -v)"

# ─── 3. PostgreSQL + pgvector ─────────────────────────────────
echo "[3/7] Installing PostgreSQL + pgvector..."
apt-get install -y -qq postgresql postgresql-contrib

# Install pgvector extension
PG_VERSION=$(pg_config --version | grep -oP '\d+' | head -1)
apt-get install -y -qq postgresql-${PG_VERSION}-pgvector 2>/dev/null || {
  # If package not available, build from source
  echo "  Building pgvector from source..."
  apt-get install -y -qq build-essential postgresql-server-dev-${PG_VERSION}
  cd /tmp && git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git
  cd pgvector && make && make install
  cd / && rm -rf /tmp/pgvector
}

systemctl enable postgresql
systemctl start postgresql

# Create database and user
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='syncd'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER syncd WITH PASSWORD 'changeme_syncd_db_password';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='syncd'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE syncd OWNER syncd;"

# Enable pgvector extension
sudo -u postgres psql -d syncd -c "CREATE EXTENSION IF NOT EXISTS vector;"

echo "  PostgreSQL + pgvector ready (db: syncd, user: syncd)"
echo "  ⚠  Change the password in .env: DATABASE_URL"

# ─── 4. Redis ────────────────────────────────────────────────
echo "[4/7] Installing Redis..."
apt-get install -y -qq redis-server
# Bind to localhost only (secure)
sed -i 's/^bind .*/bind 127.0.0.1 ::1/' /etc/redis/redis.conf
sed -i 's/^supervised .*/supervised systemd/' /etc/redis/redis.conf
systemctl enable redis-server
systemctl restart redis-server
echo "  Redis ready on localhost:6379"

# ─── 5. App user + directory ─────────────────────────────────
echo "[5/7] Setting up app directory..."
id -u $APP_USER &>/dev/null || useradd --system --shell /bin/bash --home $APP_DIR $APP_USER
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# ─── 6. Nginx reverse proxy ─────────────────────────────────
echo "[6/7] Configuring Nginx..."
cat > /etc/nginx/sites-available/syncd <<NGINX
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/syncd /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ─── 7. Systemd service ─────────────────────────────────────
echo "[7/7] Creating systemd service..."
cat > /etc/systemd/system/syncd.service <<SERVICE
[Unit]
Description=Syncd RSS Reader
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/node $APP_DIR/server.js
Restart=on-failure
RestartSec=5

# Security hardening
NoNewPrivileges=yes
ProtectHome=yes
ProtectSystem=strict
ReadWritePaths=$APP_DIR /tmp

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable syncd

# ─── 8. Firewall ─────────────────────────────────────────────
echo "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ─── Done ─────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo "  Setup complete!"
echo "══════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Clone/copy your built app to $APP_DIR/"
echo "  2. Copy .env to $APP_DIR/.env and update:"
echo "     DATABASE_URL=\"postgresql://syncd:changeme_syncd_db_password@localhost:5432/syncd\""
echo "     REDIS_URL=\"redis://localhost:6379\""
echo "  3. Run migrations: cd $APP_DIR && npx prisma migrate deploy"
echo "  4. Start: sudo systemctl start syncd"
echo "  5. SSL: sudo certbot --nginx -d $DOMAIN"
echo ""
