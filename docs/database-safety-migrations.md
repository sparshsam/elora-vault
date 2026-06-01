# Database Migrations — Elora Vault

## Manual Migration Steps

The following schema changes are not yet applied but are recommended before
mainnet deployment. Apply via `prisma migrate dev --create-only` or direct SQL.

---

### 1. Unique constraint on Transaction.tx_hash per user

Prevents duplicate onchain event logging (replay attacks). The current
application code checks for duplicates at the API level, but a database
constraint provides a last line of defense.

**SQL:**
```sql
-- Allow null tx_hash but enforce uniqueness when not null
CREATE UNIQUE INDEX idx_transaction_user_tx_hash
ON "Transaction" ("userId", "tx_hash")
WHERE "tx_hash" IS NOT NULL;
```

**Prisma schema change (after adding the migration):**
```prisma
model Transaction {
  // ... existing fields ...
  tx_hash       String?  @unique
  // Add @@unique([userId, tx_hash]) if you prefer composite over partial
}
```

---

### 2. Add onchain_lock_id uniqueness per user

Prevents duplicate lock processing for the same onchain lock.

**SQL:**
```sql
CREATE UNIQUE INDEX idx_vaultlock_user_onchain_lock
ON "VaultLock" ("userId", "onchain_lock_id")
WHERE "onchain_lock_id" IS NOT NULL;
```

---

### 3. Index frequently queried columns

For better query performance as the user base grows:

```sql
-- Prediction listing by user + status (used on sessions page)
CREATE INDEX idx_bet_user_status ON "Bet" ("userId", "status");

-- Transaction listing by user (activity timeline)
CREATE INDEX idx_transaction_user_created ON "Transaction" ("userId", "createdAt" DESC);

-- Active vault locks by user
CREATE INDEX idx_vaultlock_user_status ON "VaultLock" ("userId", "status");
```

---

### 4. Decimal types for financial amounts (future)

When ready to migrate from Float to precise decimal:

```sql
-- Use PostgreSQL NUMERIC for all monetary fields
-- Example: available_vault_balance NUMERIC(20, 6) NOT NULL DEFAULT 0
-- This ensures no floating-point precision loss at scale.
```

This is an architecture-level change. See SECURITY_NOTES.md for details.
