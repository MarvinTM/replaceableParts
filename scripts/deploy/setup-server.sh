#!/bin/bash
#
# First-time server setup script for replaceableParts
# Run this ONCE on a fresh Ubuntu EC2 instance
#
# Usage: ./setup-server.sh
# This script should be copied to and run ON the remote server
#

set -e  # Exit on any error

echo "=== replaceableParts Server Setup ==="
echo ""

# ============================================
# CONFIGURATION - Edit these values
# ============================================
DOMAIN_NAME="${DOMAIN_NAME:-your-domain.com}"
APP_DIR="/var/www/replaceableParts"
DB_NAME="replaceableparts"
DB_USER="replaceableparts"
DB_PASSWORD="${DB_PASSWORD:-CHANGE_THIS_PASSWORD}"  # Set via environment variable
NODE_VERSION="20"  # LTS version
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@your-domain.com}"  # For Let's Encrypt notifications

# ============================================
# System Updates
# ============================================
echo "[1/8] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# ============================================
# Install Node.js
# ============================================
echo "[2/8] Installing Node.js ${NODE_VERSION}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt install -y nodejs
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# ============================================
# Install PostgreSQL
# ============================================
echo "[3/8] Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
echo "[3/8] Configuring PostgreSQL database..."
sudo -u postgres psql <<EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
        CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF

echo "PostgreSQL configured with database: ${DB_NAME}"

# ============================================
# Install nginx
# ============================================
echo "[4/8] Installing nginx..."
sudo apt install -y nginx

# ============================================
# Install PM2
# ============================================
echo "[5/8] Installing PM2..."
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd -u $USER --hp $HOME
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# ============================================
# Create application directory
# ============================================
echo "[6/8] Creating application directory..."
sudo mkdir -p ${APP_DIR}
sudo chown -R $USER:$USER ${APP_DIR}

# ============================================
# Configure nginx
# ============================================
echo "[7/8] Configuring nginx..."

sudo tee /etc/nginx/sites-available/replaceableParts > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_NAME};

    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP to HTTPS (enabled after SSL setup)
    # location / {
    #     return 301 https://\$server_name\$request_uri;
    # }

    # Temporary: serve directly until SSL is configured
    location / {
        root ${APP_DIR}/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/replaceableParts /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx

# ============================================
# Install Certbot and get SSL certificate
# ============================================
echo "[8/8] Setting up Let's Encrypt SSL..."
sudo apt install -y certbot python3-certbot-nginx

echo ""
echo "To obtain SSL certificate, run:"
echo "  sudo certbot --nginx -d ${DOMAIN_NAME} --email ${ADMIN_EMAIL} --agree-tos --non-interactive"
echo ""
echo "Or for interactive mode:"
echo "  sudo certbot --nginx -d ${DOMAIN_NAME}"
echo ""

# ============================================
# Configure firewall
# ============================================
echo "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# ============================================
# Create environment file template
# ============================================
echo "Creating environment file template..."
cat > ${APP_DIR}/.env.production <<EOF
# Backend environment variables
# Copy this to backend/.env and fill in the values

NODE_ENV=production
PORT=3001

# Database
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"

# JWT Secret - CHANGE THIS!
JWT_SECRET=your-super-secret-jwt-key-change-this

# Google OAuth (if using)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email (if using)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EOF

# ============================================
# Summary
# ============================================
echo ""
echo "============================================"
echo "Server setup complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Update ${APP_DIR}/.env.production with your actual values"
echo "2. Copy it to ${APP_DIR}/backend/.env"
echo "3. Run the SSL certificate command above"
echo "4. Run the deploy.sh script to deploy the application"
echo ""
echo "Installed versions:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  PostgreSQL: $(psql --version)"
echo "  nginx: $(nginx -v 2>&1)"
echo "  PM2: $(pm2 --version)"
echo ""
