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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  CheckCircle,
  Copy,
  ExternalLink,
  FileText,
  Search,
  Settings,
  Sparkles,
  XCircle,
} from "lucide-react";
import { m, useInView } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Interface for address validation result
 */
interface AddressValidationResult {
  address: string;
  isValid: boolean;
  type: "PublicKey" | "Program" | "Invalid";
  checksum: string;
  timestamp: number;
  balance?: number;
  owner?: string;
  executable?: boolean;
  lamports?: number;
  rentEpoch?: number;
  data?: any;
}

/**
 * Interface for validation settings
 */
interface ValidationSettings {
  checkBalance: boolean;
  checkAccountInfo: boolean;
  includeChecksum: boolean;
  batchMode: boolean;
}

/**
 * Solana Address Validator
 * Validate Solana addresses and check account information
 */
export default function AddressValidatorPage() {
  const { publicKey, connected } = useWallet();
  const animationsEnabled = useAnimations();

  // Refs for animations
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.2 });
  const contentInView = useInView(contentRef, { once: true, amount: 0.2 });

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [batchInput, setBatchInput] = useState("");
  const [validationResults, setValidationResults] = useState<
    AddressValidationResult[]
  >([]);
  const [customRpc, setCustomRpc] = useLocalStorage<string>(
    "solana-rpc",
    "https://api.mainnet-beta.solana.com",
  );
  const [activeTab, setActiveTab] = useState("single");

  // Settings
  const [settings, setSettings] = useLocalStorage<ValidationSettings>(
    "address-validator-settings",
    {
      checkBalance: true,
      checkAccountInfo: true,
      includeChecksum: true,
      batchMode: false,
    },
  );

  // Validation history
  const [validationHistory] = useLocalStorage<AddressValidationResult[]>(
    "address-validation-history",
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
   * Validate a single Solana address
   */
  const validateAddress = useCallback(
    async (address: string): Promise<AddressValidationResult> => {
      try {
        const pubKey = new PublicKey(address);
        const result: AddressValidationResult = {
          address,
          isValid: true,
          type: "PublicKey",
          checksum: pubKey.toBase58(),
          timestamp: Date.now(),
        };

        // Check account info if enabled
        if (settings.checkAccountInfo) {
          try {
            const accountInfo = await connection.getAccountInfo(pubKey);
            if (accountInfo) {
              result.balance = accountInfo.lamports;
              result.owner = accountInfo.owner.toBase58();
              result.executable = accountInfo.executable;
              result.lamports = accountInfo.lamports;
              result.rentEpoch = accountInfo.rentEpoch;
              result.data = accountInfo.data;
            }
          } catch (error) {
            // Account might not exist, which is fine
          }
        }

        // Check balance if enabled
        if (settings.checkBalance) {
          try {
            const balance = await connection.getBalance(pubKey);
            result.balance = balance;
          } catch (error) {
            // Balance check failed
          }
        }

        return result;
      } catch (error) {
        return {
          address,
          isValid: false,
          type: "Invalid",
          checksum: "",
          timestamp: Date.now(),
        };
      }
    },
    [connection, settings],
  );

  /**
   * Validate a single address
   */
  const validateSingleAddress = useCallback(async () => {
    if (!addressInput.trim()) return;

    setIsLoading(true);
    try {
      const result = await validateAddress(addressInput.trim());
      setValidationResults([result]);

      // Add to history
      const updatedHistory = [
        result,
        ...validationHistory.filter((item) => item.address !== result.address),
      ].slice(0, 50);
      localStorage.setItem(
        "address-validation-history",
        JSON.stringify(updatedHistory),
      );

      toast.success(result.isValid ? "Address is valid" : "Address is invalid");
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Validation failed");
    } finally {
      setIsLoading(false);
    }
  }, [addressInput, validateAddress, validationHistory]);

  /**
   * Validate multiple addresses
   */
  const validateBatchAddresses = useCallback(async () => {
    if (!batchInput.trim()) return;

    const addresses = batchInput
      .split("\n")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);

    if (addresses.length === 0) return;

    setIsLoading(true);
    try {
      const results = await Promise.all(
        addresses.map((addr) => validateAddress(addr)),
      );

      setValidationResults(results);

      // Add to history
      const updatedHistory = [...results, ...validationHistory].slice(0, 100);
      localStorage.setItem(
        "address-validation-history",
        JSON.stringify(updatedHistory),
      );

      const validCount = results.filter((r) => r.isValid).length;
      toast.success(
        `Validated ${results.length} addresses (${validCount} valid)`,
      );
    } catch (error) {
      console.error("Batch validation error:", error);
      toast.error("Batch validation failed");
    } finally {
      setIsLoading(false);
    }
  }, [batchInput, validateAddress, validationHistory]);

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
   * Copy validation results to clipboard
   */
  const copyResults = useCallback(async () => {
    try {
      const data = validationResults.map((result) => ({
        address: result.address,
        isValid: result.isValid,
        type: result.type,
        balance: result.balance,
        owner: result.owner,
      }));
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast.success("Results copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy results");
    }
  }, [validationResults]);

  /**
   * Download validation results as JSON
   */
  const downloadResults = useCallback(() => {
    const data = {
      results: validationResults,
      settings,
      timestamp: Date.now(),
      validatedBy: "Toolify Address Validator",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `address-validation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Validation results downloaded");
  }, [validationResults, settings]);

  /**
   * View address on Solana Explorer
   */
  const viewOnExplorer = useCallback((address: string) => {
    window.open(`https://explorer.solana.com/address/${address}`, "_blank");
  }, []);

  /**
   * Format lamports to SOL
   */
  const formatLamports = useCallback((lamports: number) => {
    return (lamports / 1000000000).toFixed(9);
  }, []);

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setValidationResults([]);
    toast.success("Results cleared");
  }, []);

  // Auto-fill connected wallet address
  useEffect(() => {
    if (connected && publicKey && !addressInput) {
      setAddressInput(publicKey.toBase58());
    }
  }, [connected, publicKey, addressInput]);

  return (
    <ToolLayout toolId="web3-address-validator">
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
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Validation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="check-balance">Check Balance</Label>
                  <Switch
                    id="check-balance"
                    checked={settings.checkBalance}
                    onCheckedChange={(checked: boolean) =>
                      setSettings((prev) => ({
                        ...prev,
                        checkBalance: checked,
                      }))
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="check-account">Check Account Info</Label>
                  <Switch
                    id="check-account"
                    checked={settings.checkAccountInfo}
                    onCheckedChange={(checked: boolean) =>
                      setSettings((prev) => ({
                        ...prev,
                        checkAccountInfo: checked,
                      }))
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-checksum">Include Checksum</Label>
                  <Switch
                    id="include-checksum"
                    checked={settings.includeChecksum}
                    onCheckedChange={(checked: boolean) =>
                      setSettings((prev) => ({
                        ...prev,
                        includeChecksum: checked,
                      }))
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                RPC Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rpc-endpoint">RPC Endpoint</Label>
                <Input
                  id="rpc-endpoint"
                  value={customRpc}
                  onChange={(e) => setCustomRpc(e.target.value)}
                  placeholder="RPC endpoint..."
                  disabled={isLoading}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Validated:</span>
                  <Badge variant="outline">{validationResults.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">In History:</span>
                  <Badge variant="outline">{validationHistory.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>
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
        <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Address Input
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="single">Single Address</TabsTrigger>
                  <TabsTrigger value="batch">Batch Validation</TabsTrigger>
                </TabsList>

                <TabsContent value="single" className="space-y-4">
                  <div>
                    <Label htmlFor="single-address">Address</Label>
                    <div className="flex gap-2">
                      <Input
                        id="single-address"
                        placeholder="Enter Solana address..."
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        className="font-mono"
                      />
                      <Button
                        onClick={validateSingleAddress}
                        disabled={!addressInput.trim() || isLoading}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="batch" className="space-y-4">
                  <div>
                    <Label htmlFor="batch-addresses">
                      Addresses (one per line)
                    </Label>
                    <Textarea
                      id="batch-addresses"
                      placeholder="Enter multiple addresses, one per line..."
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      className="font-mono min-h-[120px]"
                    />
                  </div>
                  <Button
                    onClick={validateBatchAddresses}
                    disabled={!batchInput.trim() || isLoading}
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Validate All Addresses
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </MotionDiv>

        {validationResults.length > 0 && (
          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Validation Results
                </CardTitle>
                <CardDescription>
                  {validationResults.length} address
                  {validationResults.length !== 1 ? "es" : ""} validated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="results" className="w-full">
                  <TabsList>
                    <TabsTrigger value="results">Current Results</TabsTrigger>
                    <TabsTrigger value="history">
                      Validation History
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="results" className="space-y-4">
                    <div className="space-y-2">
                      {validationResults.map((result, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {result.isValid ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                  <span className="font-medium">
                                    {result.isValid ? "Valid" : "Invalid"}{" "}
                                    Address
                                  </span>
                                  <Badge
                                    variant={
                                      result.isValid ? "default" : "destructive"
                                    }
                                  >
                                    {result.type}
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyAddress(result.address)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  {result.isValid && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        viewOnExplorer(result.address)
                                      }
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm text-muted-foreground">
                                  Address
                                </Label>
                                <code className="block text-sm font-mono bg-muted p-2 rounded mt-1">
                                  {result.address}
                                </code>
                              </div>

                              {result.isValid && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {result.balance !== undefined && (
                                    <div>
                                      <Label className="text-sm text-muted-foreground">
                                        Balance
                                      </Label>
                                      <div className="font-medium">
                                        {formatLamports(result.balance)} SOL
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {result.balance} lamports
                                      </div>
                                    </div>
                                  )}

                                  {result.owner && (
                                    <div>
                                      <Label className="text-sm text-muted-foreground">
                                        Owner
                                      </Label>
                                      <div className="font-mono text-sm">
                                        {result.owner.slice(0, 8)}...
                                        {result.owner.slice(-8)}
                                      </div>
                                    </div>
                                  )}

                                  {result.executable !== undefined && (
                                    <div>
                                      <Label className="text-sm text-muted-foreground">
                                        Executable
                                      </Label>
                                      <Badge
                                        variant={
                                          result.executable
                                            ? "default"
                                            : "secondary"
                                        }
                                      >
                                        {result.executable ? "Yes" : "No"}
                                      </Badge>
                                    </div>
                                  )}

                                  {result.rentEpoch !== undefined && (
                                    <div>
                                      <Label className="text-sm text-muted-foreground">
                                        Rent Epoch
                                      </Label>
                                      <div className="font-medium">
                                        {result.rentEpoch}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4">
                    {validationHistory.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No validation history found
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {validationHistory.slice(0, 20).map((result, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    {result.isValid ? (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className="font-mono text-sm">
                                      {result.address.slice(0, 8)}...
                                      {result.address.slice(-8)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(
                                      result.timestamp,
                                    ).toLocaleString()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge
                                    variant={
                                      result.isValid ? "default" : "destructive"
                                    }
                                  >
                                    {result.type}
                                  </Badge>
                                  {result.balance !== undefined && (
                                    <div className="text-xs text-muted-foreground">
                                      {formatLamports(result.balance)} SOL
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        <ActionButtons
          onCopy={copyResults}
          onDownload={downloadResults}
          copyText="Copy Results"
          downloadData={
            validationResults.length > 0
              ? JSON.stringify(
                  {
                    results: validationResults,
                    settings,
                    timestamp: Date.now(),
                    validatedBy: "Toolify Address Validator",
                  },
                  null,
                  2,
                )
              : undefined
          }
          downloadFilename={
            validationResults.length > 0
              ? `address-validation-${Date.now()}.json`
              : undefined
          }
          downloadMimeType="application/json"
        />
      </MotionDiv>
    </ToolLayout>
  );
}
