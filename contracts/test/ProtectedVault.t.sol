// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {ProtectedVault} from "../src/ProtectedVault.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

/**
 * @notice Mock ERC20 for testing (simulates USDC with 6 decimals).
 */
contract MockUSDC is IERC20 {
    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    uint256 public totalSupply;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        uint256 fromBalance = balanceOf[msg.sender];
        require(fromBalance >= amount, "insufficient balance");
        balanceOf[msg.sender] = fromBalance - amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 fromBalance = balanceOf[from];
        require(fromBalance >= amount, "insufficient balance");
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "insufficient allowance");
        balanceOf[from] = fromBalance - amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] = allowed - amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract ProtectedVaultTest is Test {
    ProtectedVault public vault;
    MockUSDC public usdc;

    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);

    uint256 public constant INITIAL_BALANCE = 100_000_000; // 100 USDC (6 decimals)
    uint256 public constant ONE_DAY = 1 days;
    uint256 public constant THIRTY_DAYS = 30 days;

    function setUp() public {
        usdc = new MockUSDC();
        vault = new ProtectedVault(address(usdc));

        // Mint USDC to test users
        usdc.mint(alice, INITIAL_BALANCE);
        usdc.mint(bob, INITIAL_BALANCE);

        // Approve vault
        vm.startPrank(alice);
        usdc.approve(address(vault), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(vault), type(uint256).max);
        vm.stopPrank();
    }

    // ──────────────── DEPOSIT TESTS ────────────────

    function test_Deposit() public {
        vm.prank(alice);
        vault.deposit(50_000_000); // 50 USDC

        ProtectedVault.VaultSummary memory summary = vault.getVaultSummary(alice);
        assertEq(summary.totalDeposited, 50_000_000);
        assertEq(summary.totalLocked, 0);
        assertEq(summary.totalWithdrawn, 0);

        assertEq(usdc.balanceOf(address(vault)), 50_000_000);
    }

    function test_RevertWhen_DepositZero() public {
        vm.prank(alice);
        vm.expectRevert(ProtectedVault.ProtectedVault__ZeroAmount.selector);
        vault.deposit(0);
    }

    function test_RevertWhen_DepositWithoutApproval() public {
        address charlie = address(0xC);
        usdc.mint(charlie, 100_000_000);

        vm.prank(charlie);
        vm.expectRevert();
        vault.deposit(10_000_000);
    }

    // ──────────────── LOCK TESTS ────────────────

    function test_CreateLock() public {
        vm.startPrank(alice);
        vault.deposit(50_000_000);

        uint256 lockId = vault.createLock(25_000_000, THIRTY_DAYS);
        vm.stopPrank();

        assertEq(lockId, 0);

        ProtectedVault.VaultLock memory lock = vault.getLock(alice, lockId);
        assertEq(lock.amount, 25_000_000);
        assertEq(lock.withdrawn, false);
        assertEq(lock.unlockAt, block.timestamp + THIRTY_DAYS);

        ProtectedVault.VaultSummary memory summary = vault.getVaultSummary(alice);
        assertEq(summary.totalLocked, 25_000_000);
        assertEq(summary.activeLockCount, 1);
    }

    function test_RevertWhen_CreateLockZeroDuration() public {
        vm.startPrank(alice);
        vault.deposit(50_000_000);

        vm.expectRevert(ProtectedVault.ProtectedVault__InsufficientDeposit.selector);
        vault.createLock(10_000_000, 0);
        vm.stopPrank();
    }

    function test_RevertWhen_CreateLockExceedsBalance() public {
        vm.startPrank(alice);
        vault.deposit(10_000_000);

        vm.expectRevert(ProtectedVault.ProtectedVault__InsufficientBalance.selector);
        vault.createLock(20_000_000, THIRTY_DAYS);
        vm.stopPrank();
    }

    function test_RevertWhen_LockDurationTooShort() public {
        vm.startPrank(alice);
        vault.deposit(10_000_000);

        vm.expectRevert(ProtectedVault.ProtectedVault__InsufficientDeposit.selector);
        vault.createLock(5_000_000, 12 hours); // below 1 day minimum
        vm.stopPrank();
    }

    function test_RevertWhen_LockDurationTooLong() public {
        vm.startPrank(alice);
        vault.deposit(10_000_000);

        vm.expectRevert(ProtectedVault.ProtectedVault__InsufficientDeposit.selector);
        vault.createLock(5_000_000, 400 days); // above 365 day maximum
        vm.stopPrank();
    }

    // ──────────────── RELEASE TESTS ────────────────

    function test_ReleaseLock() public {
        vm.startPrank(alice);
        vault.deposit(50_000_000);
        vault.createLock(25_000_000, ONE_DAY);
        vm.stopPrank();

        // Warp past unlock time
        vm.warp(block.timestamp + ONE_DAY + 1);

        vm.prank(alice);
        vault.releaseLock(0);

        ProtectedVault.VaultLock memory lock = vault.getLock(alice, 0);
        assertEq(lock.withdrawn, true);
    }

    function test_RevertWhen_ReleaseLockNotExpired() public {
        vm.startPrank(alice);
        vault.deposit(50_000_000);
        vault.createLock(25_000_000, THIRTY_DAYS);
        vm.stopPrank();

        vm.prank(alice);
        vm.expectRevert(ProtectedVault.ProtectedVault__LockNotExpired.selector);
        vault.releaseLock(0);
    }

    function test_RevertWhen_ReleaseNonexistentLock() public {
        vm.prank(alice);
        vm.expectRevert(ProtectedVault.ProtectedVault__LockNotFound.selector);
        vault.releaseLock(999);
    }

    // ──────────────── WITHDRAWAL TESTS ────────────────

    function test_WithdrawUnlocked() public {
        vm.startPrank(alice);
        vault.deposit(50_000_000);
        vault.createLock(25_000_000, ONE_DAY);
        vm.stopPrank();

        // Warp past unlock
        vm.warp(block.timestamp + ONE_DAY + 1);

        vm.prank(alice);
        vault.releaseLock(0);

        vm.prank(alice);
        vault.withdrawUnlocked();

        // Alice should have all her USDC back
        assertEq(usdc.balanceOf(alice), INITIAL_BALANCE);
    }

    function test_WithdrawLock() public {
        vm.startPrank(alice);
        vault.deposit(50_000_000);
        vault.createLock(25_000_000, ONE_DAY);
        vm.stopPrank();

        vm.warp(block.timestamp + ONE_DAY + 1);

        uint256 aliceBalanceBefore = usdc.balanceOf(alice);

        vm.prank(alice);
        vault.releaseLock(0);

        vm.prank(alice);
        vault.withdrawLock(0);

        assertEq(usdc.balanceOf(alice), aliceBalanceBefore + 25_000_000);
    }

    function test_RevertWhen_DoubleWithdrawLock() public {
        vm.startPrank(alice);
        vault.deposit(50_000_000);
        vault.createLock(25_000_000, ONE_DAY);
        vm.stopPrank();

        vm.warp(block.timestamp + ONE_DAY + 1);

        vm.startPrank(alice);
        vault.releaseLock(0);
        vault.withdrawLock(0);
        vm.stopPrank();

        vm.prank(alice);
        vm.expectRevert(ProtectedVault.ProtectedVault__LockAlreadyWithdrawn.selector);
        vault.withdrawLock(0);
    }

    function test_RevertWhen_WithdrawBeforeRelease() public {
        vm.startPrank(alice);
        vault.deposit(50_000_000);
        vault.createLock(25_000_000, ONE_DAY);
        vm.stopPrank();

        vm.warp(block.timestamp + ONE_DAY + 1);

        // Try to withdrawLock without calling releaseLock first
        vm.prank(alice);
        vm.expectRevert(ProtectedVault.ProtectedVault__LockStillActive.selector);
        vault.withdrawLock(0);
    }

    // ──────────────── VIEW FUNCTION TESTS ────────────────

    function test_GetActiveLocks() public {
        vm.startPrank(alice);
        vault.deposit(50_000_000);
        vault.createLock(10_000_000, ONE_DAY);
        vault.createLock(15_000_000, THIRTY_DAYS);
        vm.stopPrank();

        ProtectedVault.VaultLock[] memory active = vault.getActiveLocks(alice);
        assertEq(active.length, 2);

        // After first lock expires
        vm.warp(block.timestamp + ONE_DAY + 1);

        active = vault.getActiveLocks(alice);
        assertEq(active.length, 1);
        assertEq(active[0].amount, 15_000_000);
    }

    function test_GetVaultSummary() public {
        vm.startPrank(alice);
        vault.deposit(100_000_000);
        vault.createLock(30_000_000, ONE_DAY);
        vault.createLock(20_000_000, THIRTY_DAYS);
        vm.stopPrank();

        ProtectedVault.VaultSummary memory summary = vault.getVaultSummary(alice);
        assertEq(summary.totalDeposited, 100_000_000);
        assertEq(summary.totalLocked, 50_000_000);
        assertEq(summary.activeLockCount, 2);
        assertEq(summary.totalWithdrawn, 0);
    }

    function test_UserIsolation() public {
        // Alice deposits and locks
        vm.startPrank(alice);
        vault.deposit(50_000_000);
        vault.createLock(20_000_000, ONE_DAY);
        vm.stopPrank();

        // Bob deposits and locks
        vm.startPrank(bob);
        vault.deposit(30_000_000);
        vault.createLock(10_000_000, ONE_DAY);
        vm.stopPrank();

        // Alice's summary should be independent of Bob's
        ProtectedVault.VaultSummary memory aliceSummary = vault.getVaultSummary(alice);
        ProtectedVault.VaultSummary memory bobSummary = vault.getVaultSummary(bob);

        assertEq(aliceSummary.totalDeposited, 50_000_000);
        assertEq(aliceSummary.totalLocked, 20_000_000);
        assertEq(bobSummary.totalDeposited, 30_000_000);
        assertEq(bobSummary.totalLocked, 10_000_000);
    }

    // ──────────────── COMPREHENSIVE FLOW ────────────────

    function test_FullUserJourney() public {
        // 1. Alice deposits 100 USDC
        vm.prank(alice);
        vault.deposit(100_000_000);

        assertEq(usdc.balanceOf(address(vault)), 100_000_000);

        // 2. Alice creates two locks: 40 for 7 days, 30 for 30 days
        vm.startPrank(alice);
        uint256 lock1 = vault.createLock(40_000_000, 7 days);
        uint256 lock2 = vault.createLock(30_000_000, 30 days);
        vm.stopPrank();

        assertEq(lock1, 0);
        assertEq(lock2, 1);

        // 3. Check active balance remaining (deposited - locked = 100 - 40 - 30 = 30)
        ProtectedVault.VaultSummary memory summary = vault.getVaultSummary(alice);
        assertEq(summary.totalLocked, 70_000_000);
        assertEq(summary.activeLockCount, 2);

        // 4. First lock expires after 7 days
        vm.warp(block.timestamp + 7 days + 1);

        // 5. Release and withdraw first lock
        vm.startPrank(alice);
        vault.releaseLock(0);
        vault.withdrawLock(0);
        vm.stopPrank();

        assertEq(usdc.balanceOf(alice), INITIAL_BALANCE - 100_000_000 + 40_000_000);

        // 6. Check active locks (only lock2 remains)
        ProtectedVault.VaultLock[] memory active = vault.getActiveLocks(alice);
        assertEq(active.length, 1);
        assertEq(active[0].amount, 30_000_000);

        // 7. Warp to lock2 expiry and withdraw
        vm.warp(block.timestamp + 23 days + 1);

        vm.startPrank(alice);
        vault.releaseLock(1);
        vault.withdrawLock(1);
        vm.stopPrank();

        // Alice should have: INITIAL_BALANCE - deposited + withdrawn = 100 - 100 + 40 + 30 = 70
        assertEq(usdc.balanceOf(alice), 70_000_000);
    }

    // ──────────────── EDGE CASES ────────────────

    function test_MultipleLocksSameDuration() public {
        vm.startPrank(alice);
        vault.deposit(100_000_000);
        uint256 id1 = vault.createLock(10_000_000, ONE_DAY);
        uint256 id2 = vault.createLock(20_000_000, ONE_DAY);
        uint256 id3 = vault.createLock(30_000_000, ONE_DAY);
        vm.stopPrank();

        assertEq(id1, 0);
        assertEq(id2, 1);
        assertEq(id3, 2);

        assertEq(vault.getLockCount(alice), 3);
    }

    function test_WithdrawUnlockedWithNoLocks() public {
        vm.prank(alice);
        vault.deposit(50_000_000);

        // No locks created, withdraw all
        vm.prank(alice);
        vault.withdrawUnlocked();

        assertEq(usdc.balanceOf(alice), INITIAL_BALANCE);
    }

    function test_RevertWhen_WithdrawNothing() public {
        vm.prank(alice);
        vm.expectRevert(ProtectedVault.ProtectedVault__NothingToWithdraw.selector);
        vault.withdrawUnlocked();
    }
}
