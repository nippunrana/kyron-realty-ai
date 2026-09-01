# Kyron Realty AI — Architecture, Subpath & Hosting System

This document outlines the Next.js App Router architecture, basePath prefix rules, standalone PM2 cluster setup, and Nginx reverse proxy configuration.

---

## 1. Subpath & BasePath Rules (`/projects/kyron-realty-ai`)

The application is deployed under the subpath prefix **`/projects/kyron-realty-ai`**.

### Configuration
- In `next.config.ts`:
  ```ts
  const nextConfig: NextConfig = {
    output: "standalone",
    basePath: "/projects/kyron-realty-ai",
    reactStrictMode: true,
  };
  ```

### Developer Rules
1. **Client-side Fetch Calls**:
   Always prefix routes with `${BASE_PATH}`:
   ```ts
   const BASE_PATH = "/projects/kyron-realty-ai";
   await fetch(`${BASE_PATH}/api/auth/register`, { ... });
   ```

2. **Static Images & Next.js `<Image />`**:
   To avoid Next.js image optimizer `400 Bad Request` path mismatches under `basePath`:
   ```tsx
   import Image from "next/image";
   const BASE_PATH = "/projects/kyron-realty-ai";

   <Image
     src={`${BASE_PATH}/images/luxury-architecture-twilight.jpg`}
     alt="Description"
     fill
     priority
     unoptimized
   />
   ```

3. **NextAuth Callbacks**:
   Always specify full callback URLs including `${BASE_PATH}/` (e.g. `signIn("google", { callbackUrl: "/projects/kyron-realty-ai/" })`).

---

## 2. Server & Process Management (PM2)

- **Config**: `ecosystem.config.cjs`.
- **Mode**: PM2 Cluster mode (`instances: "max"`), executing `.next/standalone/server.js`.
- **Port**: Listens on internal port `3000`.
- **Reloading**:
  ```bash
  pm2 reload ecosystem.config.cjs --update-env
  ```

---

## 3. Reverse Proxy & Nginx Caching

- **Nginx Config**: Proxies `https://egnitech.com/projects/kyron-realty-ai` -> `http://127.0.0.1:3000`.
- **FastCGI Cache Location**: `/var/cache/nginx/egnitech.com`.
- **Purging Cache**:
  ```bash
  rm -rf /var/cache/nginx/egnitech.com/* && systemctl reload nginx
  ```
