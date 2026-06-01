import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Elora Vault - Behavioral Capital Infrastructure",
  description:
    "Elora Vault helps separate available capital from protected capital for intentional capital management.",
  openGraph: {
    title: "Elora Vault - Behavioral Capital Infrastructure",
    description:
      "Capital separation infrastructure for intentional capital management.",
    url: "https://elora-vault.vercel.app",
    siteName: "Elora Vault",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elora Vault - Behavioral Capital Infrastructure",
    description:
      "Capital separation infrastructure for intentional capital management.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafaf8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <meta name="base:app_id" content="6a1cdc07ac7b22973145d03b" />
      </head>
      <body className="min-h-full bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
