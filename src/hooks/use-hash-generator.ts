"use client";

import { useCallback, useState } from "react";

type HashAlgorithm = "MD5" | "SHA1" | "SHA256" | "SHA512";

interface HashResult {
  algorithm: HashAlgorithm;
  hash: string;
  input: string;
}

/**
 * Hook for generating cryptographic hashes
 * @returns Object with hash generation functions and results
 */
export function useHashGenerator() {
  const [hashResults, setHashResults] = useState<HashResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Generates hash for input string using specified algorithm
   * @param input - String to hash
   * @param algorithm - Hash algorithm to use
   * @returns Promise resolving to hash string
   */
  const generateHash = useCallback(
    async (
      input: string,
      algorithm: HashAlgorithm = "SHA256",
    ): Promise<string> => {
      if (!input.trim()) {
        throw new Error("Input cannot be empty");
      }

      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);

        let hashBuffer: ArrayBuffer;

        switch (algorithm) {
          case "SHA1":
            hashBuffer = await crypto.subtle.digest("SHA-1", data);
            break;
          case "SHA256":
            hashBuffer = await crypto.subtle.digest("SHA-256", data);
            break;
          case "SHA512":
            hashBuffer = await crypto.subtle.digest("SHA-512", data);
            break;
          case "MD5":
            throw new Error("MD5 not supported in Web Crypto API");
          default:
            throw new Error(`Unsupported algorithm: ${algorithm}`);
        }

        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        return hashHex;
      } catch (error) {
        throw new Error(`Failed to generate ${algorithm} hash: ${error}`);
      }
    },
    [],
  );

  /**
   * Generates hashes for input using all supported algorithms
   * @param input - String to hash
   * @returns Promise resolving to array of hash results
   */
  const generateAllHashes = useCallback(
    async (input: string): Promise<HashResult[]> => {
      if (!input.trim()) {
        throw new Error("Input cannot be empty");
      }

      setIsGenerating(true);
      const results: HashResult[] = [];

      try {
        const algorithms: HashAlgorithm[] = ["SHA1", "SHA256", "SHA512"];

        for (const algorithm of algorithms) {
          try {
            const hash = await generateHash(input, algorithm);
            results.push({
              algorithm,
              hash,
              input: input.length > 50 ? input.substring(0, 50) + "..." : input,
            });
          } catch (error) {
            console.error(`Failed to generate ${algorithm} hash:`, error);
          }
        }

        setHashResults(results);
        return results;
      } finally {
        setIsGenerating(false);
      }
    },
    [generateHash],
  );

  /**
   * Generates hash for file using specified algorithm
   * @param file - File to hash
   * @param algorithm - Hash algorithm to use
   * @returns Promise resolving to hash string
   */
  const generateFileHash = useCallback(
    async (
      file: File,
      algorithm: HashAlgorithm = "SHA256",
    ): Promise<string> => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        let hashBuffer: ArrayBuffer;

        switch (algorithm) {
          case "SHA1":
            hashBuffer = await crypto.subtle.digest("SHA-1", arrayBuffer);
            break;
          case "SHA256":
            hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
            break;
          case "SHA512":
            hashBuffer = await crypto.subtle.digest("SHA-512", arrayBuffer);
            break;
          case "MD5":
            throw new Error("MD5 not supported in Web Crypto API");
          default:
            throw new Error(`Unsupported algorithm: ${algorithm}`);
        }

        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        return hashHex;
      } catch (error) {
        throw new Error(`Failed to generate file ${algorithm} hash: ${error}`);
      }
    },
    [],
  );

  /**
   * Clears hash results
   */
  const clearResults = useCallback(() => {
    setHashResults([]);
  }, []);

  /**
   * Verifies hash against input string
   * @param input - String to verify
   * @param expectedHash - Expected hash value
   * @param algorithm - Hash algorithm used
   * @returns Promise resolving to verification result
   */
  const verifyHash = useCallback(
    async (
      input: string,
      expectedHash: string,
      algorithm: HashAlgorithm = "SHA256",
    ): Promise<boolean> => {
      try {
        const actualHash = await generateHash(input, algorithm);
        return actualHash.toLowerCase() === expectedHash.toLowerCase();
      } catch (error) {
        console.error("Hash verification failed:", error);
        return false;
      }
    },
    [generateHash],
  );

  return {
    generateHash,
    generateAllHashes,
    generateFileHash,
    verifyHash,
    clearResults,
    hashResults,
    isGenerating,
  };
}
