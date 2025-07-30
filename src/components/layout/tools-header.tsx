"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SearchCommand } from "@/components/ui/search-command-dialog";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { getAllActiveTools, toolCategories } from "@/lib/tools-config";
import { cn } from "@/lib/utils";
import { useCompactMode } from "@/stores/settings-store";
import { Search, Share2, Zap } from "lucide-react";
import { usePathname } from "next/navigation";
import { SettingsDialog } from "./settings-dialog";

export function ToolsHeader() {
  const pathname = usePathname();
  const allTools = getAllActiveTools();
  const { state: sidebarState } = useSidebar();
  const isMobile = useIsMobile();
  const compactMode = useCompactMode();
  const pathSegments = pathname.split("/").filter(Boolean);

  const generateBreadcrumbs = () => {
    const breadcrumbs = [{ label: "Tools", href: "/tools" }];

    if (pathSegments.length > 1) {
      // Add category
      const category = pathSegments[1];
      breadcrumbs.push({
        label: category.charAt(0).toUpperCase() + category.slice(1),
        href: `/tools/${category}`,
      });

      // Add specific tool if exists
      if (pathSegments.length > 2) {
        const tool = pathSegments[2];
        breadcrumbs.push({
          label: tool
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          href: pathname,
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Toolify Tools",
          text: "Check out this amazing developer toolkit!",
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

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
          id: "favorites",
          title: "Favorites",
          description: "Your saved favorite tools",
          category: "navigation",
          action: () => {
            window.location.href = "/tools/favorites";
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
    <header className="bg-card flex h-16 shrink-0 items-center gap-2 border-b px-6">
      <div
        className={cn(
          "items-center gap-2",
          isMobile || sidebarState === "collapsed" ? "flex" : "hidden",
        )}
      >
        <SidebarTrigger className="-ml-1" />
      </div>

      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={breadcrumb.href} className="flex items-center">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={breadcrumb.href}>
                    {breadcrumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        {/* Search Command Dialog */}
        <div className={cn("block", isMobile ? "w-36" : "w-80")}>
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
                <span className="flex-1 text-left">
                  {isMobile ? "Search..." : "Search tools..."}
                </span>
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

        <Button variant="ghost" size="icon" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Share tool</span>
        </Button>

        <SettingsDialog />
      </div>
    </header>
  );
}
