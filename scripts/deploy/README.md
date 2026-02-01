# Deployment Scripts

Scripts to deploy replaceableParts to an AWS EC2 instance.

## Prerequisites

- AWS EC2 instance running Ubuntu 22.04 or later
- SSH access with a .pem key file
- Domain name pointing to your server's IP address

## Quick Start

### 1. Configure your deployment settings

```bash
cp deploy.config.sh deploy.config.local.sh
# Edit deploy.config.local.sh with your values
```

### 2. First-time server setup

Copy and run the setup script on your server:

```bash
# Copy setup script to server
scp -i ~/.ssh/your-key.pem setup-server.sh ubuntu@your-server:/tmp/

# SSH into server and run setup
ssh -i ~/.ssh/your-key.pem ubuntu@your-server
chmod +x /tmp/setup-server.sh
sudo /tmp/setup-server.sh
```

### 3. First deployment

From your local machine, run the first deploy (this copies the app files to the server):

```bash
./deploy.sh --skip-migrate
```

Note: Use `--skip-migrate` on the first run since the database isn't configured yet.

### 4. Configure environment variables

On the server:

```bash
cp /var/www/replaceableParts/.env.production /var/www/replaceableParts/backend/.env
nano /var/www/replaceableParts/backend/.env
# Edit with your actual values (JWT_SECRET, etc.)
```

### 5. Run database migrations

From your local machine:

```bash
./deploy.sh --skip-build
```

Or on the server:

```bash
cd /var/www/replaceableParts/backend
npx prisma migrate deploy
pm2 restart replaceableParts
```

### 6. Configure SSL certificate

On the server, run:

```bash
sudo certbot --nginx -d your-domain.com
```

### 7. Future deployments

From your local machine:

```bash
./deploy.sh
```

## Deploy Script Options

```
./deploy.sh [OPTIONS]

Options:
  --skip-build    Skip the local build step (use existing dist/)
  --skip-migrate  Skip database migrations
  --no-backup     Skip database backup before migration
  --help          Show help message
```

## File Structure

```
scripts/deploy/
├── deploy.sh              # Main deployment script (run locally)
├── deploy.config.sh       # Configuration template
├── deploy.config.local.sh # Your local config (git-ignored)
├── setup-server.sh        # First-time server setup (run on server)
├── ecosystem.config.cjs   # PM2 configuration
├── nginx-ssl.conf.template# Reference nginx config
└── README.md              # This file
```

## Useful Commands

### View application logs
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@your-server 'pm2 logs replaceableParts'
```

### Restart application
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@your-server 'pm2 restart replaceableParts'
```

### Check application status
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@your-server 'pm2 status'
```

### View nginx logs
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@your-server 'sudo tail -f /var/log/nginx/error.log'
```

### Renew SSL certificate (usually automatic via cron)
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@your-server 'sudo certbot renew'
```
