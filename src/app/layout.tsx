import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Elora Vault — Personal Savings Vault",
  description:
    "Elora Vault is a personal savings vault inspired by betting mechanics, where losses become stored capital and users wager against a virtual house.",
  openGraph: {
    title: "Elora Vault — Personal Savings Vault",
    description:
      "Turn losses into saved capital. A personal savings vault inspired by betting mechanics.",
    url: "https://elora-bet-api.vercel.app",
    siteName: "Elora Vault",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elora Vault — Personal Savings Vault",
    description:
      "Turn losses into saved capital. A personal savings vault inspired by betting mechanics.",
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
