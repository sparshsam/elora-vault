import { create } from "zustand";

interface WalletData {
  user_balance: number;
  savings_vault: number;
  withdrawable_winnings: number;
  virtual_house_balance: number;
  total_deposited: number;
  total_wagered: number;
  total_saved_from_losses: number;
  total_profit_won: number;
}

interface WalletState {
  user_balance: number;
  savings_vault: number;
  withdrawable_winnings: number;
  virtual_house_balance: number;
  total_deposited: number;
  total_wagered: number;
  total_saved_from_losses: number;
  total_profit_won: number;
  isLoading: boolean;

  setWallet: (wallet: WalletData) => void;
  syncFromServer: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  user_balance: 0,
  savings_vault: 0,
  withdrawable_winnings: 0,
  virtual_house_balance: 0,
  total_deposited: 0,
  total_wagered: 0,
  total_saved_from_losses: 0,
  total_profit_won: 0,
  isLoading: false,

  setWallet: (wallet: WalletData) =>
    set({
      user_balance: wallet.user_balance,
      savings_vault: wallet.savings_vault,
      withdrawable_winnings: wallet.withdrawable_winnings,
      virtual_house_balance: wallet.virtual_house_balance,
      total_deposited: wallet.total_deposited,
      total_wagered: wallet.total_wagered,
      total_saved_from_losses: wallet.total_saved_from_losses,
      total_profit_won: wallet.total_profit_won,
    }),

  syncFromServer: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch("/api/wallet");
      if (res.ok) {
        const data = await res.json();
        set({
          user_balance: data.user_balance ?? 0,
          savings_vault: data.savings_vault ?? 0,
          withdrawable_winnings: data.withdrawable_winnings ?? 0,
          virtual_house_balance: data.virtual_house_balance ?? 0,
          total_deposited: data.total_deposited ?? 0,
          total_wagered: data.total_wagered ?? 0,
          total_saved_from_losses: data.total_saved_from_losses ?? 0,
          total_profit_won: data.total_profit_won ?? 0,
        });
      }
    } catch {
      // silently fail — user may not be authenticated
    } finally {
      set({ isLoading: false });
    }
  },
}));
