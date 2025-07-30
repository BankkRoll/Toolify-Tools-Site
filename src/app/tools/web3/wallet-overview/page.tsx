"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { ProcessingStatus } from "@/components/tools/processing-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Copy, ExternalLink, Search, Wallet } from "lucide-react";
import { m, useInView } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Interface for Solana account balance information
 */
interface AccountBalance {
  lamports: number;
  sol: number;
  usd?: number;
}

/**
 * Interface for token balance information
 */
interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  usdValue?: number;
}

/**
 * Interface for transaction history item
 */
interface TransactionHistory {
  signature: string;
  slot: number;
  blockTime: number;
  fee: number;
  status: string;
  type: string;
}

/**
 * Interface for portfolio analytics
 */
interface PortfolioAnalytics {
  totalValue: number;
  solBalance: number;
  tokenCount: number;
  transactionCount: number;
  lastActivity: number;
}

/**
 * Solana Wallet Portfolio Tool
 * Provides comprehensive wallet overview and analytics for Solana wallets
 */
export default function WalletOverviewPage() {
  const { publicKey, connected } = useWallet();
  const animationsEnabled = useAnimations();

  // Refs for animations
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.2 });
  const contentInView = useInView(contentRef, { once: true, amount: 0.2 });

  // State management
  const [customRpc, setCustomRpc] = useLocalStorage<string>(
    "solana-rpc",
    "https://api.mainnet-beta.solana.com",
  );
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivateData, setShowPrivateData] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Data state
  const [accountBalance, setAccountBalance] = useState<AccountBalance | null>(
    null,
  );
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<
    TransactionHistory[]
  >([]);
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [recentAddresses] = useLocalStorage<string[]>(
    "recent-wallet-addresses",
    [],
  );

  // Connection instance
  const connection = useMemo(
    () => new Connection(customRpc, "confirmed"),
    [customRpc],
  );

  // Motion variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";
  const MotionSection = animationsEnabled ? m.section : "section";

  /**
   * Fetch account balance for a given address
   */
  const fetchAccountBalance = useCallback(
    async (address: string) => {
      try {
        const pubKey = new PublicKey(address);
        const balance = await connection.getBalance(pubKey);

        setAccountBalance({
          lamports: balance,
          sol: balance / LAMPORTS_PER_SOL,
        });
      } catch (error) {
        console.error("Error fetching account balance:", error);
        toast.error("Failed to fetch account balance");
      }
    },
    [connection],
  );

  /**
   * Fetch token balances for a given address
   */
  const fetchTokenBalances = useCallback(
    async (address: string) => {
      try {
        const pubKey = new PublicKey(address);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          pubKey,
          {
            programId: new PublicKey(
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            ),
          },
        );

        const balances: TokenBalance[] = tokenAccounts.value.map((account) => {
          const accountInfo = account.account.data.parsed.info;
          return {
            mint: accountInfo.mint,
            symbol: accountInfo.tokenAmount.symbol || "Unknown",
            name: accountInfo.tokenAmount.name || "Unknown Token",
            balance: accountInfo.tokenAmount.uiAmount || 0,
            decimals: accountInfo.tokenAmount.decimals,
          };
        });

        setTokenBalances(balances);
      } catch (error) {
        console.error("Error fetching token balances:", error);
        toast.error("Failed to fetch token balances");
      }
    },
    [connection],
  );

  /**
   * Fetch transaction history for a given address
   */
  const fetchTransactionHistory = useCallback(
    async (address: string) => {
      try {
        const pubKey = new PublicKey(address);
        const signatures = await connection.getSignaturesForAddress(pubKey, {
          limit: 20,
        });

        const transactions: TransactionHistory[] = await Promise.all(
          signatures.map(async (sig) => {
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });

            return {
              signature: sig.signature,
              slot: sig.slot,
              blockTime: sig.blockTime || 0,
              fee: tx?.meta?.fee || 0,
              status: tx?.meta?.err ? "Failed" : "Success",
              type: "Transfer", // Simplified for demo
            };
          }),
        );

        setTransactionHistory(transactions);
      } catch (error) {
        console.error("Error fetching transaction history:", error);
        toast.error("Failed to fetch transaction history");
      }
    },
    [connection],
  );

  /**
   * Calculate portfolio analytics
   */
  const calculateAnalytics = useCallback(() => {
    if (!accountBalance || !tokenBalances || !transactionHistory) return;

    const totalValue =
      accountBalance.sol +
      tokenBalances.reduce((sum, token) => sum + (token.usdValue || 0), 0);

    setAnalytics({
      totalValue,
      solBalance: accountBalance.sol,
      tokenCount: tokenBalances.length,
      transactionCount: transactionHistory.length,
      lastActivity: transactionHistory[0]?.blockTime || 0,
    });
  }, [accountBalance, tokenBalances, transactionHistory]);

  /**
   * Load wallet data for a given address
   */
  const loadWalletData = useCallback(
    async (address: string) => {
      if (!address) return;

      setIsLoading(true);
      try {
        await Promise.all([
          fetchAccountBalance(address),
          fetchTokenBalances(address),
          fetchTransactionHistory(address),
        ]);

        // Add to recent addresses
        const updatedRecent = [
          address,
          ...recentAddresses.filter((addr) => addr !== address),
        ].slice(0, 10);
        localStorage.setItem(
          "recent-wallet-addresses",
          JSON.stringify(updatedRecent),
        );

        toast.success("Wallet data loaded successfully");
      } catch (error) {
        console.error("Error loading wallet data:", error);
        toast.error("Failed to load wallet data");
      } finally {
        setIsLoading(false);
      }
    },
    [
      fetchAccountBalance,
      fetchTokenBalances,
      fetchTransactionHistory,
      recentAddresses,
    ],
  );

  /**
   * Copy address to clipboard
   */
  const copyAddress = useCallback(async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy address");
    }
  }, []);

  /**
   * View address on Solana Explorer
   */
  const viewOnExplorer = useCallback((address: string) => {
    window.open(`https://explorer.solana.com/address/${address}`, "_blank");
  }, []);

  // Auto-load connected wallet data
  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toBase58();
      setWalletAddress(address);
      loadWalletData(address);
    }
  }, [connected, publicKey, loadWalletData]);

  // Calculate analytics when data changes
  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  return (
    <ToolLayout toolId="web3-wallet-overview">
      <MotionSection
        ref={headerRef}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={
          animationsEnabled ? (headerInView ? "visible" : "hidden") : undefined
        }
        variants={animationsEnabled ? sectionVariants : undefined}
        className="space-y-6"
      >
        <MotionDiv
          variants={animationsEnabled ? itemVariants : undefined}
          className="flex items-center gap-4"
        >
          <div className="flex-1">
            <Label htmlFor="wallet-address">Wallet Address</Label>
            <div className="flex gap-2">
              <Input
                id="wallet-address"
                placeholder="Enter Solana wallet address..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="font-mono"
              />
              <Button
                onClick={() => loadWalletData(walletAddress)}
                disabled={!walletAddress || isLoading}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="w-64">
            <Label htmlFor="rpc-endpoint">RPC Endpoint</Label>
            <Input
              id="rpc-endpoint"
              value={customRpc}
              onChange={(e) => setCustomRpc(e.target.value)}
              placeholder="RPC endpoint..."
            />
          </div>
        </MotionDiv>

        {recentAddresses.length > 0 && (
          <MotionDiv
            variants={animationsEnabled ? itemVariants : undefined}
            className="flex items-center gap-2"
          >
            <span className="text-sm text-muted-foreground">Recent:</span>
            {recentAddresses.slice(0, 5).map((address) => (
              <Button
                key={address}
                variant="outline"
                size="sm"
                onClick={() => {
                  setWalletAddress(address);
                  loadWalletData(address);
                }}
                className="font-mono text-xs"
              >
                {address.slice(0, 4)}...{address.slice(-4)}
              </Button>
            ))}
          </MotionDiv>
        )}
      </MotionSection>

      <ProcessingStatus
        isProcessing={isLoading}
        isComplete={false}
        error={null}
      />

      <MotionDiv
        ref={contentRef}
        variants={animationsEnabled ? staggerContainer : undefined}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={
          animationsEnabled ? (contentInView ? "visible" : "hidden") : undefined
        }
        className="space-y-6"
      >
        {accountBalance && (
          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Portfolio Overview
                </CardTitle>
                <CardDescription>
                  {walletAddress && (
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{walletAddress}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyAddress(walletAddress)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewOnExplorer(walletAddress)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="tokens">Tokens</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            SOL Balance
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {accountBalance.sol.toFixed(4)} SOL
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {accountBalance.lamports.toLocaleString()} lamports
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Token Count
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {tokenBalances.length}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            SPL tokens
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Recent Activity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {transactionHistory.length}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            transactions
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="tokens" className="space-y-4">
                    <div className="space-y-2">
                      {tokenBalances.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No SPL tokens found
                        </p>
                      ) : (
                        tokenBalances.map((token) => (
                          <Card key={token.mint}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">
                                    {token.symbol}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {token.name}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">
                                    {token.balance.toFixed(token.decimals)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {token.mint.slice(0, 8)}...
                                    {token.mint.slice(-8)}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="transactions" className="space-y-4">
                    <div className="space-y-2">
                      {transactionHistory.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No transactions found
                        </p>
                      ) : (
                        transactionHistory.map((tx) => (
                          <Card key={tx.signature}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-mono text-sm">
                                    {tx.signature.slice(0, 8)}...
                                    {tx.signature.slice(-8)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(
                                      tx.blockTime * 1000,
                                    ).toLocaleString()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge
                                    variant={
                                      tx.status === "Success"
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {tx.status}
                                  </Badge>
                                  <div className="text-sm text-muted-foreground">
                                    Fee: {tx.fee} lamports
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-4">
                    {analytics && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">
                              Portfolio Value
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {analytics.totalValue.toFixed(4)} SOL
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">
                              Activity Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Total Transactions:</span>
                                <span className="font-medium">
                                  {analytics.transactionCount}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Token Count:</span>
                                <span className="font-medium">
                                  {analytics.tokenCount}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Last Activity:</span>
                                <span className="font-medium">
                                  {analytics.lastActivity
                                    ? new Date(
                                        analytics.lastActivity * 1000,
                                      ).toLocaleDateString()
                                    : "Never"}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        <ActionButtons
          onCopy={() => walletAddress && copyAddress(walletAddress)}
          onDownload={() => {
            const data = {
              address: walletAddress,
              balance: accountBalance,
              tokens: tokenBalances,
              transactions: transactionHistory,
              analytics,
              timestamp: new Date().toISOString(),
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `wallet-portfolio-${walletAddress.slice(0, 8)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Portfolio data downloaded");
          }}
          copyText={walletAddress}
          downloadData={
            accountBalance
              ? JSON.stringify(
                  {
                    address: walletAddress,
                    balance: accountBalance,
                    tokens: tokenBalances,
                    transactions: transactionHistory,
                    analytics,
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2,
                )
              : undefined
          }
          downloadFilename={
            accountBalance
              ? `wallet-portfolio-${walletAddress.slice(0, 8)}.json`
              : undefined
          }
          downloadMimeType="application/json"
        />
      </MotionDiv>
    </ToolLayout>
  );
}
