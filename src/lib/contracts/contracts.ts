/**
 * Elora Vault — Smart Contract Addresses & Configuration.
 *
 * Base Network:
 *   - Base Mainnet:  chainId 8453
 *   - Base Sepolia:  chainId 84532
 *
 * USDC:
 *   - Base Mainnet:  0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 *   - Base Sepolia:  0x036CbD53842c5426634e7929541eC2318f3dCF7e
 */

import ProtectedVaultABI from "./ProtectedVault.json";

export const CHAIN_CONFIG = {
  baseMainnet: {
    chainId: 8453,
    name: "Base",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const,
    vaultAddress: "0x0000000000000000000000000000000000000000" as `0x${string}`, // set after deploy
    explorerUrl: "https://basescan.org",
    rpcUrl: "https://mainnet.base.org",
  },
  baseSepolia: {
    chainId: 84532,
    name: "Base Sepolia",
    usdcAddress: "0x036CbD53842c6634e7929541eC2318f3dCF7e" as const,
    vaultAddress: "0x7876A2fa21BAfD40F7b61F49390d0FED556Db1fd" as `0x${string}`,
    explorerUrl: "https://sepolia.basescan.org",
    rpcUrl: "https://sepolia.base.org",
  },
} as const;

export const CURRENT_CHAIN = CHAIN_CONFIG.baseSepolia;

export const VAULT_ABI = ProtectedVaultABI;
