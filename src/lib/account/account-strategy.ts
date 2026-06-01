export type AccountMode = "external-wallet" | "base-account";

export type AccountStrategy = {
  mode: AccountMode;
  label: string;
  description: string;
  isAvailable: boolean;
  status: "active" | "coming-later";
};

export const accountStrategies: AccountStrategy[] = [
  {
    mode: "external-wallet",
    label: "Connected Wallet",
    description:
      "Current account mode. Use an external wallet to deposit, protect, release, and withdraw capital.",
    isAvailable: true,
    status: "active",
  },
  {
    mode: "base-account",
    label: "Base Account",
    description:
      "Future account infrastructure for calmer self-custody, simpler protection flows, and quieter onchain ownership.",
    isAvailable: false,
    status: "coming-later",
  },
];

export const activeAccountStrategy = accountStrategies.find(
  (strategy) => strategy.mode === "external-wallet",
) as AccountStrategy;

export const futureBaseAccountStrategy = accountStrategies.find(
  (strategy) => strategy.mode === "base-account",
) as AccountStrategy;
