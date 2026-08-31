# VPS Server & Database Infrastructure Configuration

This document outlines the server environment, network rules, PostgreSQL 17 isolation, PM2 configuration, and CI/CD workflow for **Agora Realty AI**.

---

## 🖥️ Server Specifications

- **Operating System**: Ubuntu 25.10 (Questing Quokka)
- **Public IPv4**: `72.60.26.200`
- **Node.js**: `v20.19.4` (LTS)
- **npm**: `9.2.0`
- **PostgreSQL**: `17.10`
- **Nginx**: `1.28.0`
- **PM2**: `6.0.14`
- **Project Directory**: `/var/www/egnitech.com/html/wp-content/projects/agora-realty-ai`

---

## 🗄️ PostgreSQL 17 Configuration

### Database & User Details
- **Database**: `agora_realty_ai`
- **User**: `agora_realty_ai_user`
- **Port**: `5432`

### Security & Multi-Tenant Isolation
The server hosts multiple applications. PostgreSQL is configured with strict per-database access control in `/etc/postgresql/17/main/pg_hba.conf`:

```text
# Allow remote access exclusively for agora_realty_ai
host    agora_realty_ai   agora_realty_ai_user   all             scram-sha-256
```

> **Isolation Guarantee**: Only `agora_realty_ai_user` can authenticate to `agora_realty_ai` remotely. All other databases on this server (`dosiqai_app`, `gullyvision`, `truinterview`, `n8n`, etc.) remain 100% locked to `127.0.0.1` (localhost only).

### Connection Strings Templates

> [!WARNING]
> Never commit your actual database password to public git repositories. Place passwords exclusively in your untracked `.env` file.

#### 1. On Local Development Machine (`.env`)
```env
DATABASE_URL="postgres://agora_realty_ai_user:<YOUR_DB_PASSWORD>@72.60.26.200:5432/agora_realty_ai"
NODE_ENV="development"
PORT=3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### 2. On VPS Production Server (`.env`)
```env
DATABASE_URL="postgres://agora_realty_ai_user:<YOUR_DB_PASSWORD>@localhost:5432/agora_realty_ai"
NODE_ENV="production"
PORT=3000
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

---

## ⚙️ PM2 Process Management

Next.js is compiled with `output: 'standalone'` and managed by PM2 via `ecosystem.config.cjs`.

### Useful PM2 Commands:
```bash
# View process status
pm2 status

# Monitor logs
pm2 logs agora-realty-ai

# Reload application with zero downtime
pm2 reload ecosystem.config.cjs --update-env

# Restart / Stop
pm2 restart agora-realty-ai
pm2 stop agora-realty-ai
```

---

## 🌐 Nginx Reverse Proxy Setup

Create or update `/etc/nginx/sites-available/your-domain.com`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Static assets cache
    location /_next/static {
        alias /var/www/egnitech.com/html/wp-content/projects/agora-realty-ai/.next/static;
        expires 365d;
        access_log off;
    }

    # Public static files
    location /public {
        alias /var/www/egnitech.com/html/wp-content/projects/agora-realty-ai/public;
        expires 30d;
        access_log off;
    }

    # Reverse proxy to PM2 Next.js standalone server
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🚀 GitHub Actions Push-to-Deploy

When code is pushed to `main`, GitHub Actions (`.github/workflows/deploy.yml`) builds the project and runs `scripts/deploy.sh` on this VPS via SSH.

### Required GitHub Repository Secrets
Navigate to **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**:

- **`VPS_HOST`**: `72.60.26.200`
- **`VPS_USERNAME`**: `root` (or your deployment SSH user)
- **`VPS_SSH_KEY`**: Your private SSH key
- **`VPS_PORT`**: `22`
