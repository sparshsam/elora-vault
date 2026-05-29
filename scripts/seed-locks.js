const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DIRECT_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    // Find demo user
    const userRes = await client.query('SELECT id, email FROM "User" WHERE email = $1', ['demo@elora.app']);
    if (userRes.rows.length === 0) {
      console.log('Demo user not found — skipping seed');
      return;
    }
    const userId = userRes.rows[0].id;
    console.log('Demo user ID:', userId);

    // Check if locks already exist
    const existRes = await client.query('SELECT COUNT(*) FROM "VaultLock" WHERE "userId" = $1', [userId]);
    if (parseInt(existRes.rows[0].count) > 0) {
      console.log('Locks already exist (' + existRes.rows[0].count + ') — skipping seed');
      return;
    }

    const now = new Date();

    // Lock 1: 7-day lock created 2 days ago (5 days remaining)
    const lock1Created = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const lock1Unlock = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    await client.query(
      'INSERT INTO "VaultLock" (id, "userId", amount, "createdAt", "unlockAt", status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      ['lock-demo-1', userId, 25.00, lock1Created, lock1Unlock, 'ACTIVE', 'Emergency cushion']
    );
    console.log('✓ Lock 1: $25 (5 days remaining)');

    await client.query(
      'INSERT INTO "Transaction" (id, "userId", type, amount, "balanceBefore", "balanceAfter", "vaultLockId", description, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      ['txn-lock-1', userId, 'LOCK_CREATED', 25.00, 50.00, 50.00, 'lock-demo-1', '$25.00 protected for 7 days', lock1Created]
    );
    console.log('✓ Lock 1 transaction');

    // Lock 2: 30-day lock created today
    const lock2Unlock = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await client.query(
      'INSERT INTO "VaultLock" (id, "userId", amount, "createdAt", "unlockAt", status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      ['lock-demo-2', userId, 100.00, now, lock2Unlock, 'ACTIVE', '30-day savings goal']
    );
    console.log('✓ Lock 2: $100 (30 days remaining)');

    await client.query(
      'INSERT INTO "Transaction" (id, "userId", type, amount, "balanceBefore", "balanceAfter", "vaultLockId", description, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      ['txn-lock-2', userId, 'LOCK_CREATED', 100.00, 50.00, 50.00, 'lock-demo-2', '$100.00 protected for 30 days', now]
    );
    console.log('✓ Lock 2 transaction');

    // Lock 3: Already unlocked (7 days, created 8 days ago)
    const lock3Created = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    const lock3Unlock = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    await client.query(
      'INSERT INTO "VaultLock" (id, "userId", amount, "createdAt", "unlockAt", status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      ['lock-demo-3', userId, 50.00, lock3Created, lock3Unlock, 'UNLOCKED', 'Quick save (released)']
    );
    console.log('✓ Lock 3: $50 (already unlocked)');

    // Only one transaction per lock (vaultLockId is unique). Use RELEASED since lock is already unlocked.
    await client.query(
      'INSERT INTO "Transaction" (id, "userId", type, amount, "balanceBefore", "balanceAfter", "vaultLockId", description, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      ['txn-lock-3', userId, 'LOCK_RELEASED', 50.00, 50.00, 50.00, 'lock-demo-3', '$50.00 unlocked from protected capital', lock3Unlock]
    );
    console.log('✓ Lock 3 transactions');

    // Update wallet
    const walletRes = await client.query('SELECT * FROM "Wallet" WHERE "userId" = $1', [userId]);
    if (walletRes.rows.length > 0) {
      const w = walletRes.rows[0];
      const lockedTotal = 125.00;
      const newAvailable = Math.max(0, w.available_vault_balance - lockedTotal);
      const newLocked = w.locked_vault_balance + lockedTotal;
      await client.query(
        'UPDATE "Wallet" SET "locked_vault_balance" = $1, "available_vault_balance" = $2 WHERE "userId" = $3',
        [newLocked, newAvailable, userId]
      );
      console.log('✓ Wallet updated: locked=$' + newLocked + ', available=$' + newAvailable);
    }

    console.log('\n✅ Demo data seeded successfully');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
