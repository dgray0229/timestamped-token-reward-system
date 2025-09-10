use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod reward_system {
    use super::*;

    /// Initialize the reward pool with configuration parameters
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        reward_rate_per_hour: u64,
        min_claim_interval_hours: u64,
        max_daily_reward: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.reward_pool;
        let clock = Clock::get()?;

        pool.authority = ctx.accounts.authority.key();
        pool.mint = ctx.accounts.mint.key();
        pool.vault = ctx.accounts.vault.key();
        pool.reward_rate_per_hour = reward_rate_per_hour;
        pool.min_claim_interval_hours = min_claim_interval_hours;
        pool.max_daily_reward = max_daily_reward;
        pool.total_distributed = 0;
        pool.participant_count = 0;
        pool.is_active = true;
        pool.created_at = clock.unix_timestamp;
        pool.bump = ctx.bumps.reward_pool;

        msg!("Reward pool initialized with rate: {} per hour", reward_rate_per_hour);
        Ok(())
    }

    /// Register a user in the reward system
    pub fn register_user(ctx: Context<RegisterUser>) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        let pool = &mut ctx.accounts.reward_pool;
        let clock = Clock::get()?;

        user_account.authority = ctx.accounts.authority.key();
        user_account.total_earned = 0;
        user_account.total_claims = 0;
        user_account.last_claim_timestamp = 0;
        user_account.registration_timestamp = clock.unix_timestamp;
        user_account.is_active = true;
        user_account.bump = ctx.bumps.user_account;

        pool.participant_count = pool.participant_count.checked_add(1).unwrap();

        msg!("User registered: {}", ctx.accounts.authority.key());
        Ok(())
    }

    /// Calculate and return available rewards for a user
    pub fn calculate_rewards(ctx: Context<CalculateRewards>) -> Result<u64> {
        let user_account = &ctx.accounts.user_account;
        let pool = &ctx.accounts.reward_pool;
        let clock = Clock::get()?;

        require!(pool.is_active, ErrorCode::PoolNotActive);
        require!(user_account.is_active, ErrorCode::UserNotActive);

        let current_timestamp = clock.unix_timestamp;
        let hours_since_last_claim = if user_account.last_claim_timestamp == 0 {
            // First time claiming - calculate from registration
            ((current_timestamp - user_account.registration_timestamp) / 3600) as u64
        } else {
            ((current_timestamp - user_account.last_claim_timestamp) / 3600) as u64
        };

        // Check minimum claim interval
        require!(
            hours_since_last_claim >= pool.min_claim_interval_hours,
            ErrorCode::ClaimTooSoon
        );

        // Calculate reward amount
        let reward_amount = hours_since_last_claim
            .checked_mul(pool.reward_rate_per_hour)
            .unwrap()
            .min(pool.max_daily_reward);

        msg!("Calculated reward: {} for {} hours", reward_amount, hours_since_last_claim);
        Ok(reward_amount)
    }

    /// Claim accumulated rewards
    pub fn claim_rewards(
        ctx: Context<ClaimRewards>,
        expected_amount: u64,
    ) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        let pool = &mut ctx.accounts.reward_pool;
        let clock = Clock::get()?;

        require!(pool.is_active, ErrorCode::PoolNotActive);
        require!(user_account.is_active, ErrorCode::UserNotActive);

        let current_timestamp = clock.unix_timestamp;
        let hours_since_last_claim = if user_account.last_claim_timestamp == 0 {
            ((current_timestamp - user_account.registration_timestamp) / 3600) as u64
        } else {
            ((current_timestamp - user_account.last_claim_timestamp) / 3600) as u64
        };

        require!(
            hours_since_last_claim >= pool.min_claim_interval_hours,
            ErrorCode::ClaimTooSoon
        );

        let reward_amount = hours_since_last_claim
            .checked_mul(pool.reward_rate_per_hour)
            .unwrap()
            .min(pool.max_daily_reward);

        // Verify expected amount matches calculated amount (within small tolerance)
        require!(
            expected_amount == reward_amount,
            ErrorCode::AmountMismatch
        );

        require!(reward_amount > 0, ErrorCode::NoRewardsAvailable);

        // Transfer tokens from vault to user
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.reward_pool.to_account_info(),
        };

        let seeds = &[
            b"reward_pool",
            pool.authority.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, reward_amount)?;

        // Update user account
        user_account.total_earned = user_account.total_earned.checked_add(reward_amount).unwrap();
        user_account.total_claims = user_account.total_claims.checked_add(1).unwrap();
        user_account.last_claim_timestamp = current_timestamp;

        // Update pool statistics
        pool.total_distributed = pool.total_distributed.checked_add(reward_amount).unwrap();

        msg!("Rewards claimed: {} tokens", reward_amount);
        Ok(())
    }

    /// Update pool configuration (admin only)
    pub fn update_pool_config(
        ctx: Context<UpdatePoolConfig>,
        reward_rate_per_hour: Option<u64>,
        min_claim_interval_hours: Option<u64>,
        max_daily_reward: Option<u64>,
        is_active: Option<bool>,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.reward_pool;

        if let Some(rate) = reward_rate_per_hour {
            pool.reward_rate_per_hour = rate;
        }
        if let Some(interval) = min_claim_interval_hours {
            pool.min_claim_interval_hours = interval;
        }
        if let Some(max_reward) = max_daily_reward {
            pool.max_daily_reward = max_reward;
        }
        if let Some(active) = is_active {
            pool.is_active = active;
        }

        msg!("Pool configuration updated");
        Ok(())
    }

    /// Emergency withdraw (admin only)
    pub fn emergency_withdraw(
        ctx: Context<EmergencyWithdraw>,
        amount: u64,
    ) -> Result<()> {
        let pool = &ctx.accounts.reward_pool;

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.reward_pool.to_account_info(),
        };

        let seeds = &[
            b"reward_pool",
            pool.authority.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, amount)?;

        msg!("Emergency withdrawal: {} tokens", amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + RewardPool::INIT_SPACE,
        seeds = [b"reward_pool", authority.key().as_ref()],
        bump
    )]
    pub reward_pool: Account<'info, RewardPool>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = reward_pool,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + UserAccount::INIT_SPACE,
        seeds = [b"user_account", authority.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [b"reward_pool", reward_pool.authority.as_ref()],
        bump = reward_pool.bump
    )]
    pub reward_pool: Account<'info, RewardPool>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CalculateRewards<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"user_account", authority.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        seeds = [b"reward_pool", reward_pool.authority.as_ref()],
        bump = reward_pool.bump
    )]
    pub reward_pool: Account<'info, RewardPool>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user_account", authority.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [b"reward_pool", reward_pool.authority.as_ref()],
        bump = reward_pool.bump
    )]
    pub reward_pool: Account<'info, RewardPool>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = reward_pool,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePoolConfig<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [b"reward_pool", authority.key().as_ref()],
        bump = reward_pool.bump
    )]
    pub reward_pool: Account<'info, RewardPool>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct EmergencyWithdraw<'info> {
    #[account(
        has_one = authority,
        seeds = [b"reward_pool", authority.key().as_ref()],
        bump = reward_pool.bump
    )]
    pub reward_pool: Account<'info, RewardPool>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = reward_pool,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct RewardPool {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub reward_rate_per_hour: u64,
    pub min_claim_interval_hours: u64,
    pub max_daily_reward: u64,
    pub total_distributed: u64,
    pub participant_count: u64,
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub authority: Pubkey,
    pub total_earned: u64,
    pub total_claims: u64,
    pub last_claim_timestamp: i64,
    pub registration_timestamp: i64,
    pub is_active: bool,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Pool is not active")]
    PoolNotActive,
    #[msg("User is not active")]
    UserNotActive,
    #[msg("Claim too soon - minimum interval not met")]
    ClaimTooSoon,
    #[msg("Amount mismatch between expected and calculated")]
    AmountMismatch,
    #[msg("No rewards available to claim")]
    NoRewardsAvailable,
}