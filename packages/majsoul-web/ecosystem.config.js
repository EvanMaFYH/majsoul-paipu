module.exports = {
  apps: [
    {
      name: 'majsoul-web',
      cwd: './',
      script: 'npm',
      interpreter: '',
      args: 'run launch',
      env: {
        NODE_ENV: 'development',
      },
      env_dev: {
        NODE_ENV: 'production',
        NODE_APP_INSTANCE: 'dev',
      },
      env_prod: {
        NODE_ENV: 'production',
        NODE_APP_INSTANCE: 'prod',
      },
    },
  ],
}
