import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VC Scout — AI-Powered Deal Sourcing",
  description:
    "Precision AI scout for venture capital firms. Discover, enrich, and evaluate startups aligned with your investment thesis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 md:pl-60">
              <Header />
              <main className="p-4 md:p-6">{children}</main>
            </div>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
