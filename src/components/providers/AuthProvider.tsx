"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/projects/kyron-realty-ai/api/auth">
      {children}
    </SessionProvider>
  );
}
