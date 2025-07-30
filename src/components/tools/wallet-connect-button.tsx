"use client";

import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { ChevronDown, LogOut, Wallet } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { WalletList } from "@/components/tools/wallet-list";

export const WalletConnectButton = () => {
  const {
    wallets,
    select,
    connect,
    disconnect,
    connected,
    connecting,
    publicKey,
    wallet,
  } = useWallet();
  const [connectingWallet, setConnectingWallet] = useState<WalletName | null>(
    null,
  );
  const [isCredenzaOpen, setIsCredenzaOpen] = useState(false);

  const handleSelectAndConnect = useCallback(
    async (walletName: WalletName) => {
      if (connecting) return;
      setConnectingWallet(walletName);
      try {
        select(walletName);
        // The `useWallet` hook will automatically handle the connection
        // after a wallet is selected. We just need to wait for `connected`.
      } catch (error) {
        console.error("Wallet selection error", error);
        setConnectingWallet(null);
      }
    },
    [connecting, select],
  );

  if (connected && publicKey && wallet) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <img
              src={wallet.adapter.icon}
              alt={wallet.adapter.name}
              className="w-5 h-5 mr-2"
            />
            <span>
              {publicKey.toBase58().slice(0, 4)}...
              {publicKey.toBase58().slice(-4)}
            </span>
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{wallet.adapter.name} Connected</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => disconnect()}>
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Credenza open={isCredenzaOpen} onOpenChange={setIsCredenzaOpen}>
      <CredenzaTrigger asChild>
        <Button>
          <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Connect a Wallet</CredenzaTitle>
          <CredenzaDescription>
            Select a wallet to continue. Don't have one? We'll help you get set
            up.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <div className="flex h-[50vh] flex-col gap-2 overflow-y-auto px-1">
            <WalletList
              onSelectWallet={handleSelectAndConnect}
              connectingWallet={connectingWallet}
              onClose={() => setIsCredenzaOpen(false)}
            />
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
};