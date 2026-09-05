"use client";

import { SessionProvider } from "next-auth/react";
import { AUTH_BASE_PATH } from "@/lib/base-path";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath={AUTH_BASE_PATH}>
      {children}
    </SessionProvider>
  );
}
