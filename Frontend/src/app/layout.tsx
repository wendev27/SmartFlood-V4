import type { Metadata } from "next";
import { CampaignQrTokenProvider } from "@/components/providers/CampaignQrTokenProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartFlood Dashboard",
  description: "Barangay flood monitoring and disaster response dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><QueryProvider><CampaignQrTokenProvider>{children}</CampaignQrTokenProvider></QueryProvider></body>
    </html>
  );
}
