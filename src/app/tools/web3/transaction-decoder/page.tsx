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
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Search,
} from "lucide-react";
import { m, useInView } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Interface for decoded transaction information
 */
interface DecodedTransaction {
  signature: string;
  slot: number;
  blockTime: number;
  fee: number;
  status: "Success" | "Failed";
  accounts: string[];
  instructions: DecodedInstruction[];
  logs: string[];
  meta: any;
  version: number;
}

/**
 * Interface for decoded instruction
 */
interface DecodedInstruction {
  programId: string;
  programName?: string;
  accounts: string[];
  data: string;
  parsed?: any;
}

/**
 * Interface for transaction search history
 */
interface TransactionHistory {
  signature: string;
  timestamp: number;
  status: string;
}

/**
 * Solana Transaction Decoder
 * Decode and analyze Solana transactions
 */
export default function TransactionDecoderPage() {
  const { publicKey, connected } = useWallet();
  const animationsEnabled = useAnimations();

  // Refs for animations
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.2 });
  const contentInView = useInView(contentRef, { once: true, amount: 0.2 });

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState("");
  const [decodedTransaction, setDecodedTransaction] =
    useState<DecodedTransaction | null>(null);
  const [customRpc, setCustomRpc] = useLocalStorage<string>(
    "solana-rpc",
    "https://api.mainnet-beta.solana.com",
  );
  const [showRawData, setShowRawData] = useState(false);

  // Search history
  const [searchHistory] = useLocalStorage<TransactionHistory[]>(
    "tx-decoder-history",
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
   * Decode a transaction signature
   */
  const decodeTransaction = useCallback(
    async (signature: string) => {
      if (!signature.trim()) return;

      setIsLoading(true);
      try {
        const tx = await connection.getTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
          toast.error("Transaction not found");
          return;
        }

        // Handle both legacy and versioned transactions
        const message = tx.transaction.message;
        let staticAccountKeys: PublicKey[];
        let instructions: any[];

        if ("getAccountKeys" in message) {
          // Versioned transaction (MessageV0)
          const accountKeys = message.getAccountKeys();
          staticAccountKeys = accountKeys.staticAccountKeys;
          instructions = (message as any).compiledInstructions || [];
        } else {
          // Legacy transaction (Message)
          staticAccountKeys = (message as any).accountKeys;
          instructions = (message as any).instructions || [];
        }

        const decoded: DecodedTransaction = {
          signature: tx.transaction.signatures[0],
          slot: tx.slot,
          blockTime: tx.blockTime || 0,
          fee: tx.meta?.fee || 0,
          status: tx.meta?.err ? "Failed" : "Success",
          accounts: staticAccountKeys.map((key: PublicKey) => key.toBase58()),
          instructions: instructions.map((instruction, index) => {
            const programId =
              staticAccountKeys[instruction.programIdIndex].toBase58();
            const accountIndexes =
              instruction.accountKeyIndexes || instruction.accounts || [];
            return {
              programId,
              programName: getProgramName(programId),
              accounts: accountIndexes.map((accIndex: number) =>
                staticAccountKeys[accIndex].toBase58(),
              ),
              data:
                typeof instruction.data === "string"
                  ? instruction.data
                  : Buffer.from(instruction.data).toString("base64"),
              parsed: tx.meta?.innerInstructions?.[index] || null,
            };
          }),
          logs: tx.meta?.logMessages || [],
          meta: tx.meta,
          version: typeof tx.version === "number" ? tx.version : 0,
        };

        setDecodedTransaction(decoded);

        // Add to search history
        const historyItem: TransactionHistory = {
          signature,
          timestamp: Date.now(),
          status: decoded.status,
        };
        const updatedHistory = [
          historyItem,
          ...searchHistory.filter((item) => item.signature !== signature),
        ].slice(0, 20);
        localStorage.setItem(
          "tx-decoder-history",
          JSON.stringify(updatedHistory),
        );

        toast.success("Transaction decoded successfully");
      } catch (error) {
        console.error("Decode error:", error);
        toast.error("Failed to decode transaction");
      } finally {
        setIsLoading(false);
      }
    },
    [connection, searchHistory],
  );

  /**
   * Get program name from program ID
   */
  const getProgramName = useCallback((programId: string): string => {
    const programNames: { [key: string]: string } = {
      "11111111111111111111111111111111": "System Program",
      TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: "Token Program",
      ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL: "Associated Token Account",
      So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo: "Solend Program",
      "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM": "Orca Swap",
      "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium Swap",
      whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: "Whirlpool",
    };
    return programNames[programId] || "Unknown Program";
  }, []);

  /**
   * Copy signature to clipboard
   */
  const copySignature = useCallback(async (signature: string) => {
    try {
      await navigator.clipboard.writeText(signature);
      toast.success("Signature copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy signature");
    }
  }, []);

  /**
   * Copy decoded data to clipboard
   */
  const copyDecodedData = useCallback(async () => {
    if (!decodedTransaction) return;

    try {
      const data = JSON.stringify(decodedTransaction, null, 2);
      await navigator.clipboard.writeText(data);
      toast.success("Decoded data copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy decoded data");
    }
  }, [decodedTransaction]);

  /**
   * Download decoded transaction as JSON
   */
  const downloadDecodedData = useCallback(() => {
    if (!decodedTransaction) return;

    const data = {
      ...decodedTransaction,
      decodedBy: "Toolify Transaction Decoder",
      timestamp: Date.now(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaction-${decodedTransaction.signature.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Transaction data downloaded");
  }, [decodedTransaction]);

  /**
   * View transaction on Solana Explorer
   */
  const viewOnExplorer = useCallback((signature: string) => {
    window.open(`https://explorer.solana.com/tx/${signature}`, "_blank");
  }, []);

  /**
   * Format timestamp
   */
  const formatTimestamp = useCallback((timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  }, []);

  /**
   * Format lamports to SOL
   */
  const formatLamports = useCallback((lamports: number) => {
    return (lamports / 1000000000).toFixed(9);
  }, []);

  return (
    <ToolLayout toolId="web3-transaction-decoder">
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
            <Label htmlFor="transaction-signature">Transaction Signature</Label>
            <div className="flex gap-2">
              <Input
                id="transaction-signature"
                placeholder="Enter transaction signature..."
                value={transactionSignature}
                onChange={(e) => setTransactionSignature(e.target.value)}
                className="font-mono"
              />
              <Button
                onClick={() => decodeTransaction(transactionSignature)}
                disabled={!transactionSignature.trim() || isLoading}
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

        {searchHistory.length > 0 && (
          <MotionDiv
            variants={animationsEnabled ? itemVariants : undefined}
            className="flex items-center gap-2"
          >
            <span className="text-sm text-muted-foreground">Recent:</span>
            {searchHistory.slice(0, 5).map((item) => (
              <Button
                key={item.signature}
                variant="outline"
                size="sm"
                onClick={() => {
                  setTransactionSignature(item.signature);
                  decodeTransaction(item.signature);
                }}
                className="font-mono text-xs"
              >
                {item.signature.slice(0, 8)}...{item.signature.slice(-8)}
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
        {decodedTransaction && (
          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Transaction Details
                </CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {decodedTransaction.signature}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copySignature(decodedTransaction.signature)
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        viewOnExplorer(decodedTransaction.signature)
                      }
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="instructions">Instructions</TabsTrigger>
                    <TabsTrigger value="accounts">Accounts</TabsTrigger>
                    <TabsTrigger value="raw">Raw Data</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Transaction Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Badge
                            variant={
                              decodedTransaction.status === "Success"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {decodedTransaction.status}
                          </Badge>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Fee
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg font-bold">
                            {formatLamports(decodedTransaction.fee)} SOL
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {decodedTransaction.fee} lamports
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Block Time
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm">
                            {formatTimestamp(decodedTransaction.blockTime)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Slot: {decodedTransaction.slot}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Instructions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg font-bold">
                            {decodedTransaction.instructions.length}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            instructions
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="instructions" className="space-y-4">
                    <div className="space-y-2">
                      {decodedTransaction.instructions.map(
                        (instruction, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      Instruction {index + 1}
                                    </span>
                                    <Badge variant="outline">
                                      {instruction.programName}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {instruction.programId.slice(0, 8)}...
                                    {instruction.programId.slice(-8)}
                                  </span>
                                </div>

                                <div>
                                  <Label className="text-xs text-muted-foreground">
                                    Accounts
                                  </Label>
                                  <div className="space-y-1 mt-1">
                                    {instruction.accounts.map(
                                      (account, accIndex) => (
                                        <div
                                          key={accIndex}
                                          className="flex items-center gap-2"
                                        >
                                          <span className="text-xs text-muted-foreground w-4">
                                            {accIndex}
                                          </span>
                                          <code className="text-xs font-mono">
                                            {account.slice(0, 8)}...
                                            {account.slice(-8)}
                                          </code>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-xs text-muted-foreground">
                                    Data
                                  </Label>
                                  <code className="block text-xs font-mono bg-muted p-2 rounded mt-1">
                                    {instruction.data}
                                  </code>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ),
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="accounts" className="space-y-4">
                    <div className="space-y-2">
                      {decodedTransaction.accounts.map((account, index) => (
                        <Card key={index}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  Account {index}
                                </span>
                                <code className="text-xs font-mono">
                                  {account}
                                </code>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copySignature(account)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="raw" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Transaction Logs</Label>
                        <Textarea
                          value={decodedTransaction.logs.join("\n")}
                          readOnly
                          className="font-mono text-xs h-32"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <Label>Raw Transaction Data</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowRawData(!showRawData)}
                          >
                            {showRawData ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        {showRawData && (
                          <Textarea
                            value={JSON.stringify(
                              decodedTransaction.meta,
                              null,
                              2,
                            )}
                            readOnly
                            className="font-mono text-xs h-64"
                          />
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        <ActionButtons
          onCopy={() => decodedTransaction && copyDecodedData()}
          onDownload={() => decodedTransaction && downloadDecodedData()}
          copyText="Copy Decoded Data"
          downloadData={
            decodedTransaction
              ? JSON.stringify(
                  {
                    ...decodedTransaction,
                    decodedBy: "Toolify Transaction Decoder",
                    timestamp: Date.now(),
                  },
                  null,
                  2,
                )
              : undefined
          }
          downloadFilename={
            decodedTransaction
              ? `transaction-${decodedTransaction.signature.slice(0, 8)}.json`
              : undefined
          }
          downloadMimeType="application/json"
        />
      </MotionDiv>
    </ToolLayout>
  );
}
