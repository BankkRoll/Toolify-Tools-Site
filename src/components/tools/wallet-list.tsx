"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { WalletName } from "@solana/wallet-adapter-base";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import type { Wallet } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ChevronDown, Globe, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

// --- Constants ---
const POPULAR_WALLETS: WalletName[] = [
  "Phantom" as WalletName,
  "Solflare" as WalletName,
  "Coinbase Wallet" as WalletName,
  "Ledger" as WalletName,
  "Torus" as WalletName,
];

// --- Sub-components ---

const WalletRow = ({
  wallet,
  isConnecting,
  isDisabled,
  onSelectWallet,
}: {
  wallet: Wallet;
  isConnecting: boolean;
  isDisabled: boolean;
  onSelectWallet: (walletName: WalletName) => void;
}) => {
  const isDetected =
    wallet.readyState === WalletReadyState.Installed ||
    wallet.readyState === WalletReadyState.Loadable;

  const handleClick = () => {
    if (isDetected) {
      onSelectWallet(wallet.adapter.name);
    }
  };

  const content = (
    <>
      <img
        src={wallet.adapter.icon}
        alt={wallet.adapter.name}
        className="mr-4 h-6 w-6"
      />
      {wallet.adapter.name}
      {isConnecting && <Loader2 className="ml-auto h-5 w-5 animate-spin" />}
      {!isDetected && (
        <Globe className="w-4 h-4 ml-auto text-muted-foreground" />
      )}
    </>
  );

  if (isDetected) {
    return (
      <Button
        disabled={isConnecting || isDisabled}
        onClick={handleClick}
        variant="outline"
        className="w-full justify-start py-6 text-base"
      >
        {content}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      className="w-full justify-start py-6 text-base"
      asChild
    >
      <a href={wallet.adapter.url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    </Button>
  );
};

// --- Main Component ---

interface WalletListProps {
  onSelectWallet: (walletName: WalletName) => void;
  connectingWallet?: WalletName | null;
  onClose?: () => void;
}

export const WalletList = ({
  onSelectWallet,
  connectingWallet = null,
  onClose,
}: WalletListProps) => {
  const { wallets } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (walletName: WalletName) => {
    onSelectWallet(walletName);
    onClose?.();
  };

  const { detected, popular, other } = useMemo(() => {
    const detectedWallets: Wallet[] = [];
    const popularWallets: Wallet[] = [];
    const otherWallets: Wallet[] = [];
    const processedNames = new Set<WalletName>();

    for (const w of wallets) {
      if (
        w.readyState === WalletReadyState.Installed ||
        w.readyState === WalletReadyState.Loadable
      ) {
        detectedWallets.push(w);
        processedNames.add(w.adapter.name);
      }
    }

    for (const name of POPULAR_WALLETS) {
      if (processedNames.has(name)) continue;
      const wallet = wallets.find((w) => w.adapter.name === name);
      if (wallet) {
        popularWallets.push(wallet);
        processedNames.add(wallet.adapter.name);
      }
    }

    for (const w of wallets) {
      if (!processedNames.has(w.adapter.name)) {
        otherWallets.push(w);
      }
    }

    return {
      detected: detectedWallets,
      popular: popularWallets,
      other: otherWallets,
    };
  }, [wallets]);

  const renderWalletList = (list: Wallet[]) =>
    list.map((w) => (
      <WalletRow
        key={w.adapter.name}
        wallet={w}
        isConnecting={connectingWallet === w.adapter.name}
        isDisabled={!!connectingWallet && connectingWallet !== w.adapter.name}
        onSelectWallet={handleSelect}
      />
    ));

  return (
    <div className="w-full space-y-2">
      {detected.length > 0 && (
        <div className="space-y-2">{renderWalletList(detected)}</div>
      )}

      {detected.length === 0 && popular.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No wallets detected. Please install a wallet to continue.
        </p>
      )}

      {popular.length > 0 && (
        <>
          <div className="flex items-center gap-4 py-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">Popular</span>
            <Separator className="flex-1" />
          </div>
          <div className="space-y-2">{renderWalletList(popular)}</div>
        </>
      )}

      {other.length > 0 && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center gap-4 py-2">
            <Separator className="flex-1" />
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="text-xs text-muted-foreground px-2 py-1 h-auto"
              >
                {isOpen ? "Show Less" : `Show ${other.length} More`}
                <ChevronDown
                  className={cn(
                    "ml-1 h-3 w-3 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <Separator className="flex-1" />
          </div>
          <CollapsibleContent className="space-y-2">
            {renderWalletList(other)}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};