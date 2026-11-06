//! bLOkz on-chain staking vault (Solana, Anchor).
//!
//! Custody boundary: real token lock + funded-pool yield for the
//! classic-SPL mint chosen at deploy (Token-2022 via token_2022 CPI is a
//! deploy-time switch).
//!
//! Reward model (mirrors `src/lib/game/rewards.ts` + `STAKING_VAULT.md`):
//! - Lock: 12h (`LOCK_SECS_DEFAULT = 43200`) after stake / top-up.
//!   Top-ups restart the lock (`staked_at = now` on every stake).
//! - Yield: 200 bps/day of personal stake, accrued continuously.
//! - Funding: rewards pay from a **funded reward pool**, capped at
//!   `reward_pool` — claims never mint.
//! - Authority can pause and update rate/lock.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

declare_id!("Gb5ZSSPaHM1C2DNYAsoMvD1HJru8WCY2VF47MamvkDYy");

pub const LOCK_SECS_DEFAULT: u64 = 43_200; // 12h
pub const DAILY_RATE_BPS_DEFAULT: u16 = 200; // 2.00%/day
pub const BPS_DENOM: u128 = 10_000;
pub const SECS_PER_DAY: u128 = 86_400;
pub const MIN_LOCK_SECS: u64 = 3_600; // 1h
pub const MAX_LOCK_SECS: u64 = 30 * 86_400; // 30d
pub const MAX_DAILY_RATE_BPS: u16 = 10_000; // 100%/day hard cap

#[program]
pub mod blokz_stake {
    use super::*;

    /// Create the vault config. The vault + reward ATAs (owned by the config
    /// PDA) must exist before this call; see `docs/STAKING_VAULT.md`.
    pub fn initialize(ctx: Context<Initialize>, lock_secs: u64, daily_rate_bps: u16) -> Result<()> {
        require!(
            (MIN_LOCK_SECS..=MAX_LOCK_SECS).contains(&lock_secs),
            StakeError::BadParams
        );
        require!(
            (1..=MAX_DAILY_RATE_BPS).contains(&daily_rate_bps),
            StakeError::BadParams
        );
        let cfg = &mut ctx.accounts.config;
        cfg.authority = ctx.accounts.authority.key();
        cfg.mint = ctx.accounts.mint.key();
        cfg.vault = ctx.accounts.vault.key();
        cfg.reward_vault = ctx.accounts.reward_vault.key();
        cfg.lock_secs = lock_secs;
        cfg.daily_rate_bps = daily_rate_bps;
        cfg.paused = false;
        cfg.bump = ctx.bumps.config;
        cfg.total_staked = 0;
        cfg.reward_pool = 0;
        emit!(VaultInit {
            authority: cfg.authority,
            lock_secs,
            daily_rate_bps,
        });
        Ok(())
    }

    /// Top up the reward pool (transfers tokens into `reward_vault`).
    pub fn fund_rewards(ctx: Context<FundRewards>, amount: u64) -> Result<()> {
        require!(amount > 0, StakeError::BadAmount);
        let decimals = ctx.accounts.mint.decimals;
        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.funder_ata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.reward_vault.to_account_info(),
                    authority: ctx.accounts.funder.to_account_info(),
                },
            ),
            amount,
            decimals,
        )?;
        ctx.accounts.config.reward_pool = ctx
            .accounts
            .config
            .reward_pool
            .checked_add(amount)
            .ok_or(StakeError::Overflow)?;
        emit!(PoolFunded {
            funder: ctx.accounts.funder.key(),
            amount,
            reward_pool: ctx.accounts.config.reward_pool,
        });
        Ok(())
    }

    /// Lock tokens. Accrues existing yield first; top-up restarts the lock.
    pub fn stake(ctx: Context<StakeAccounts>, amount: u64) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require!(!cfg.paused, StakeError::Paused);
        require!(amount > 0, StakeError::BadAmount);
        let now = Clock::get()?.unix_timestamp;
        require!(now >= 0, StakeError::BadClock);

        accrue(&mut ctx.accounts.stake_acc, cfg, now)?;

        let decimals = ctx.accounts.mint.decimals;
        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.user_ata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
            decimals,
        )?;

        let acc = &mut ctx.accounts.stake_acc;
        acc.owner = ctx.accounts.user.key();
        acc.amount = acc.amount.checked_add(amount).ok_or(StakeError::Overflow)?;
        acc.staked_at = now; // top-up restarts the 12h lock
        acc.last_accrual_at = now;
        acc.bump = ctx.bumps.stake_acc;

        ctx.accounts.config.total_staked = ctx
            .accounts
            .config
            .total_staked
            .checked_add(amount)
            .ok_or(StakeError::Overflow)?;
        emit!(Staked {
            owner: ctx.accounts.user.key(),
            amount,
            total: acc.amount,
        });
        Ok(())
    }

    /// Withdraw locked tokens after the lock expires. Accrued yield stays
    /// claimable via `claim`.
    pub fn unstake(ctx: Context<StakeAccounts>, amount: u64) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require!(!cfg.paused, StakeError::Paused);
        require!(amount > 0, StakeError::BadAmount);
        let now = Clock::get()?.unix_timestamp;
        require!(now >= 0, StakeError::BadClock);

        accrue(&mut ctx.accounts.stake_acc, cfg, now)?;

        let locked_for = now
            .checked_sub(ctx.accounts.stake_acc.staked_at)
            .ok_or(StakeError::BadClock)?;
        require!(
            locked_for >= cfg.lock_secs as i64,
            StakeError::Locked
        );
        require!(
            ctx.accounts.stake_acc.amount >= amount,
            StakeError::InsufficientStake
        );

        let seeds: &[&[u8]] = &[b"config", &[ctx.accounts.config.bump]];
        token::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.user_ata.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                &[seeds],
            ),
            amount,
            ctx.accounts.mint.decimals,
        )?;

        ctx.accounts.stake_acc.amount -= amount;
        ctx.accounts.config.total_staked = ctx
            .accounts
            .config
            .total_staked
            .saturating_sub(amount);
        emit!(Unstaked {
            owner: ctx.accounts.user.key(),
            amount,
            total: ctx.accounts.stake_acc.amount,
        });
        Ok(())
    }

    /// Pay accrued yield from the funded pool (capped at `reward_pool`).
    /// First claim requires the lock to have elapsed (mirrors the app).
    pub fn claim(ctx: Context<ClaimAccounts>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require!(!cfg.paused, StakeError::Paused);
        let now = Clock::get()?.unix_timestamp;
        require!(now >= 0, StakeError::BadClock);

        accrue(&mut ctx.accounts.stake_acc, cfg, now)?;

        let locked_for = now
            .checked_sub(ctx.accounts.stake_acc.staked_at)
            .ok_or(StakeError::BadClock)?;
        require!(locked_for >= cfg.lock_secs as i64, StakeError::Locked);

        let pay = ctx.accounts.stake_acc.pending.min(cfg.reward_pool);
        require!(pay > 0, StakeError::NothingToClaim);

        let seeds: &[&[u8]] = &[b"config", &[ctx.accounts.config.bump]];
        token::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.reward_vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.user_ata.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                &[seeds],
            ),
            pay,
            ctx.accounts.mint.decimals,
        )?;

        ctx.accounts.stake_acc.pending -= pay;
        ctx.accounts.config.reward_pool -= pay;
        emit!(Claimed {
            owner: ctx.accounts.user.key(),
            amount: pay,
        });
        Ok(())
    }

    /// Authority: update lock / rate.
    pub fn set_params(
        ctx: Context<AdminAccounts>,
        lock_secs: u64,
        daily_rate_bps: u16,
    ) -> Result<()> {
        require!(
            (MIN_LOCK_SECS..=MAX_LOCK_SECS).contains(&lock_secs),
            StakeError::BadParams
        );
        require!(
            (1..=MAX_DAILY_RATE_BPS).contains(&daily_rate_bps),
            StakeError::BadParams
        );
        ctx.accounts.config.lock_secs = lock_secs;
        ctx.accounts.config.daily_rate_bps = daily_rate_bps;
        Ok(())
    }

    /// Authority: pause / unpause all stake/unstake/claim.
    pub fn set_paused(ctx: Context<AdminAccounts>, paused: bool) -> Result<()> {
        ctx.accounts.config.paused = paused;
        emit!(Paused { paused });
        Ok(())
    }
}

/// Continuous yield: `amount * bps * elapsed / (10000 * 86400)`, u128 math.
pub fn accrue(acc: &mut Account<StakeAccount>, cfg: &Account<Config>, now: i64) -> Result<()> {
    if acc.amount == 0 || acc.last_accrual_at == 0 {
        acc.last_accrual_at = now;
        return Ok(());
    }
    let elapsed = now.saturating_sub(acc.last_accrual_at).max(0) as u128;
    if elapsed == 0 {
        return Ok(());
    }
    let earned = (acc.amount as u128)
        .checked_mul(cfg.daily_rate_bps as u128)
        .and_then(|v| v.checked_mul(elapsed))
        .and_then(|v| v.checked_div(BPS_DENOM * SECS_PER_DAY))
        .ok_or(StakeError::Overflow)?;
    acc.pending = acc
        .pending
        .checked_add(earned.min(u64::MAX as u128) as u64)
        .ok_or(StakeError::Overflow)?;
    acc.last_accrual_at = now;
    Ok(())
}

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub reward_vault: Pubkey,
    pub lock_secs: u64,
    pub daily_rate_bps: u16,
    pub paused: bool,
    pub bump: u8,
    pub total_staked: u64,
    pub reward_pool: u64,
}

impl Config {
    pub const SIZE: usize = 32 + 32 + 32 + 32 + 8 + 2 + 1 + 1 + 8 + 8;
}

#[account]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub amount: u64,
    pub staked_at: i64,
    pub last_accrual_at: i64,
    pub pending: u64,
    pub bump: u8,
}

impl StakeAccount {
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 8 + 1;
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        constraint = vault.mint == mint.key() @ StakeError::BadVault,
        constraint = vault.owner == config.key() @ StakeError::BadVault,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        constraint = reward_vault.mint == mint.key() @ StakeError::BadVault,
        constraint = reward_vault.owner == config.key() @ StakeError::BadVault,
    )]
    pub reward_vault: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = authority,
        space = 8 + Config::SIZE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundRewards<'info> {
    pub funder: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = reward_vault.mint == config.mint @ StakeError::BadVault,
        constraint = reward_vault.key() == config.reward_vault @ StakeError::BadVault,
    )]
    pub reward_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub funder_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub config: Account<'info, Config>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct StakeAccounts<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = vault.mint == config.mint @ StakeError::BadVault,
        constraint = vault.key() == config.vault @ StakeError::BadVault,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_ata: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + StakeAccount::SIZE,
        seeds = [b"stake", user.key().as_ref()],
        bump,
    )]
    pub stake_acc: Account<'info, StakeAccount>,
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimAccounts<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = reward_vault.mint == config.mint @ StakeError::BadVault,
        constraint = reward_vault.key() == config.reward_vault @ StakeError::BadVault,
    )]
    pub reward_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"stake", user.key().as_ref()],
        bump = stake_acc.bump,
    )]
    pub stake_acc: Account<'info, StakeAccount>,
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AdminAccounts<'info> {
    #[account(constraint = authority.key() == config.authority @ StakeError::Unauthorized)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub config: Account<'info, Config>,
}

#[event]
pub struct VaultInit {
    pub authority: Pubkey,
    pub lock_secs: u64,
    pub daily_rate_bps: u16,
}

#[event]
pub struct PoolFunded {
    pub funder: Pubkey,
    pub amount: u64,
    pub reward_pool: u64,
}

#[event]
pub struct Staked {
    pub owner: Pubkey,
    pub amount: u64,
    pub total: u64,
}

#[event]
pub struct Unstaked {
    pub owner: Pubkey,
    pub amount: u64,
    pub total: u64,
}

#[event]
pub struct Claimed {
    pub owner: Pubkey,
    pub amount: u64,
}

#[event]
pub struct Paused {
    pub paused: bool,
}

#[error_code]
pub enum StakeError {
    #[msg("Staking is paused")]
    Paused,
    #[msg("Stake is still locked")]
    Locked,
    #[msg("Amount must be positive")]
    BadAmount,
    #[msg("Invalid lock/rate params")]
    BadParams,
    #[msg("Reward pool is empty")]
    NothingToClaim,
    #[msg("Not enough staked")]
    InsufficientStake,
    #[msg("Vault account mismatch")]
    BadVault,
    #[msg("Not the vault authority")]
    Unauthorized,
    #[msg("Math overflow")]
    Overflow,
    #[msg("Bad clock")]
    BadClock,
}

