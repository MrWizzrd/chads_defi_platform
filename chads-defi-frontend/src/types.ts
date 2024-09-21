import { PublicKey } from '@solana/web3.js';

export interface NFT {
  mint: PublicKey;
  name: string;
  image: string;
}

export interface StakedNFT extends NFT {
  stakeStartTime: number;
}