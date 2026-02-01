// PM2 Ecosystem Configuration
// Copy this to /var/www/replaceableParts/ecosystem.config.cjs on the server
// Then run: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: 'replaceableParts',
      cwd: '/var/www/replaceableParts/backend',
      script: 'src/index.js',
      instances: 1, // Use 'max' for cluster mode on larger instances
      exec_mode: 'fork', // Use 'cluster' for multi-core
      autorestart: true,
      watch: false,
      max_memory_restart: '500M', // Adjust based on your instance size
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Logging
      error_file: '/var/www/replaceableParts/logs/error.log',
      out_file: '/var/www/replaceableParts/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
