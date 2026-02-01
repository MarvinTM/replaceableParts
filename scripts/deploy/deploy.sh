#!/bin/bash
#
# Deployment script for replaceableParts
# Run this locally to build and deploy to the remote server
#
# Usage: ./deploy.sh [--skip-build] [--skip-migrate]
#

set -e  # Exit on any error

# ============================================
# Load configuration file if exists
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/deploy.config.local.sh" ]; then
    source "${SCRIPT_DIR}/deploy.config.local.sh"
elif [ -f "${SCRIPT_DIR}/deploy.config.sh" ]; then
    source "${SCRIPT_DIR}/deploy.config.sh"
fi

# ============================================
# CONFIGURATION - Override via config file or environment
# ============================================
SSH_KEY="${SSH_KEY:-~/.ssh/your-key.pem}"
SSH_USER="${SSH_USER:-ubuntu}"
SSH_HOST="${SSH_HOST:-your-server-ip-or-domain.com}"
REMOTE_DIR="/var/www/replaceableParts"

# Local paths (relative to project root)
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
BACKEND_DIR="${PROJECT_ROOT}/backend"

# SSH command helper
SSH_CMD="ssh -i ${SSH_KEY} ${SSH_USER}@${SSH_HOST}"
SCP_CMD="scp -i ${SSH_KEY}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# Parse arguments
# ============================================
SKIP_BUILD=false
SKIP_MIGRATE=false
BACKUP_DB=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-migrate)
            SKIP_MIGRATE=true
            shift
            ;;
        --no-backup)
            BACKUP_DB=false
            shift
            ;;
        --help)
            echo "Usage: ./deploy.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-build    Skip the local build step"
            echo "  --skip-migrate  Skip database migrations"
            echo "  --no-backup     Skip database backup before migration"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# ============================================
# Functions
# ============================================
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_connection() {
    log_info "Testing SSH connection..."
    if ! ${SSH_CMD} "echo 'Connection successful'" > /dev/null 2>&1; then
        log_error "Failed to connect to ${SSH_USER}@${SSH_HOST}"
        log_error "Check your SSH_KEY, SSH_USER, and SSH_HOST settings"
        exit 1
    fi
    log_info "SSH connection OK"
}

# ============================================
# Pre-flight checks
# ============================================
echo ""
echo "============================================"
echo "replaceableParts Deployment"
echo "============================================"
echo ""
echo "Target: ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}"
echo ""

# Check SSH key exists
if [[ ! -f "${SSH_KEY/#\~/$HOME}" ]]; then
    log_error "SSH key not found: ${SSH_KEY}"
    log_error "Set SSH_KEY environment variable or edit this script"
    exit 1
fi

# Expand ~ in SSH_KEY
SSH_KEY="${SSH_KEY/#\~/$HOME}"

# Test SSH connection
check_connection

# ============================================
# Step 1: Build locally
# ============================================
if [ "$SKIP_BUILD" = true ]; then
    log_warn "Skipping build (--skip-build)"
else
    log_info "Building frontend..."
    cd "${FRONTEND_DIR}"
    npm run build

    log_info "Frontend build complete"
fi

# ============================================
# Step 2: Create deployment package
# ============================================
log_info "Creating deployment package..."
DEPLOY_TMP=$(mktemp -d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_ARCHIVE="deploy_${TIMESTAMP}.tar.gz"

# Copy frontend dist
mkdir -p "${DEPLOY_TMP}/frontend"
cp -r "${FRONTEND_DIR}/dist" "${DEPLOY_TMP}/frontend/"

# Copy backend (excluding node_modules)
mkdir -p "${DEPLOY_TMP}/backend"
cp -r "${BACKEND_DIR}/src" "${DEPLOY_TMP}/backend/"
cp -r "${BACKEND_DIR}/prisma" "${DEPLOY_TMP}/backend/"
cp -r "${BACKEND_DIR}/assets" "${DEPLOY_TMP}/backend/"
cp "${BACKEND_DIR}/package.json" "${DEPLOY_TMP}/backend/"
cp "${BACKEND_DIR}/package-lock.json" "${DEPLOY_TMP}/backend/"

# Create tarball
cd "${DEPLOY_TMP}"
tar -czf "${DEPLOY_ARCHIVE}" frontend backend
log_info "Package created: ${DEPLOY_ARCHIVE}"

# ============================================
# Step 3: Backup database (optional)
# ============================================
if [ "$BACKUP_DB" = true ] && [ "$SKIP_MIGRATE" = false ]; then
    log_info "Creating database backup on remote server..."
    ${SSH_CMD} "mkdir -p ${REMOTE_DIR}/backups && \
        cd ${REMOTE_DIR}/backend && \
        if [ -f .env ]; then \
            source .env 2>/dev/null || true; \
            pg_dump \${DATABASE_URL} > ${REMOTE_DIR}/backups/backup_${TIMESTAMP}.sql 2>/dev/null || echo 'Backup skipped (no existing database)'; \
        fi"
fi

# ============================================
# Step 4: Upload to server
# ============================================
log_info "Uploading to server..."
${SCP_CMD} "${DEPLOY_TMP}/${DEPLOY_ARCHIVE}" "${SSH_USER}@${SSH_HOST}:/tmp/"

# ============================================
# Step 5: Deploy on remote server
# ============================================
log_info "Deploying on remote server..."

${SSH_CMD} << REMOTE_SCRIPT
set -e

echo "Extracting deployment package..."
cd ${REMOTE_DIR}
tar -xzf /tmp/${DEPLOY_ARCHIVE}
rm /tmp/${DEPLOY_ARCHIVE}

echo "Installing backend dependencies..."
cd ${REMOTE_DIR}/backend
npm ci --production

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

REMOTE_SCRIPT

# ============================================
# Step 6: Run database migrations
# ============================================
if [ "$SKIP_MIGRATE" = true ]; then
    log_warn "Skipping migrations (--skip-migrate)"
else
    log_info "Running database migrations..."
    ${SSH_CMD} "cd ${REMOTE_DIR}/backend && npx prisma migrate deploy"
fi

# ============================================
# Step 7: Restart services
# ============================================
log_info "Restarting application..."

${SSH_CMD} << 'REMOTE_SCRIPT'
cd /var/www/replaceableParts/backend

# Check if PM2 process exists
if pm2 describe replaceableParts > /dev/null 2>&1; then
    echo "Reloading existing PM2 process..."
    pm2 reload replaceableParts
else
    echo "Starting new PM2 process..."
    pm2 start src/index.js --name replaceableParts
fi

# Save PM2 process list
pm2 save

# Reload nginx (in case of config changes)
sudo systemctl reload nginx

echo "Services restarted successfully"
REMOTE_SCRIPT

# ============================================
# Step 8: Health check
# ============================================
log_info "Running health check..."
sleep 3

# Check if backend is responding
if ${SSH_CMD} "curl -sf http://localhost:3001/api/health > /dev/null 2>&1 || curl -sf http://localhost:3001/ > /dev/null 2>&1"; then
    log_info "Backend health check: OK"
else
    log_warn "Backend health check: Could not verify (may need /api/health endpoint)"
fi

# Check PM2 status
${SSH_CMD} "pm2 status replaceableParts"

# ============================================
# Cleanup
# ============================================
rm -rf "${DEPLOY_TMP}"

# ============================================
# Done
# ============================================
echo ""
echo "============================================"
log_info "Deployment complete!"
echo "============================================"
echo ""
echo "Your application should be available at:"
echo "  https://${SSH_HOST}/"
echo ""
echo "Useful commands:"
echo "  View logs:     ${SSH_CMD} 'pm2 logs replaceableParts'"
echo "  Check status:  ${SSH_CMD} 'pm2 status'"
echo "  Restart:       ${SSH_CMD} 'pm2 restart replaceableParts'"
echo ""
