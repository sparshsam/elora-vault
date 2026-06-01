export type AccountMode = "external-wallet" | "base-account";

export type AccountStatus = "active" | "progressive" | "coming-later";

export type AccountStrategy = {
  mode: AccountMode;
  label: string;
  description: string;
  isAvailable: boolean;
  status: AccountStatus;
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
      "Progressive enhancement layer for Base-native wallets. Detection, badges, and visibility are live. Batching and sub-account vault routing are in research.",
    isAvailable: true,
    status: "progressive",
  },
];

export const activeAccountStrategy = accountStrategies.find(
  (strategy) => strategy.mode === "external-wallet",
) as AccountStrategy;

export const futureBaseAccountStrategy = accountStrategies.find(
  (strategy) => strategy.mode === "base-account",
) as AccountStrategy;
