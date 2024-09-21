# Chad's DeFi Platform Context

- Solana-based DeFi platform for staking Chad's NFTs
- Uses Anchor framework for Solana program development
- Frontend built with SolidJS and SolidStart
- Implements NFT staking, unstaking, and rewards distribution
- Uses Yes Coin for rewards

Key components:
1. Solana program: `programs/chads_defi_platform/src/lib.rs`
2. Frontend: `chads-defi-frontend/src/routes/index.tsx`
3. Solana utility functions: `chads-defi-frontend/src/utils/solana.ts`
4. Rewards calculation: `programs/chads_defi_platform/src/rewards.rs`

Next steps:
1. Implement `fetchUnstakedNFTs` function
2. Complete `calculateTotalRewards` function
3. Add error handling and loading states
4. Implement Yes Coin integration for rewards
5. Add unit tests for Solana program and frontend
6. Implement governance features using Yes Coin