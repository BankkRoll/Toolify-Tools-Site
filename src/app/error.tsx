"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-20 text-center">
      <div className="absolute inset-0 z-0 grid place-items-center opacity-[0.02] dark:opacity-[0.03]">
        {Array.from({ length: 6 }).map((_, i) => (
          <AlertTriangle
            key={i}
            className="absolute size-64 text-foreground"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 mx-auto max-w-xl">
        <div className="mb-6 flex justify-center">
          <AlertTriangle className="size-16 text-destructive" />
        </div>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Something went wrong
        </h1>
        <p className="mb-8 text-base text-muted-foreground sm:text-lg">
          We've encountered an unexpected error.
          <br className="hidden sm:block" />
          Our team has been notified and is working to fix the issue.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg" variant="outline">
            <Link href="/" className="text-foreground">
              Return Home
            </Link>
          </Button>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
