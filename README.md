# Kyron Realty AI

Next-generation real estate intelligence platform powered by Next.js 16, PostgreSQL 17, Drizzle ORM, real-time voice agents, and automated AI valuations.


---

## 🛠️ Tech Stack & Architecture

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Database**: [PostgreSQL 17](https://www.postgresql.org/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) + `postgres.js`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Process Management**: [PM2](https://pm2.keymetrics.io/) (`ecosystem.config.cjs` standalone cluster)
- **Reverse Proxy**: [Nginx](https://nginx.org/)
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`) for automated push-to-deploy

---

## 🚀 Getting Started

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nippunrana/agora-realty-ai.git
   cd kyron-realty-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL 17 credentials
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔄 Automated Push-to-Deploy CI/CD Setup

When you push changes from your local machine to `main` (`git push origin main`), GitHub Actions automatically builds the project and deploys it to your VPS with zero downtime.

### Required GitHub Secrets

In your GitHub repository, navigate to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**, and add:

| Secret Name | Description | Example |
| :--- | :--- | :--- |
| `VPS_HOST` | VPS IP address or hostname | `123.45.67.89` |
| `VPS_USERNAME` | SSH username on the VPS | `root` or `ubuntu` |
| `VPS_SSH_KEY` | Private SSH key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_PORT` | SSH Port (optional, defaults to 22) | `22` |

---

## 📦 Database Commands

```bash
# Generate Drizzle migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio in browser
npm run db:studio
```

---

## ⚙️ VPS Production Management (PM2 & Nginx)

- **Manual Deploy Script**:
  ```bash
  ./scripts/deploy.sh
  ```
- **PM2 Commands**:
  ```bash
  pm2 status
  pm2 logs kyron-realty-ai
  pm2 reload ecosystem.config.cjs
  ```
- **Nginx Setup**:
  See `nginx.conf.example` for the sample reverse proxy block.
