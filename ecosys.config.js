module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'python3',
      args: 'backend/main.py',
      cwd: process.cwd(),
      interpreter: 'none'
    },
    {
      name: 'frontend',
      script: 'npx',
      args: 'vite frontend',
      cwd: process.cwd(),
      interpreter: 'none'
    }
  ]
};