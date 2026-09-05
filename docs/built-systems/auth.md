# Kyron Realty AI — Authentication & Security System

This document outlines the authentication architecture, NextAuth v5 configuration, credentials verification, and OAuth fallback mechanisms for Kyron Realty AI.

---

## 1. Overview & Architecture

- **Library**: NextAuth.js v5 (beta) with `@auth/drizzle-adapter`.
- **Primary Auth Config**: `src/auth.ts`.
- **Database Tables**: Managed in `src/db/schema.ts` (`users`, `accounts`, `sessions`, `verificationTokens`).
- **Session Strategy**: `jwt` (JSON Web Token) with a 30-day `maxAge`.
- **Subpath BasePath**: Configured to `/projects/kyron-realty-ai/api/auth`.

---

## 2. Authentication Methods

### A. Credentials (Email & Password)
- **Hashing**: Cryptographic `scrypt` key derivation with random salt (`src/lib/auth-passwords.ts`).
- **Registration Endpoint**: `POST /projects/kyron-realty-ai/api/auth/register`
  - Validates email format, password length (8-128 chars), and name.
  - Checks for existing user in PostgreSQL.
  - Stores user record with hashed password.
- **Authorization Flow**: Look up user by lowercase trimmed email in `src/db/schema.ts` -> verify hash with `verifyPassword()` -> return user session object.

### B. Google OAuth
- **Provider**: `next-auth/providers/google`.
- **Environment Keys**: `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env`.
- **Graceful Fallback**: If Google keys are omitted or blank, Google OAuth is disabled gracefully. The frontend checks `GET /projects/kyron-realty-ai/api/auth/status` and displays a helpful configuration notice rather than crashing.

---

## 3. Key Endpoints & Routes

| Route | Method | Purpose |
| :--- | :--- | :--- |
| `/api/auth/[...nextauth]` | `GET`, `POST` | NextAuth core handler (sign-in, callback, session, csrf). |
| `/api/auth/register` | `POST` | Creates a new user account with scrypt-hashed credentials. |
| `/api/auth/status` | `GET` | Returns status flags (e.g. `{ googleConfigured: true/false }`). |
| `/login` | `GET` | Dual-pane split authentication interface (Sign In & Sign Up toggle). |

---

## 4. Protected Session Usage

### Client Components
Use standard NextAuth `signIn` / `signOut` / `useSession`:
```tsx
import { signIn, signOut, useSession } from "next-auth/react";
```

### Server Components & Route Handlers
```ts
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // User is authenticated: session.user.id, session.user.email
}
```
