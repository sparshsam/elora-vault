import { create } from "zustand";
import type { Bet, Wallet } from "@prisma/client";

interface WalletState {
  balance: number;
  houseBalance: number;
  withdrawableProfit: number;
  totalSavedFromLosses: number;
  openBets: Bet[];
  isLoading: boolean;

  setWallet: (wallet: Wallet) => void;
  deposit: (amount: number) => void;
  placeBet: (stake: number) => void;
  settleBetWin: (stake: number, profit: number) => void;
  settleBetLoss: (stake: number) => void;
  settleBetPush: () => void;
  syncFromServer: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  houseBalance: 0,
  withdrawableProfit: 0,
  totalSavedFromLosses: 0,
  openBets: [],
  isLoading: false,

  setWallet: (wallet: Wallet) =>
    set({
      balance: wallet.totalBalance,
      houseBalance: wallet.houseBalance,
      withdrawableProfit: wallet.withdrawableProfit,
      totalSavedFromLosses: wallet.totalSavedFromLosses,
    }),

  deposit: (amount: number) =>
    set((state) => ({
      balance: state.balance + amount,
      houseBalance: state.houseBalance + amount,
    })),

  placeBet: (stake: number) =>
    set((state) => ({
      balance: state.balance - stake,
      houseBalance: state.houseBalance,
      withdrawableProfit: state.withdrawableProfit - stake,
    })),

  settleBetWin: (stake: number, profit: number) =>
    set((state) => ({
      houseBalance: state.houseBalance - profit,
      withdrawableProfit: state.withdrawableProfit + stake + profit,
    })),

  settleBetLoss: (stake: number) =>
    set((state) => ({
      houseBalance: state.houseBalance + stake,
      withdrawableProfit: state.withdrawableProfit,
      totalSavedFromLosses: state.totalSavedFromLosses + stake,
    })),

  settleBetPush: () => set((state) => ({
    withdrawableProfit: state.withdrawableProfit,
  })),

  syncFromServer: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch("/api/wallet");
      if (res.ok) {
        const data = await res.json();
        set({
          balance: data.totalBalance ?? 0,
          houseBalance: data.houseBalance ?? 0,
          withdrawableProfit: data.withdrawableProfit ?? 0,
          totalSavedFromLosses: data.totalSavedFromLosses ?? 0,
        });
      }
    } catch {
      // silently fail — user may not be authenticated
    } finally {
      set({ isLoading: false });
    }
  },
}));
