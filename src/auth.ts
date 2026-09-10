import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { verifyPassword } from "@/lib/auth-passwords";
import { eq } from "drizzle-orm";
import { getGoogleOAuthConfig } from "@/lib/google-oauth";
import {
  CALENDAR_SCOPES,
  ensureKyronCalendar,
  persistGoogleTokens,
} from "@/lib/google-calendar";
import { AUTH_BASE_PATH } from "@/lib/base-path";

const googleOAuth = getGoogleOAuthConfig();

export const { handlers, auth } = NextAuth({
  basePath: AUTH_BASE_PATH,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  trustHost: true,
  // No fallback on purpose: a missing secret must fail at startup, never sign JWTs with a public string.
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(googleOAuth.isConfigured
      ? [
          Google({
            clientId: googleOAuth.clientId,
            clientSecret: googleOAuth.clientSecret,
            allowDangerousEmailAccountLinking: true,
            authorization: {
              params: {
                scope: ["openid", "email", "profile", ...CALENDAR_SCOPES].join(" "),
                // Without offline access Google issues no refresh token, and the owner's
                // calendar becomes unreachable an hour after they close the tab.
                access_type: "offline",
              },
            },
          }),
        ]
      : []),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        if (typeof credentials.email !== "string" || typeof credentials.password !== "string") {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            return null;
          }

          // Reject accounts without a set password (e.g. OAuth-only registrations)
          if (!user.password) {
            return null;
          }

          // Verify password using cryptographic scrypt comparison
          const isValid = verifyPassword(password, user.password);
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name ?? email.split("@")[0],
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error("Credentials authorization error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
      }
      return session;
    },
  },
  events: {
    /**
     * Attach the owner's Google Calendar. Runs after the adapter has written the account
     * row, and only for Google sign-ins — credentials users fall straight through and
     * stay calendar-less by design.
     *
     * Tokens are persisted to `accounts` and never placed on the JWT, which is a cookie.
     * Nothing in here may fail a login: a Google or database hiccup means the owner has
     * no calendar this session, not that they cannot sign in.
     */
    async signIn({ account }) {
      if (account?.provider !== "google") return;

      try {
        await persistGoogleTokens(account);
        if (account.access_token) {
          await ensureKyronCalendar(account.providerAccountId, account.access_token);
        }
      } catch (error) {
        console.error("Google Calendar link failed during sign-in:", error);
      }
    },
  },
});
