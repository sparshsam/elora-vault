# Contract Verification — ProtectedVault on Base Sepolia

This guide covers verifying the `ProtectedVault.sol` smart contract on [BaseScan](https://sepolia.basescan.org/) for the Base Sepolia deployment.

## Deployed Contract

| Field | Value |
|-------|-------|
| **Contract** | `ProtectedVault` |
| **Network** | Base Sepolia (chain ID: `84532`) |
| **Address** | `0x7876A2fa21BAfD40F7b61F49390d0FED556Db1fd` |
| **USDC (Sepolia)** | `0x036CbD53842c6634e7929541eC2318f3dCF7e` |
| **Solidity** | `0.8.28` |
| **EVM Version** | `cancun` |
| **Optimizer** | enabled, 200 runs |
| **Constructor args** | `(address 0x036CbD53842c6634e7929541eC2318f3dCF7e)` |

## Prerequisites

- [Foundry](https://book.getfoundry.sh/) installed (`forge`, `cast`)
- A [BaseScan API key](https://basescan.org/myapikey) (free, requires account)

## Set the API Key

```bash
export BASESCAN_API_KEY="your-api-key-here"
```

The key is also referenced in `contracts/foundry.toml` under the `[etherscan]` section.

## Verify via Forge

From the `contracts/` directory:

```bash
cd contracts

forge verify-contract \
  0x7876A2fa21BAfD40F7b61F49390d0FED556Db1fd \
  src/ProtectedVault.sol:ProtectedVault \
  --chain 84532 \
  --verifier-url https://api-sepolia.basescan.org/api \
  --etherscan-api-key "$BASESCAN_API_KEY" \
  --constructor-args \
  $(cast abi-encode "constructor(address)" "0x036CbD53842c6634e7929541eC2318f3dCF7e")
```

## Verify via Etherscan V2 API (Multichain)

The Forge method above can fail due to BaseScan API rate limits or mismatched bytecode. As a fallback, use the **Etherscan V2 API** which is a unified endpoint supporting all EVM chains via `chainid` parameter:

### 1. Flatten the contract

```bash
cd contracts
forge flatten src/ProtectedVault.sol > flattened_ProtectedVault.sol
```

### 2. Verify via cURL

```bash
curl -X POST "https://api.etherscan.io/v2/api" \
  -d "chainid=84532" \
  -d "module=contract" \
  -d "action=verifysourcecode" \
  -d "contractaddresses=0x7876A2fa21BAfD40F7b61F49390d0FED556Db1fd" \
  -d "sourceCode=$(cat flattened_ProtectedVault.sol | jq -Rs .)" \
  -d "codeformat=solidity-single-file" \
  -d "contractname=ProtectedVault" \
  -d "compilerversion=v0.8.28+commit.7893614a" \
  -d "optimizationUsed=1" \
  -d "runs=200" \
  -d "evmversion=cancun" \
  -d "constructorArguements=000000000000000000000000036cbd53842c5426634e7929541ec2318f3dcf7e" \
  -d "apikey=$ETHERSCAN_API_KEY"
```

**Key details:**
- **Endpoint**: `https://api.etherscan.io/v2/api?chainid=84532` (one API key works across all supported chains)
- **Compiler version**: `v0.8.28+commit.7893614a` — use the exact version from `forge --version` output
- **Constructor arguments**: ABI-encoded address `0x036CbD53842c6634e7929541eC2318f3dCF7e` (no `0x` prefix, lowercase)
- **Note**: The `jq -Rs .` wraps the flattened source as a JSON string literal

### 3. Check verification status

```bash
curl "https://api.etherscan.io/v2/api?chainid=84532&module=contract&action=getsourcecode&address=0x7876A2fa21BAfD40F7b61F49390d0FED556Db1fd&apikey=$ETHERSCAN_API_KEY"
```

Look for `"SourceCode":"// SPDX"` in the response — if present, the contract is verified.

### 4. Clean up

```bash
rm flattened_ProtectedVault.sol
```

### What to expect

- **Success**: Forge prints the explorer URL (`https://sepolia.basescan.org/address/0x7876...`) with a `✅ Contract successfully verified` message.
- **Already verified**: Returns `Contract `0x7876...` already verified.`
- **Rate-limited**: Wait 10–20 seconds and retry. Free API keys have a low rate limit.
- **Mismatched bytecode**: Ensure the local compiler settings (`solc`, `optimizer`, `evm_version`) match exactly. These are already configured in `foundry.toml`.

## Alternative: Manual via BaseScan UI

1. Go to [sepolia.basescan.org/verifyContract](https://sepolia.basescan.org/verifyContract)
2. Fill in:
   - **Contract Address**: `0x7876A2fa21BAfD40F7b61F49390d0FED556Db1fd`
   - **Compiler Type**: `Solidity (Single file)`
   - **Compiler Version**: `0.8.28`
   - **EVM Version**: `cancun`
   - **Optimization**: `Yes` / `200`
3. Paste the full source from `contracts/src/ProtectedVault.sol`
4. **Constructor Arguments**: ABI-encode `(address 0x036CbD53842c6634e7929541eC2318f3dCF7e)`
5. Submit and wait for confirmation

## Verify on Vercel

After verification, consider setting `BASESCAN_API_KEY` as a Vercel environment variable so CI/CD pipelines or future forge scripts can include `--verify` automatically:

```bash
echo "your-api-key-here" | vercel env add BASESCAN_API_KEY production preview development
```

## Post-Verification Checks

- [ ] BaseScan shows the source code with the MIT license label
- [ ] The `Read Contract` and `Write Contract` tabs are active
- [ ] BaseScan link from the frontend at `/vault` resolves correctly
- [ ] USDC address (`0x036CbD53842c6634e7929541eC2318f3dCF7e`) is shown as the constructor arg
