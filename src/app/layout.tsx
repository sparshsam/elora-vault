import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Elora — Personal Savings Vault",
  description:
    "A personal savings vault inspired by betting mechanics. Wager against a virtual house, turn losses into saved capital, and track your discipline over time.",
  openGraph: {
    title: "Elora — Personal Savings Vault",
    description:
      "Every loss becomes saved capital. A personal savings vault inspired by betting mechanics.",
    url: "https://elora-bet-api.vercel.app",
    siteName: "Elora",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elora — Personal Savings Vault",
    description:
      "Every loss becomes saved capital. Wager against a virtual house, turn losses into savings.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
