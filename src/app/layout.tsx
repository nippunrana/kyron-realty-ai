import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kyron Realty AI | 24/7 Autonomous Voice AI Leasing & Sales Associate",
  description: "Never lose a high-value lead to voicemail again. Sub-300ms real-time voice, dynamic concession negotiation, and instant tour booking powered by Agora SD-RTN.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

