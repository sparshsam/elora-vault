// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProtectedVault
 * @notice Self-custodied behavioral savings vault for Elora Vault.
 *         Users deposit USDC and create timed locks to prevent impulsive withdrawals.
 *         Losses from the Elora behavioral game become protected capital onchain.
 *
 * @dev No pooled treasury. Each user's vault state is isolated.
 *      No admin-controlled withdrawals. No rehypothecation.
 *      Built for Base network. USDC native.
 *
 * @custom:security Designed for safety and transparency.
 *                  Losses become protected future capital.
 */
contract ProtectedVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ┌─────────────────────────────────────────────┐
    // │                 Errors                       │
    // └─────────────────────────────────────────────┘

    error ProtectedVault__ZeroAddress();
    error ProtectedVault__ZeroAmount();
    error ProtectedVault__InsufficientDeposit();
    error ProtectedVault__InsufficientBalance();
    error ProtectedVault__LockNotFound();
    error ProtectedVault__LockNotExpired();
    error ProtectedVault__LockAlreadyWithdrawn();
    error ProtectedVault__LockStillActive();
    error ProtectedVault__NothingToWithdraw();
    error ProtectedVault__TransferFailed();

    // ┌─────────────────────────────────────────────┐
    // │                 Types                        │
    // └─────────────────────────────────────────────┘

    /**
     * @notice A single vault lock entry.
     * @param amount     Amount of USDC locked (6 decimals).
     * @param createdAt  Timestamp when lock was created.
     * @param unlockAt   Timestamp when lock can be released.
     * @param withdrawn  Whether the locked amount has been withdrawn.
     */
    struct VaultLock {
        uint256 amount;
        uint256 createdAt;
        uint256 unlockAt;
        bool withdrawn;
    }

    /**
     * @notice Summary of a user's vault state.
     * @param totalDeposited       Total USDC ever deposited.
     * @param totalLocked          Total USDC currently in active locks.
     * @param totalWithdrawn       Total USDC ever withdrawn.
     * @param activeLockCount      Number of active (non-withdrawn, non-expired) locks.
     */
    struct VaultSummary {
        uint256 totalDeposited;
        uint256 totalLocked;
        uint256 totalWithdrawn;
        uint256 activeLockCount;
    }

    // ┌─────────────────────────────────────────────┐
    // │                 State                        │
    // └─────────────────────────────────────────────┘

    /// @notice The USDC token contract (Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913).
    IERC20 public immutable usdc;

    /// @notice Minimum lock duration in seconds (1 day).
    uint256 public constant MIN_LOCK_DURATION = 1 days;

    /// @notice Maximum lock duration in seconds (365 days).
    uint256 public constant MAX_LOCK_DURATION = 365 days;

    /// @notice User address => array of VaultLock structs.
    mapping(address => VaultLock[]) private _userLocks;

    /// @notice User address => total amount deposited.
    mapping(address => uint256) private _totalDeposited;

    /// @notice User address => total amount withdrawn.
    mapping(address => uint256) private _totalWithdrawn;

    // ┌─────────────────────────────────────────────┐
    // │                 Events                       │
    // └─────────────────────────────────────────────┘

    /**
     * @notice Emitted when a user deposits USDC into the vault.
     */
    event Deposited(address indexed user, uint256 amount, uint256 totalDeposited);

    /**
     * @notice Emitted when a user creates a new vault lock.
     */
    event LockCreated(
        address indexed user,
        uint256 indexed lockId,
        uint256 amount,
        uint256 unlockAt
    );

    /**
     * @notice Emitted when a user releases a lock (after unlock time).
     */
    event LockReleased(address indexed user, uint256 indexed lockId, uint256 amount);

    /**
     * @notice Emitted when a user withdraws available (unlocked) USDC.
     */
    event Withdrawn(address indexed user, uint256 amount, uint256 totalWithdrawn);

    /**
     * @notice Emitted when a user withdraws from a specific released lock.
     */
    event LockWithdrawn(address indexed user, uint256 indexed lockId, uint256 amount);

    // ┌─────────────────────────────────────────────┐
    // │                Constructor                   │
    // └─────────────────────────────────────────────┘

    /**
     * @param _usdc Address of the USDC token contract.
     */
    constructor(address _usdc) {
        if (_usdc == address(0)) revert ProtectedVault__ZeroAddress();
        usdc = IERC20(_usdc);
    }

    // ┌─────────────────────────────────────────────┐
    // │              Deposit Flow                    │
    // └─────────────────────────────────────────────┘

    /**
     * @notice Deposit USDC into the vault. User must have approved this contract.
     * @param amount Amount of USDC to deposit (6 decimals).
     */
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ProtectedVault__ZeroAmount();

        _totalDeposited[msg.sender] += amount;

        // Transfer USDC from user to this contract
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount, _totalDeposited[msg.sender]);
    }

    // ┌─────────────────────────────────────────────┐
    // │              Lock Creation                   │
    // └─────────────────────────────────────────────┘

    /**
     * @notice Create a new vault lock. Locks available deposited balance.
     * @param amount   Amount of USDC to lock (6 decimals).
     * @param duration Duration in seconds until unlock.
     * @return lockId  Index of the created lock in the user's lock array.
     *
     * Requirements:
     * - `amount` must be > 0
     * - `duration` must be between MIN_LOCK_DURATION (1 day) and MAX_LOCK_DURATION (365 days)
     * - User must have sufficient unlocked balance (totalDeposited - totalWithdrawn - activeLocks)
     */
    function createLock(uint256 amount, uint256 duration) external nonReentrant returns (uint256 lockId) {
        if (amount == 0) revert ProtectedVault__ZeroAmount();
        if (duration < MIN_LOCK_DURATION || duration > MAX_LOCK_DURATION) {
            revert ProtectedVault__InsufficientDeposit();
        }

        uint256 activeBalance = _getActiveBalance(msg.sender);
        if (amount > activeBalance) revert ProtectedVault__InsufficientBalance();

        uint256 unlockAt = block.timestamp + duration;

        VaultLock memory newLock = VaultLock({
            amount: amount,
            createdAt: block.timestamp,
            unlockAt: unlockAt,
            withdrawn: false
        });

        lockId = _userLocks[msg.sender].length;
        _userLocks[msg.sender].push(newLock);

        emit LockCreated(msg.sender, lockId, amount, unlockAt);
    }

    // ┌─────────────────────────────────────────────┐
    // │              Lock Release                    │
    // └─────────────────────────────────────────────┘

    /**
     * @notice Release a lock after its unlock time has passed.
     *         Marks the lock as withdrawable. Does NOT transfer USDC yet.
     * @param lockId Index of the lock to release.
     *
     * Requirements:
     * - Lock must exist and belong to caller.
     * - Lock must not have been withdrawn already.
     * - Lock's unlockAt must have passed.
     */
    function releaseLock(uint256 lockId) external {
        VaultLock storage lock = _getLockOrRevert(msg.sender, lockId);

        if (lock.withdrawn) revert ProtectedVault__LockAlreadyWithdrawn();
        if (block.timestamp < lock.unlockAt) revert ProtectedVault__LockNotExpired();

        // Mark as withdrawn so the amount is usable for withdrawal
        lock.withdrawn = true;

        emit LockReleased(msg.sender, lockId, lock.amount);
    }

    // ┌─────────────────────────────────────────────┐
    // │              Withdrawal                      │
    // └─────────────────────────────────────────────┘

    /**
     * @notice Withdraw all unlocked USDC balance.
     *         Iterates over locks to find released + non-withdrawn funds.
     *         Also withdraws any deposited-but-never-locked balance.
     *
     * @dev Gas cost scales with number of locks. For frequent withdrawals,
     *      prefer withdrawLock() for specific released locks.
     */
    function withdrawUnlocked() external nonReentrant {
        uint256 withdrawable = _getWithdrawableBalance(msg.sender);
        if (withdrawable == 0) revert ProtectedVault__NothingToWithdraw();

        // Mark all releasable locks as withdrawn
        VaultLock[] storage locks = _userLocks[msg.sender];
        uint256 len = locks.length;
        for (uint256 i = 0; i < len; i++) {
            if (!locks[i].withdrawn && block.timestamp >= locks[i].unlockAt) {
                locks[i].withdrawn = true;
            }
        }

        _totalWithdrawn[msg.sender] += withdrawable;

        usdc.safeTransfer(msg.sender, withdrawable);

        emit Withdrawn(msg.sender, withdrawable, _totalWithdrawn[msg.sender]);
    }

    /**
     * @notice Withdraw from a specific released lock.
     * @param lockId Index of the lock to withdraw from.
     *
     * Requirements:
     * - Lock must exist and belong to caller.
     * - Lock must have been released (releaseLock called and unlockAt passed).
     */
    function withdrawLock(uint256 lockId) external nonReentrant {
        VaultLock storage lock = _getLockOrRevert(msg.sender, lockId);

        if (!lock.withdrawn) revert ProtectedVault__LockStillActive();
        if (lock.amount == 0) revert ProtectedVault__LockAlreadyWithdrawn();

        uint256 amount = lock.amount;
        lock.amount = 0; // prevent re-withdrawal

        _totalWithdrawn[msg.sender] += amount;

        usdc.safeTransfer(msg.sender, amount);

        emit LockWithdrawn(msg.sender, lockId, amount);
    }

    // ┌─────────────────────────────────────────────┐
    // │              View Functions                  │
    // └─────────────────────────────────────────────┘

    /**
     * @notice Get the total number of locks for a user.
     */
    function getLockCount(address user) external view returns (uint256) {
        return _userLocks[user].length;
    }

    /**
     * @notice Get a specific lock for a user.
     */
    function getLock(address user, uint256 lockId) external view returns (VaultLock memory) {
        if (lockId >= _userLocks[user].length) revert ProtectedVault__LockNotFound();
        return _userLocks[user][lockId];
    }

    /**
     * @notice Get all locks for a user.
     */
    function getAllLocks(address user) external view returns (VaultLock[] memory) {
        return _userLocks[user];
    }

    /**
     * @notice Get active (non-withdrawn, non-expired) locks for a user.
     */
    function getActiveLocks(address user) external view returns (VaultLock[] memory) {
        VaultLock[] storage allLocks = _userLocks[user];
        uint256 count = 0;

        for (uint256 i = 0; i < allLocks.length; i++) {
            if (!allLocks[i].withdrawn && block.timestamp < allLocks[i].unlockAt) {
                count++;
            }
        }

        VaultLock[] memory active = new VaultLock[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allLocks.length; i++) {
            if (!allLocks[i].withdrawn && block.timestamp < allLocks[i].unlockAt) {
                active[idx] = allLocks[i];
                idx++;
            }
        }

        return active;
    }

    /**
     * @notice Get a summary of a user's vault state.
     */
    function getVaultSummary(address user) external view returns (VaultSummary memory) {
        VaultLock[] storage locks = _userLocks[user];
        uint256 totalLocked = 0;
        uint256 activeLockCount = 0;

        for (uint256 i = 0; i < locks.length; i++) {
            if (!locks[i].withdrawn && block.timestamp < locks[i].unlockAt) {
                totalLocked += locks[i].amount;
                activeLockCount++;
            }
        }

        return VaultSummary({
            totalDeposited: _totalDeposited[user],
            totalLocked: totalLocked,
            totalWithdrawn: _totalWithdrawn[user],
            activeLockCount: activeLockCount
        });
    }

    /**
     * @notice Get the withdrawable (unlocked, released, and never-locked) balance for a user.
     */
    function getWithdrawableBalance(address user) external view returns (uint256) {
        return _getWithdrawableBalance(user);
    }

    // ┌─────────────────────────────────────────────┐
    // │              Internal                        │
    // └─────────────────────────────────────────────┘

    /**
     * @dev Get the active balance (deposited minus locked minus withdrawn).
     */
    function _getActiveBalance(address user) private view returns (uint256) {
        VaultLock[] storage locks = _userLocks[user];
        uint256 lockedAmount = 0;

        for (uint256 i = 0; i < locks.length; i++) {
            // Only count locks that are still active (not withdrawn and not expired)
            if (!locks[i].withdrawn && block.timestamp < locks[i].unlockAt) {
                lockedAmount += locks[i].amount;
            }
        }

        return _totalDeposited[user] - _totalWithdrawn[user] - lockedAmount;
    }

    /**
     * @dev Get the total withdrawable amount = deposited - withdrawn - still-locked.
     */
    function _getWithdrawableBalance(address user) private view returns (uint256) {
        VaultLock[] storage locks = _userLocks[user];
        uint256 lockedAmount = 0;

        for (uint256 i = 0; i < locks.length; i++) {
            // Count locks that are still active (not withdrawn AND not expired)
            if (!locks[i].withdrawn && block.timestamp < locks[i].unlockAt) {
                lockedAmount += locks[i].amount;
            }
        }

        return _totalDeposited[user] - _totalWithdrawn[user] - lockedAmount;
    }

    /**
     * @dev Get a lock or revert if it doesn't exist.
     */
    function _getLockOrRevert(address user, uint256 lockId) private view returns (VaultLock storage) {
        if (lockId >= _userLocks[user].length) revert ProtectedVault__LockNotFound();
        return _userLocks[user][lockId];
    }
}
