module.exports = {
  apps: [{
    name: 'nexus-backend',
    script: './packages/backend/dist/main.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      PLATFORM: 'mobile',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
  }],
};