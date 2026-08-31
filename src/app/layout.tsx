import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agora Realty AI | Next-Gen Real Estate Intelligence",
  description: "Join the private waitlist for Agora Realty AI. Instant predictive valuations, neighborhood yield forecasting, and algorithmic deal matching.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}

