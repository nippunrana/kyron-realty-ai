const path = require("path");

// Load .env in Node 20+ so environment variables are passed to PM2 cluster workers
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.resolve(__dirname, ".env"));
  } catch {
    // Graceful fallback if .env is not present
  }
}

module.exports = {
  apps: [
    {
      name: "kyron-realty-ai",
      script: "./.next/standalone/server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        ...process.env,
      },
      max_memory_restart: "1G",
      restart_delay: 3000,
      watch: false,
    },
  ],
};

