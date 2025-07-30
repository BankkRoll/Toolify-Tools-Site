"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { SearchCommand } from "@/components/ui/search-command-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  getActiveToolsByCategory,
  getAllActiveTools,
  toolCategories,
} from "@/lib/tools-config";
import { Code2, Search, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import GithubStarsButton from "../ui/github-stars-button";

export function LandingHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const allTools = getAllActiveTools();

  // Create search commands from all tools
  const searchCommands = allTools.map((tool) => ({
    id: tool.id,
    title: tool.name,
    description: tool.description,
    category: tool.category,
    keywords: tool.tags,
    action: () => {
      window.location.href = tool.href;
    },
  }));

  const commandGroups = [
    {
      heading: "Quick Actions",
      items: [
        {
          id: "all-tools",
          title: "All Tools",
          description: "Browse all available tools",
          category: "navigation",
          action: () => {
            window.location.href = "/tools";
          },
        },
        {
          id: "featured",
          title: "Featured Tools",
          description: "Most popular and useful tools",
          category: "navigation",
          action: () => {
            window.location.href = "/tools";
          },
        },
      ],
    },
    {
      heading: "Tool Categories",
      items: toolCategories.map((category) => ({
        id: `category-${category.id}`,
        title: category.name,
        description: category.description,
        category: "category",
        action: () => {
          window.location.href = category.href;
        },
      })),
    },
    {
      heading: "All Tools",
      items: searchCommands,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="Toolify" className="h-10 w-10" />
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold tracking-tight">Toolify</h2>
            <p className="text-xs text-muted-foreground">Developer Toolkit</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          {/* Super Clean Mega Menu */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium">
                  Tools
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-full border-t border-border bg-popover shadow-lg rounded-md">
                    {/* Centered content container */}
                    <div className="container mx-auto p-6">
                      <div className="grid grid-cols-4 gap-8">
                        {/* Featured Tools Section */}
                        <div className="col-span-1">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-foreground">
                              Featured Tools
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Most popular tools
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            {allTools
                              .filter((tool) => tool.featured)
                              .slice(0, 15)
                              .map((tool) => (
                                <Link
                                  key={tool.id}
                                  href={tool.href}
                                  className="group flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-all duration-200"
                                >
                                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <Code2 className="h-3.5 w-3.5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                        {tool.name}
                                      </p>
                                      {tool.popular && (
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] h-4 px-1"
                                        >
                                          Popular
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              ))}
                          </div>
                        </div>

                        {/* Tool Categories */}
                        <div className="col-span-3">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-foreground">
                              Categories
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Browse by category
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            {toolCategories.map((category) => {
                              const activeTools = getActiveToolsByCategory(
                                category.id,
                              );
                              return (
                                <div
                                  key={category.id}
                                  className="space-y-2 group/category"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`h-2.5 w-2.5 rounded-full ${category.color} group-hover/category:scale-125 transition-transform duration-200`}
                                    />
                                    <div className="flex-1">
                                      <Link
                                        href={category.href}
                                        className="block"
                                      >
                                        <h4 className="text-sm font-semibold text-foreground group-hover/category:text-primary transition-colors">
                                          {category.name}
                                        </h4>
                                      </Link>
                                    </div>
                                  </div>
                                  <div className="ml-5">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                      {activeTools.slice(0, 10).map((tool) => (
                                        <Link
                                          key={tool.id}
                                          href={tool.href}
                                          className="group/tool flex items-center gap-1.5 p-1 rounded-sm hover:bg-accent transition-all duration-200 hover:translate-x-1 text-xs"
                                        >
                                          <p className="text-muted-foreground group-hover/tool:text-primary transition-colors truncate">
                                            {tool.name}
                                          </p>
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Footer Stats */}
                      <div className="mt-6 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 group">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform duration-200" />
                              <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                {allTools.length} tools
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 group">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500 group-hover:scale-150 transition-transform duration-200" />
                              <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                Browser-based
                              </span>
                            </div>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <Link href="/tools">View All Tools</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Search Command Dialog */}
          <div className="w-80">
            <SearchCommand
              commands={commandGroups}
              placeholder="Search tools, categories, or commands..."
              emptyMessage="No tools found. Try a different search term."
              enableFuzzySearch={true}
              enableHistory={true}
              enableFavorites={true}
              enableShortcuts={true}
              showBadges={true}
              maxRecent={5}
              trigger={
                <button className="cursor-pointer w-full inline-flex items-center gap-3 rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-muted-foreground shadow-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group relative overflow-hidden">
                  <Search className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  <span className="flex-1 text-left">Search tools...</span>
                  <div className="flex items-center gap-2">
                    <kbd className="hidden h-5 select-none items-center gap-1 rounded-md border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                    <Zap className="h-3 w-3 opacity-60" />
                  </div>
                </button>
              }
            />
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center space-x-2 lg:flex">
          <GithubStarsButton text="GitHub" />
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="relative group">
              <div className="flex flex-col gap-1 items-center justify-center w-5 h-5">
                <div className="w-5 h-0.5 bg-foreground transition-all duration-300 group-hover:bg-primary group-data-[state=open]:rotate-45 group-data-[state=open]:translate-y-1.5" />
                <div className="w-5 h-0.5 bg-foreground transition-all duration-300 group-hover:bg-primary group-data-[state=open]:opacity-0" />
                <div className="w-5 h-0.5 bg-foreground transition-all duration-300 group-hover:bg-primary group-data-[state=open]:-rotate-45 group-data-[state=open]:-translate-y-1.5" />
              </div>
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[85vw] sm:w-96 p-0 overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-muted/20">
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:bg-primary/90 transition-colors">
                    <Code2 className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-lg font-semibold tracking-tight">
                      Toolify
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Developer Toolkit
                    </p>
                  </div>
                </Link>
                <Badge variant="secondary" className="text-xs">
                  {allTools.length} Tools
                </Badge>
              </div>

              {/* Search Section */}
              <div className="p-4 border-b bg-background">
                <SearchCommand
                  commands={commandGroups}
                  placeholder="Search tools, categories..."
                  emptyMessage="No tools found. Try a different search term."
                  enableFuzzySearch={true}
                  enableHistory={true}
                  enableFavorites={true}
                  enableShortcuts={false}
                  showBadges={true}
                  maxRecent={4}
                  trigger={
                    <button className="cursor-pointer w-full inline-flex items-center gap-3 rounded-xl border border-input bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group">
                      <Search className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      <span className="flex-1 text-left">Quick search...</span>
                      <kbd className="hidden h-5 select-none items-center gap-1 rounded-md border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
                        <span className="text-xs">⌘</span>K
                      </kbd>
                    </button>
                  }
                />
              </div>

              {/* Navigation Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-6">
                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-6 rounded-full bg-primary" />
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                        Quick Actions
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/tools"
                        className="group flex flex-col items-center gap-2 rounded-xl border border-input bg-background p-4 text-center transition-all duration-200 hover:border-primary hover:bg-accent hover:shadow-md"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Code2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            All Tools
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Browse everything
                          </p>
                        </div>
                      </Link>
                      <Link
                        href="/tools"
                        className="group flex flex-col items-center gap-2 rounded-xl border border-input bg-background p-4 text-center transition-all duration-200 hover:border-primary hover:bg-accent hover:shadow-md"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent group-hover:bg-accent/80 transition-colors">
                          <Zap className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Featured
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Popular tools
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Tool Categories */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-6 rounded-full bg-accent-foreground" />
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                        Categories
                      </h3>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {toolCategories.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {toolCategories.map((category) => {
                        const activeTools = getActiveToolsByCategory(
                          category.id,
                        );
                        return (
                          <Link
                            key={category.id}
                            href={category.href}
                            className="group flex items-center gap-3 rounded-xl border border-input bg-background p-4 transition-all duration-200 hover:border-primary hover:bg-accent hover:shadow-md"
                            onClick={() => setIsOpen(false)}
                          >
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-lg ${category.color} group-hover:scale-105 transition-transform`}
                            >
                              <div className="h-4 w-4 rounded-full bg-white/20" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                  {category.name}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  {activeTools.length}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {category.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex gap-1">
                                {activeTools.slice(0, 3).map((tool, index) => (
                                  <div
                                    key={tool.id}
                                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
                                    style={{ opacity: 1 - index * 0.2 }}
                                  />
                                ))}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {activeTools.length > 3
                                  ? `+${activeTools.length - 3}`
                                  : ""}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="rounded-xl border border-input bg-muted/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1 w-6 rounded-full bg-primary" />
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                        Stats
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {allTools.length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Tools
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-accent-foreground">
                          {toolCategories.length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Categories
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t bg-muted/20 p-4 space-y-3">
                <div className="flex gap-2">
                  <GithubStarsButton text="GitHub" />
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-primary to-accent-foreground hover:from-primary/90 hover:to-accent-foreground/90"
                  >
                    <Link href="/tools">Explore All Tools</Link>
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
