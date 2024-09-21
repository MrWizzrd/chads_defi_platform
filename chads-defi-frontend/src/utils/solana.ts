import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
import idl from "../../public/idl.json";
import { Metaplex } from "@metaplex-foundation/js";

const programID = new PublicKey(import.meta.env.VITE_PROGRAM_ID);

export async function fetchUnstakedNFTs(wallet: PublicKey, connection: Connection) {
  const metaplex = new Metaplex(connection);
  const nfts = await metaplex.nfts().findAllByOwner({ owner: wallet });

  const unstakedNFTs = await Promise.all(
    nfts.map(async (nft) => {
      const [stakeAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("stake"), wallet.toBuffer(), nft.mint.address.toBuffer()],
        programID
      );

      try {
        await program.account.stakeAccount.fetch(stakeAccount);
        return null; // NFT is staked
      } catch {
        return {
          mint: nft.mint.address,
          name: nft.name,
          image: nft.json?.image || "",
        };
      }
    })
  );

  return unstakedNFTs.filter((nft) => nft !== null);
}

export async function calculateTotalRewards(program: Program, wallet: PublicKey) {
  const stakedNFTs = await fetchStakedNFTs(program, wallet);
  const currentTime = Math.floor(Date.now() / 1000);

  const totalRewards = stakedNFTs.reduce((total, nft) => {
    const stakeDuration = currentTime - nft.stakeStartTime;
    const nftRewards = calculateRewards(stakeDuration, nft.rarity);
    return total + nftRewards;
  }, 0);

  return totalRewards;
}

function calculateRewards(stakeDuration: number, nftRarity: number) {
  const baseReward = stakeDuration * 10; // 10 tokens per second
  const rarityMultiplier = getRarityMultiplier(nftRarity);
  return baseReward * rarityMultiplier;
}

function getRarityMultiplier(rarity: number) {
  if (rarity >= 95) return 5;
  if (rarity >= 80) return 3;
  if (rarity >= 50) return 2;
  return 1;
}

export const getProgram = (wallet: any) => {
  const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL);
  const provider = new AnchorProvider(connection, wallet, {});
  return new Program(idl, programID, provider);
};


export const stakeNFT = async (program: Program, wallet: any, nftMint: PublicKey) => {
  const [stakeAccount] = await PublicKey.findProgramAddress(
    [Buffer.from("stake"), wallet.publicKey.toBuffer(), nftMint.toBuffer()],
    programID
  );

  const [vaultNftAccount] = await PublicKey.findProgramAddress(
    [Buffer.from("vault"), nftMint.toBuffer()],
    programID
  );

  await program.methods
    .stakeNft()
    .accounts({
      user: wallet.publicKey,
      stakeAccount,
      userNftAccount: await getAssociatedTokenAddress(nftMint, wallet.publicKey),
      vaultNftAccount,
      nftMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
    })
    .rpc();
};

export const unstakeNFT = async (program: Program, wallet: any, nftMint: PublicKey) => {
  const [stakeAccount] = await PublicKey.findProgramAddress(
    [Buffer.from("stake"), wallet.publicKey.toBuffer(), nftMint.toBuffer()],
    programID
  );

  const [vaultNftAccount] = await PublicKey.findProgramAddress(
    [Buffer.from("vault"), nftMint.toBuffer()],
    programID
  );

  await program.methods
    .unstakeNft()
    .accounts({
      user: wallet.publicKey,
      stakeAccount,
      userNftAccount: await getAssociatedTokenAddress(nftMint, wallet.publicKey),
      vaultNftAccount,
      nftMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
};

export const fetchStakedNFTs = async (program: Program, wallet: PublicKey) => {
  const stakeAccounts = await program.account.stakeAccount.all([
    {
      memcmp: {
        offset: 8, // Discriminator
        bytes: wallet.toBase58(),
      },
    },
  ]);

  return stakeAccounts.map(account => ({
    nftMint: account.account.nftMint,
    stakeStartTime: account.account.stakeStartTime,
  }));
};