import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Elora Vault — Protected Capital Vault",
  description:
    "Elora Vault is a self-custodied behavioral savings vault on Base. Connect your wallet to protect future capital. Losses become saved capital.",
  openGraph: {
    title: "Elora Vault — Protected Capital Vault",
    description:
      "Self-custodied behavioral savings vault on Base. Losses become protected future capital.",
    url: "https://elora-vault.vercel.app",
    siteName: "Elora Vault",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elora Vault — Protected Capital Vault",
    description:
      "Self-custodied behavioral savings vault on Base. Losses become protected future capital.",
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
      <body className="min-h-full bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
