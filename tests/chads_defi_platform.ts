import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ChadsDeFiPlatform } from "../target/types/chads_defi_platform";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { expect } from "chai";

describe("chads_defi_platform", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ChadsDeFiPlatform as Program<ChadsDeFiPlatform>;

  let nftMint: PublicKey;
  let userNftAccount: PublicKey;
  let vaultNftAccount: PublicKey;
  let stakeAccount: PublicKey;

  it("Initializes the program", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });

  it("Creates an NFT", async () => {
    const nftAuthority = Keypair.generate();
    await provider.connection.requestAirdrop(nftAuthority.publicKey, 1000000000);
    nftMint = await createMint(
      provider.connection,
      nftAuthority,
      nftAuthority.publicKey,
      null,
      0
    );

    userNftAccount = await createAccount(
      provider.connection,
      nftAuthority,
      nftMint,
      provider.wallet.publicKey
    );

    await mintTo(
      provider.connection,
      nftAuthority,
      nftMint,
      userNftAccount,
      nftAuthority,
      1
    );
  });

  it("Stakes an NFT", async () => {
    [vaultNftAccount] = await PublicKey.findProgramAddress(
      [Buffer.from("vault"), nftMint.toBuffer()],
      program.programId
    );

    [stakeAccount] = await PublicKey.findProgramAddress(
      [
        Buffer.from("stake"),
        provider.wallet.publicKey.toBuffer(),
        nftMint.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .stakeNft()
      .accounts({
        user: provider.wallet.publicKey,
        stakeAccount: stakeAccount,
        userNftAccount: userNftAccount,
        vaultNftAccount: vaultNftAccount,
        nftMint: nftMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const stakeAccountInfo = await program.account.stakeAccount.fetch(stakeAccount);
    expect(stakeAccountInfo.owner.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(stakeAccountInfo.nftMint.toString()).to.equal(nftMint.toString());
  });

  it("Unstakes an NFT", async () => {
    await program.methods
      .unstakeNft()
      .accounts({
        user: provider.wallet.publicKey,
        stakeAccount: stakeAccount,
        userNftAccount: userNftAccount,
        vaultNftAccount: vaultNftAccount,
        nftMint: nftMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const stakeAccountInfo = await program.account.stakeAccount.fetch(stakeAccount);
    expect(stakeAccountInfo.owner.toString()).to.equal(PublicKey.default.toString());
    expect(stakeAccountInfo.nftMint.toString()).to.equal(PublicKey.default.toString());
  });
});