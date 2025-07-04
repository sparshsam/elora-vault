import { ethers } from 'ethers';
import eloraAbi from '../eloraAbi.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const {
      matchId,
      matchName,
      betType,
      selection,
      odds,
      amount
    } = req.body;

    const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, eloraAbi, wallet);

    const scaledAmount = ethers.parseUnits(amount.toString(), 6); // USDC has 6 decimals
    const scaledOdds = Math.floor(odds * 100);

    const tx = await contract.placeBet(
      scaledAmount,
      matchId,
      matchName,
      betType,
      selection,
      scaledOdds
    );

    await tx.wait();

    res.status(200).json({ txHash: tx.hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Bet logging failed', details: error.message });
  }
}