/* @ts-nocheck */
'use client';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  AlphaWalletAdapter,
  AvanaWalletAdapter,
  BitKeepWalletAdapter,
  BitpieWalletAdapter,
  CloverWalletAdapter,
  Coin98WalletAdapter,
  CoinbaseWalletAdapter,
  CoinhubWalletAdapter,
  HuobiWalletAdapter,
  HyperPayWalletAdapter,
  KrystalWalletAdapter,
  LedgerWalletAdapter,
  MathWalletAdapter,
  NekoWalletAdapter,
  NightlyWalletAdapter,
  NufiWalletAdapter,
  OntoWalletAdapter,
  PhantomWalletAdapter,
  SafePalWalletAdapter,
  SaifuWalletAdapter,
  SkyWalletAdapter,
  SolflareWalletAdapter,
  SolongWalletAdapter,
  SpotWalletAdapter,
  TokenaryWalletAdapter,
  TokenPocketWalletAdapter,
  TrezorWalletAdapter,
  TrustWalletAdapter,
  XDEFIWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

export const WalletContextProvider = ({ children }: { children: React.ReactNode }) => {
  const network = WalletAdapterNetwork.Mainnet;
  const heliusRpcUrl =
    'https://mainnet.helius-rpc.com/?api-key=' + process.env.NEXT_PUBLIC_HELIUS_API_KEY;
  const endpoint = useMemo(() => (heliusRpcUrl as string) || clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new LedgerWalletAdapter(),
      new TrustWalletAdapter(),
      new AlphaWalletAdapter(),
      new AvanaWalletAdapter(),
      new BitKeepWalletAdapter(),
      new BitpieWalletAdapter(),
      new CloverWalletAdapter(),
      new Coin98WalletAdapter(),
      new CoinhubWalletAdapter(),
      new HuobiWalletAdapter(),
      new HyperPayWalletAdapter(),
      new KrystalWalletAdapter(),
      new MathWalletAdapter(),
      new NekoWalletAdapter(),
      new NightlyWalletAdapter(),
      new NufiWalletAdapter(),
      new OntoWalletAdapter(),
      new SafePalWalletAdapter(),
      new SaifuWalletAdapter(),
      new SkyWalletAdapter(),
      new SolongWalletAdapter(),
      new SpotWalletAdapter(),
      new TokenaryWalletAdapter(),
      new TokenPocketWalletAdapter(),
      new TrezorWalletAdapter(),
      new XDEFIWalletAdapter(),
    ],
    [network],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};
