use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
mod rewards;
use rewards::{calculate_rewards, distribute_rewards};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod chads_defi_platform {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn stake_nft(ctx: Context<StakeNFT>) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        stake_account.owner = *ctx.accounts.user.key;
        stake_account.nft_mint = ctx.accounts.nft_mint.key();
        stake_account.stake_start_time = Clock::get()?.unix_timestamp;
        stake_account.last_claim_time = stake_account.stake_start_time;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.user_nft_account.to_account_info(),
                    to: ctx.accounts.vault_nft_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            1,
        )?;

        Ok(())
    }

    pub fn unstake_nft(ctx: Context<UnstakeNFT>) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        require!(stake_account.owner == *ctx.accounts.user.key, ErrorCode::Unauthorized);

        let current_time = Clock::get()?.unix_timestamp;
        let rewards = calculate_rewards(stake_account.last_claim_time, current_time, stake_account.nft_rarity);

        distribute_rewards(
            &mut ctx.accounts.rewards_vault,
            &mut ctx.accounts.user_token_account,
            rewards,
        )?;

        let seeds = &[
            b"vault",
            ctx.accounts.nft_mint.key().as_ref(),
            &[*ctx.bumps.get("vault_nft_account").unwrap()],
        ];
        let signer = [&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.vault_nft_account.to_account_info(),
                    to: ctx.accounts.user_nft_account.to_account_info(),
                    authority: ctx.accounts.vault_nft_account.to_account_info(),
                },
                &signer,
            ),
            1,
        )?;

        stake_account.owner = Pubkey::default();
        stake_account.nft_mint = Pubkey::default();
        stake_account.stake_start_time = 0;
        stake_account.last_claim_time = 0;

        Ok(())
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        let current_time = Clock::get()?.unix_timestamp;
        let rewards = calculate_rewards(stake_account.last_claim_time, current_time, stake_account.nft_rarity);

        distribute_rewards(
            &mut ctx.accounts.rewards_vault,
            &mut ctx.accounts.user_token_account,
            rewards,
        )?;

        stake_account.last_claim_time = current_time;

        Ok(())
    }
}

// ... (rest of the file with struct definitions)

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"stake", user.key().as_ref(), nft_mint.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,
    #[account(mut)]
    pub rewards_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub nft_mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub nft_mint: Pubkey,
    pub stake_start_time: i64,
    pub last_claim_time: i64,
    pub nft_rarity: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
}