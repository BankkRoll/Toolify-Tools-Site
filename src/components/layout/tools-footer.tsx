"use client";

import { toolCategories } from "@/lib/tools-config";
import { Code2 } from "lucide-react";
import Link from "next/link";
import { ThemeSwitcher } from "../ui/theme-switch";

export function ToolsFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/logo.png" alt="Toolify" className="h-10 w-10" />
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold tracking-tight">
                  Toolify
                </h2>
                <p className="text-xs text-muted-foreground">
                  Developer Toolkit
                </p>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional browser-based tools for developers, designers, and
              content creators. No downloads, no installations - just powerful
              tools that work instantly.
            </p>
            <ThemeSwitcher />
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Tools
            </h4>
            <div className="space-y-2">
              <Link
                href="/tools"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                All Tools
              </Link>
              <Link
                href="/tools/developer"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Developer Tools
              </Link>
              <Link
                href="/tools/text"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Text Tools
              </Link>
              <Link
                href="/tools/image"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Image Tools
              </Link>
              <Link
                href="/tools/pdf"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                PDF Tools
              </Link>
              <Link
                href="/tools/number"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Number Tools
              </Link>
              <Link
                href="/tools/time"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Time Tools
              </Link>
              <Link
                href="/tools/units"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Unit Converters
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Categories
            </h4>
            <div className="space-y-2">
              {toolCategories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={category.href}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Resources
            </h4>
            <div className="space-y-2">
              <Link
                href="/tools"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse Tools
              </Link>
              <Link
                href="/tools/favorites"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Favorites
              </Link>
              <Link
                href="/tools"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Popular Tools
              </Link>
              <Link
                href="/tools"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                New Tools
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 items-start sm:items-center">
              <p className="text-sm text-muted-foreground">
                ©{currentYear} Toolify. All rights reserved.
              </p>
            </div>

            <div className="flex gap-6 items-center">
              <a
                href="https://github.com/BankkRoll/Toolify-Tools-Site"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <Link
                href="/privacy-policy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
