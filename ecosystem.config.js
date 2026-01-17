module.exports = {
  apps: [
    {
      name: 'oil-bot',
      script: 'dist/bot/index.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'oil-worker',
      script: 'dist/jobs/workers.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'oil-scheduler',
      script: 'dist/jobs/schedulers.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
  env_file: '.env',
};
