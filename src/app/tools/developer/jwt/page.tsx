"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { ProcessingStatus } from "@/components/tools/processing-status";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { Clock, Key, Shield } from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Interface for decoded JWT structure
 */
interface DecodedJWT {
  header: any;
  payload: any;
  signature: string;
  isValid: boolean;
}

/**
 * JWT debugger tool page
 */
export default function JwtDebuggerPage() {
  const [jwtToken, setJwtToken] = useState("");
  const [decodedJwt, setDecodedJwt] = useState<DecodedJWT | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "jwt-debugger-history",
    [],
  );
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const inputSectionRef = useRef(null);
  const outputSectionRef = useRef(null);
  const aboutRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const inputSectionInView = useInView(inputSectionRef, {
    once: true,
    amount: 0.2,
  });
  const outputSectionInView = useInView(outputSectionRef, {
    once: true,
    amount: 0.2,
  });
  const aboutInView = useInView(aboutRef, { once: true, amount: 0.2 });

  /**
   * Decodes JWT token and extracts header, payload, and signature
   */
  const decodeJWT = () => {
    if (!jwtToken.trim()) {
      toast.error("Please enter a JWT token to decode");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const parts = jwtToken.split(".");
      if (parts.length !== 3) {
        throw new Error(
          "Invalid JWT format. Expected 3 parts separated by dots.",
        );
      }

      const [headerB64, payloadB64, signature] = parts;

      // Decode header and payload
      const header = JSON.parse(
        atob(headerB64.replace(/-/g, "+").replace(/_/g, "/")),
      );
      const payload = JSON.parse(
        atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")),
      );

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < now;

      setDecodedJwt({
        header,
        payload,
        signature,
        isValid: !isExpired,
      });

      setIsComplete(true);
      setHistory(
        [`JWT decoded: ${jwtToken.substring(0, 20)}...`, ...history].slice(
          0,
          10,
        ),
      );
      toast.success("JWT decoded successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to decode JWT";
      setError(errorMessage);
      toast.error("Failed to decode JWT");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setJwtToken("");
    setDecodedJwt(null);
    setError(null);
    setIsComplete(false);
  };

  /**
   * Formats timestamp to readable date
   */
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  /**
   * Checks if token is expired
   */
  const isExpired = (exp?: number) => {
    if (!exp) return false;
    return exp < Math.floor(Date.now() / 1000);
  };

  /**
   * Gets copy text for the decoded JWT
   */
  const getCopyText = () => {
    if (!decodedJwt) return "";
    return JSON.stringify(decodedJwt, null, 2);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";

  return (
    <ToolLayout toolId="dev-jwt">
      <MotionDiv
        ref={containerRef}
        className="space-y-6"
        variants={animationsEnabled ? containerVariants : undefined}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={
          animationsEnabled
            ? containerInView
              ? "visible"
              : "hidden"
            : undefined
        }
      >
        <MotionDiv
          ref={inputSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? inputSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                JWT Token Input
              </CardTitle>
              <CardDescription>
                Enter a JWT token to decode and analyze its contents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jwtInput">JWT Token</Label>
                <Textarea
                  id="jwtInput"
                  value={jwtToken}
                  onChange={(e) => setJwtToken(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
                  className="min-h-[120px] font-mono text-sm"
                />
              </div>

              <ActionButtons
                onGenerate={decodeJWT}
                generateLabel="Decode JWT"
                onReset={clearAll}
                resetLabel="Clear All"
                variant="outline"
                size="sm"
                disabled={!jwtToken.trim() || isProcessing}
                isGenerating={isProcessing}
              />
            </CardContent>
          </Card>
        </MotionDiv>

        {decodedJwt && (
          <MotionDiv
            ref={outputSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? outputSectionInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Decoded JWT
                  <Badge
                    variant={decodedJwt.isValid ? "default" : "destructive"}
                  >
                    {decodedJwt.isValid ? "Valid" : "Expired"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Header, payload, and signature information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="header" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="header">Header</TabsTrigger>
                    <TabsTrigger value="payload">Payload</TabsTrigger>
                    <TabsTrigger value="signature">Signature</TabsTrigger>
                  </TabsList>

                  <TabsContent value="header" className="space-y-4">
                    <div className="space-y-2">
                      <Label>JWT Header</Label>
                      <div className="p-3 bg-muted rounded-lg max-h-64 overflow-auto">
                        <pre className="font-mono text-sm whitespace-pre-wrap break-all">
                          {JSON.stringify(decodedJwt.header, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="payload" className="space-y-4">
                    <div className="space-y-2">
                      <Label>JWT Payload</Label>
                      <div className="p-3 bg-muted rounded-lg max-h-64 overflow-auto">
                        <pre className="font-mono text-sm whitespace-pre-wrap break-all">
                          {JSON.stringify(decodedJwt.payload, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Payload Analysis */}
                    <MotionDiv
                      className="space-y-3"
                      initial={
                        animationsEnabled ? { opacity: 0, y: 10 } : undefined
                      }
                      animate={
                        animationsEnabled ? { opacity: 1, y: 0 } : undefined
                      }
                      transition={
                        animationsEnabled ? { delay: 0.2 } : undefined
                      }
                    >
                      <h4 className="font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Token Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {decodedJwt.payload.iat && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Issued At:
                            </span>
                            <span>
                              {formatTimestamp(decodedJwt.payload.iat)}
                            </span>
                          </div>
                        )}
                        {decodedJwt.payload.exp && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Expires At:
                            </span>
                            <span
                              className={
                                isExpired(decodedJwt.payload.exp)
                                  ? "text-red-500"
                                  : ""
                              }
                            >
                              {formatTimestamp(decodedJwt.payload.exp)}
                            </span>
                          </div>
                        )}
                        {decodedJwt.payload.nbf && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Not Before:
                            </span>
                            <span>
                              {formatTimestamp(decodedJwt.payload.nbf)}
                            </span>
                          </div>
                        )}
                        {decodedJwt.payload.iss && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Issuer:
                            </span>
                            <span>{decodedJwt.payload.iss}</span>
                          </div>
                        )}
                        {decodedJwt.payload.aud && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Audience:
                            </span>
                            <span>{decodedJwt.payload.aud}</span>
                          </div>
                        )}
                        {decodedJwt.payload.sub && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Subject:
                            </span>
                            <span>{decodedJwt.payload.sub}</span>
                          </div>
                        )}
                      </div>
                    </MotionDiv>
                  </TabsContent>

                  <TabsContent value="signature" className="space-y-4">
                    <div className="space-y-2">
                      <Label>JWT Signature</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="font-mono text-sm break-all">
                          {decodedJwt.signature}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        The signature is used to verify that the token hasn't
                        been tampered with. This tool only decodes the token -
                        it doesn't verify the signature.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <ActionButtons
                  copyText={getCopyText()}
                  copySuccessMessage="Decoded JWT copied to clipboard"
                  variant="outline"
                  size="sm"
                />
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        <MotionDiv
          ref={aboutRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled ? (aboutInView ? "visible" : "hidden") : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>About JWT Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, x: -20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.1 } : undefined}
                >
                  <h4 className="font-medium mb-2">What is JWT?</h4>
                  <p className="text-muted-foreground">
                    JSON Web Tokens (JWT) are a compact, URL-safe means of
                    representing claims to be transferred between two parties.
                    They are commonly used for authentication and authorization
                    in web applications.
                  </p>
                </MotionDiv>
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, x: 20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.2 } : undefined}
                >
                  <h4 className="font-medium mb-2">JWT Structure:</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Header: Algorithm and token type</li>
                    <li>• Payload: Claims and data</li>
                    <li>• Signature: Verification data</li>
                    <li>• All parts are Base64URL encoded</li>
                  </ul>
                </MotionDiv>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
          <ProcessingStatus
            isProcessing={isProcessing}
            isComplete={isComplete}
            error={error}
            onReset={clearAll}
            processingText="Decoding JWT..."
            completeText="JWT decoding complete!"
            errorText="JWT decoding failed"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
