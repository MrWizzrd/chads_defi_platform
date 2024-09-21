import { For } from 'solid-js';
import { NFT } from '../types';

interface NFTGridProps {
  nfts: NFT[];
  onStake: (nft: NFT) => void;
  onUnstake: (nft: NFT) => void;
  isStaked: boolean;
}

export default function NFTGrid(props: NFTGridProps) {
  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <For each={props.nfts}>
        {(nft) => (
          <div class="border p-4 rounded-lg shadow-md">
            <img src={nft.image} alt={nft.name} class="w-full h-48 object-cover mb-2 rounded" />
            <h3 class="font-bold">{nft.name}</h3>
            <button
              onClick={() => props.isStaked ? props.onUnstake(nft) : props.onStake(nft)}
              class="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              {props.isStaked ? 'Unstake' : 'Stake'}
            </button>
          </div>
        )}
      </For>
    </div>
  );
}