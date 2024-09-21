import { createSignal, createEffect, Show } from "solid-js";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { getProgram, stakeNFT, unstakeNFT, claimRewards, fetchStakedNFTs, fetchUnstakedNFTs, calculateTotalRewards } from "../utils/solana";
import NFTGrid from "../components/NFTGrid";
import { NFT, StakedNFT } from "../types";
import ErrorBoundary from "../components/ErrorBoundary";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Home() {
  const [unstakedNFTs, setUnstakedNFTs] = createSignal<NFT[]>([]);
  const [stakedNFTs, setStakedNFTs] = createSignal<StakedNFT[]>([]);
  const [rewards, setRewards] = createSignal<number>(0);
  const [loading, setLoading] = createSignal<boolean>(false);
  const [error, setError] = createSignal<string | null>(null);
  const { publicKey, signTransaction, connected } = useWallet();
  const [program, setProgram] = createSignal(null);

  createEffect(() => {
    if (connected && publicKey) {
      const prog = getProgram({ publicKey, signTransaction });
      setProgram(prog);
      fetchData(); // Replace separate fetch calls with a single fetchData function
    }
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [unstaked, staked, rewardsAmount] = await Promise.all([
        fetchUnstakedNFTs(publicKey, program().provider.connection),
        fetchStakedNFTs(program(), publicKey),
        calculateTotalRewards(program(), publicKey)
      ]);
      setUnstakedNFTs(unstaked);
      setStakedNFTs(staked);
      setRewards(rewardsAmount);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async (nft: NFT) => {
    setLoading(true);
    setError(null);
    try {
      await stakeNFT(program(), { publicKey, signTransaction }, nft.mint);
      await fetchData();
    } catch (err) {
      console.error("Error staking NFT:", err);
      setError("Failed to stake NFT. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (nft: StakedNFT) => {
    setLoading(true);
    setError(null);
    try {
      await unstakeNFT(program(), { publicKey, signTransaction }, nft.mint);
      await fetchData();
    } catch (err) {
      console.error("Error unstaking NFT:", err);
      setError("Failed to unstake NFT. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    setLoading(true);
    setError(null);
    try {
      await claimRewards(program(), { publicKey, signTransaction });
      await fetchData();
    } catch (err) {
      console.error("Error claiming rewards:", err);
      setError("Failed to claim rewards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <main class="p-4">
        <h1 class="text-3xl font-bold mb-4">Chad's DeFi Platform</h1>
        <WalletMultiButton class="mb-4" />
        <Show when={error()}>
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Error:</strong>
            <span class="block sm:inline"> {error()}</span>
          </div>
        </Show>
        <Show when={loading()}>
          <LoadingSpinner />
        </Show>
        <Show when={connected && !loading()}>

        </Show>
    <main class="p-4">
      <h1 class="text-3xl font-bold mb-4">Chad's DeFi Platform</h1>
      <WalletMultiButton class="mb-4" />
      {connected && (
        <>
          <h2 class="text-2xl font-semibold mb-2">Your NFTs</h2>
          <NFTGrid nfts={unstakedNFTs()} onStake={handleStake} onUnstake={() => {}} isStaked={false} />
          
          <h2 class="text-2xl font-semibold mt-8 mb-2">Staked NFTs</h2>
          <NFTGrid nfts={stakedNFTs()} onStake={() => {}} onUnstake={handleUnstake} isStaked={true} />
          
          <div class="mt-8">
            <h2 class="text-2xl font-semibold mb-2">Your Rewards</h2>
            <p class="text-xl">{rewards()} YES</p>
            <button
              onClick={handleClaimRewards}
              class="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              Claim Rewards
            </button>
          </div>
        </>
      )}
      </Show>
    </main>
    </ErrorBoundary>
  );
}