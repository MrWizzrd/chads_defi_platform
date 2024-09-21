import { Suspense } from "solid-js";
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from "solid-start";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function Root() {
  const wallets = [new PhantomWalletAdapter()];

  return (
    <Html lang="en">
      <Head>
        <Title>Chad's DeFi Platform</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <ConnectionProvider endpoint="https://api.devnet.solana.com">
              <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                  <Routes>
                    <FileRoutes />
                  </Routes>
                </WalletModalProvider>
              </WalletProvider>
            </ConnectionProvider>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}