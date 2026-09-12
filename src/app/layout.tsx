import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { FloatingSalesAgent } from "@/components/sales/FloatingSalesAgent";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kyron Realty AI | List a property by talking. It answers its own calls.",
  description: "Describe a property out loud and it is live in about two minutes. From then on every buyer who calls gets a straight answer, an honest price, a viewing in your calendar — and a real person on the line the moment they ask.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          {children}
          <FloatingSalesAgent />
        </AuthProvider>
      </body>
    </html>
  );
}

