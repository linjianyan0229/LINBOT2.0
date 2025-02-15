module.exports = {
  apps: [{
    name: 'lin-bot',
    script: 'index.js',
    watch: false,
    ignore_watch: [
      'node_modules',
      'plugins/**/config.json',
      'plugins/**/fortune_records.json',
      'plugins/**/history',
      'plugins/**/prompt_config.json',
      'plugins/**/model_config.json'
    ],
    watch_options: {
      followSymlinks: false,
      usePolling: true,
      interval: 1000
    },
    autorestart: true,
    max_restarts: 10,
    restart_delay: 4000,
    stop_exit_codes: [1],
    restart_exit_codes: [0]
  }]
} 