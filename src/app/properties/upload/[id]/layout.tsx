import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Attach Property Photos | Kyron Realty AI",
  description: "Secure mobile photo upload uplink for Kyron Realty AI property onboarding studio.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function MobileUploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-slate-950">{children}</div>;
}
