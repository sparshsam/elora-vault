// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {ProtectedVault} from "../src/ProtectedVault.sol";

/**
 * @title DeployProtectedVault
 * @notice Deployment script for ProtectedVault on Base mainnet or Base Sepolia.
 *
 * Usage:
 *   # Base mainnet
 *   forge script script/DeployProtectedVault.s.sol \
 *     --rpc-url base_mainnet \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast \
 *     --verify
 *
 *   # Base Sepolia
 *   forge script script/DeployProtectedVault.s.sol \
 *     --rpc-url base_sepolia \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast \
 *     --verify
 *
 *   # Anvil (local test)
 *   forge script script/DeployProtectedVault.s.sol \
 *     --rpc-url http://localhost:8545 \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast
 */
contract DeployProtectedVault is Script {
    /// @notice USDC address on Base mainnet
    address constant BASE_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    /// @notice USDC address on Base Sepolia
    address constant BASE_SEPOLIA_USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external {
        // Determine which chain we're on
        uint256 chainId = block.chainid;
        address usdcAddress;

        if (chainId == 8453) {
            // Base mainnet
            usdcAddress = BASE_USDC;
            console2.log("Deploying to Base mainnet (chain ID: 8453)");
        } else if (chainId == 84532) {
            // Base Sepolia
            usdcAddress = BASE_SEPOLIA_USDC;
            console2.log("Deploying to Base Sepolia (chain ID: 84532)");
        } else {
            // Local / test — deploy mock or use a passed address
            console2.log("Deploying to unknown chain (chain ID: %s)", chainId);
            console2.log("USDC address must be correct for this chain.");
            // For local testing, just use a placeholder. The deployer
            // should set the correct USDC address before interacting.
            usdcAddress = BASE_USDC;
        }

        console2.log("Using USDC address:", usdcAddress);

        vm.startBroadcast();

        ProtectedVault vault = new ProtectedVault(usdcAddress);

        vm.stopBroadcast();

        console2.log("ProtectedVault deployed at:", address(vault));
    }
}
