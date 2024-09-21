use anchor_lang::prelude::*;

pub fn calculate_rewards(stake_start_time: i64, current_time: i64, nft_rarity: u8) -> u64 {
    let stake_duration = current_time - stake_start_time;
    let base_reward = stake_duration as u64 * 10; // 10 tokens per second
    let rarity_multiplier = match nft_rarity {
        0..=49 => 1,
        50..=79 => 2,
        80..=94 => 3,
        95..=100 => 5,
        _ => 1,
    };
    base_reward * rarity_multiplier
}

pub fn distribute_rewards(
    rewards_vault: &mut Account<TokenAccount>,
    user_token_account: &mut Account<TokenAccount>,
    amount: u64,
) -> Result<()> {
    if rewards_vault.amount < amount {
        return Err(ErrorCode::InsufficientRewardsBalance.into());
    }

    token::transfer(
        CpiContext::new(
            token_program.to_account_info(),
            token::Transfer {
                from: rewards_vault.to_account_info(),
                to: user_token_account.to_account_info(),
                authority: rewards_vault.to_account_info(),
            },
        ),
        amount,
    )?;

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient balance in rewards vault")]
    InsufficientRewardsBalance,
}