import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Elora — Discipline, stored.",
  description:
    "A personal bankroll vault and savings system. Track bets, protect your bankroll, and build discipline.",
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
