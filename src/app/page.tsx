"use client";

import Link from "next/link";
import { Shield, TrendingUp, PiggyBank, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shield,
    title: "Bankroll Vault",
    description:
      "Your deposits are locked in the vault. Every bet is backed by real capital — no overextension.",
  },
  {
    icon: TrendingUp,
    title: "Self-Betting Engine",
    description:
      "Place bets against your own discipline. The vault ensures you never wager more than you can afford.",
  },
  {
    icon: PiggyBank,
    title: "Savings Mechanic",
    description:
      "Losses aren't lost — they're absorbed. Each one grows your vault and reinforces your discipline.",
  },
  {
    icon: BarChart3,
    title: "Liability Protection",
    description:
      "Real-time risk metrics. Know exactly how much exposure each bet carries before you commit.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">E</span>
            </div>
            <span className="text-lg font-semibold text-white">Elora</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-indigo-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="mx-auto max-w-4xl text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 mb-8">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-medium text-indigo-300">
              v0.1 — Personal Bankroll Vault
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Discipline,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              stored.
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Elora is a personal bankroll vault that turns betting discipline
            into a savings system. Every bet is backed, every loss is saved,
            every win is earned.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-base font-medium transition-all shadow-lg shadow-indigo-600/20">
                Start your vault
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                variant="outline"
                className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5 px-8 py-3 rounded-xl text-base font-medium transition-all"
              >
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">
              Built for discipline
            </h2>
            <p className="mt-3 text-gray-400 max-w-xl mx-auto">
              Every feature is designed to protect your bankroll and build
              sustainable habits.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-300 group"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/20 group-hover:bg-indigo-600/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">
              How the vault works
            </h2>
            <p className="mt-3 text-gray-400 max-w-xl mx-auto">
              Simple mechanics. Powerful results.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/10 border border-indigo-500/20">
                <span className="text-2xl font-bold text-indigo-400">1</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Deposit
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Add funds to your vault. Every dollar becomes part of your
                bankroll.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/10 border border-indigo-500/20">
                <span className="text-2xl font-bold text-indigo-400">2</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Bet</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Place bets backed by your vault. The liability engine ensures
                you never overextend.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/10 border border-indigo-500/20">
                <span className="text-2xl font-bold text-indigo-400">3</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Save or earn
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Win and your profit grows. Lose and the stake is absorbed into
                your savings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="glass rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to build discipline?
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Start your Elora vault today. Free. No casino. Just discipline,
              stored.
            </p>
            <Link href="/auth/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-base font-medium transition-all shadow-lg shadow-indigo-600/20">
                Create your vault
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-gray-500">
            Elora v0.1 — Discipline, stored.
          </p>
        </div>
      </footer>
    </div>
  );
}
