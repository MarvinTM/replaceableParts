#!/bin/bash
#
# Deployment Configuration
# Copy this file to deploy.config.local.sh and fill in your values
# The deploy.sh script will source this file if it exists
#

# SSH connection details
export SSH_KEY="~/.ssh/your-key.pem"
export SSH_USER="ubuntu"
export SSH_HOST="your-server.example.com"

# Domain name (for nginx and SSL)
export DOMAIN_NAME="your-domain.com"

# Email for Let's Encrypt notifications
export ADMIN_EMAIL="admin@your-domain.com"

# Database credentials (used during server setup)
export DB_PASSWORD="your-secure-database-password"
