const { ethers } = require("ethers");
const contractABI = require("./elora.json");

const CONTRACT_ADDRESS = "0xC866f7F09534D8632f5F8075175b69427F6e25c4";
const PRIVATE_KEY = "e599a5a823c3b0bcbfe8f93ca7f62b3254ef7a8d7fb7be1e2361cdf5207c2f11";

const provider = new ethers.providers.JsonRpcProvider("https://polygon-mumbai-bor.publicnode.com");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { matchId, matchName, betType, selection, odds, stake } = req.body;

  console.log("Payload Received:", {
    matchId,
    matchName,
    betType,
    selection,
    odds,
    stake,
  });

  const amount = Math.round(parseFloat(stake) * 1_000_000); // USDC-style format
  const oddsInt = Math.round(parseFloat(odds) * 100); // Convert 1.85 → 185

  if (
    !matchId || !matchName || !betType || !selection ||
    isNaN(amount) || isNaN(oddsInt)
  ) {
    return res.status(400).json({ error: "Invalid payload inputs" });
  }

  try {
    const tx = await contract.placeBet(
      wallet.address,
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
};