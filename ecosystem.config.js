module.exports = {
  apps: [
    {
      name: 'oil-bot',
      script: 'dist/src/bot/index.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'oil-worker',
      script: 'dist/src/jobs/workers.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'oil-scheduler',
      script: 'dist/src/jobs/schedulers.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
  env_file: '.env',
};
