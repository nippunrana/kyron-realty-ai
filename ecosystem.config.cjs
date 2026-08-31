module.exports = {
  apps: [
    {
      name: "agora-realty-ai",
      script: "./.next/standalone/server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_file: ".env",
      max_memory_restart: "1G",
      restart_delay: 3000,
      watch: false,
    },
  ],
};
