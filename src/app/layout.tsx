import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agora Realty AI - Intelligent Real Estate Platform",
  description: "Next-generation real estate platform powered by AI valuations, predictive market trends, and automated intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
