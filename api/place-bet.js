import { ethers } from "ethers";
import contractABI from "../../abi/elora.json";

const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";

const provider = new ethers.providers.JsonRpcProvider("https://rpc-mumbai.maticvigil.com/");
const signer = new ethers.Wallet("YOUR_PRIVATE_KEY_HERE", provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { matchId, matchName, betType, selection, line, odds, stake } = req.body;

  console.log("Payload Received:", {
    matchId,
    matchName,
    betType,
    selection,
    line,
    odds,
    stake,
  });

  const amount = Math.round(parseFloat(stake) * 1_000_000); // for USDC-style 6 decimal logic
  const oddsInt = Math.round(parseFloat(odds) * 100);       // e.g. 1.85 → 185

  if (
    !matchId || !matchName || !betType || !selection ||
    isNaN(amount) || isNaN(oddsInt)
  ) {
    return res.status(400).json({ error: "Invalid payload inputs" });
  }

  try {
    const tx = await contract.placeBet(
      amount,
      matchId,
      matchName,
      betType,
      selection,
      oddsInt
    );

    console.log("Tx sent:", tx.hash);

    const receipt = await tx.wait();

    return res.status(200).json({
      message: "Bet placed successfully",
      txHash: receipt.transactionHash,
    });

  } catch (err) {
    console.error("Contract call failed:", err);
    return res.status(500).json({ error: "Contract call failed", details: err.message });
  }
}
