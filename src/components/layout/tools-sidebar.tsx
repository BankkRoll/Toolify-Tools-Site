"use client";

import { Badge } from "@/components/ui/badge";
import { SearchCommand } from "@/components/ui/search-command-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getAllActiveTools,
  getToolsByCategory,
  toolCategories,
} from "@/lib/tools-config";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/stores/settings-store";
import {
  Calculator,
  ChevronRight,
  Clock,
  Code2,
  FileText,
  Grid3X3,
  ImageIcon,
  Search,
  Star,
  Type,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ScrollArea } from "../ui/scroll-area";

const iconMap: { [key: string]: React.ElementType } = {
  FileText,
  ImageIcon,
  Code2,
  Type,
  Calculator,
  Clock,
  Zap,
  Wrench,
  Code: Code2, // "Code" from config maps to Code2 icon
};

export function ToolsSidebar() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const isMobile = useIsMobile();
  const favorites = useFavorites();
  const [openCategories, setOpenCategories] = useState<string[]>(
    toolCategories.slice(0, 1).map((c) => c.id),
  );

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const totalTools = getAllActiveTools().length;

  // Create search commands from all tools
  const allTools = getAllActiveTools();
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
    <Sidebar variant="sidebar" className="border-r overflow-hidden">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="Toolify" className="h-10 w-10" />
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold tracking-tight">Toolify</h2>
              <p className="text-xs text-muted-foreground">Developer Toolkit</p>
            </div>
          </Link>
          <div className={cn(sidebarState === "collapsed" && "hidden")}>
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-hidden">
        {/* Search Command Dialog */}
        <div className="p-4 border-b border-primary">
          <SearchCommand
            commands={commandGroups}
            placeholder="Search tools..."
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

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/tools"}
                className="justify-start"
              >
                <Link href="/tools">
                  <Grid3X3 />
                  <span>All Tools</span>
                  <Badge variant="secondary" className="ml-auto">
                    {totalTools}
                  </Badge>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/tools/favorites"}
                className="justify-start"
              >
                <Link href="/tools/favorites">
                  <Star />
                  <span>Favorites</span>
                  <Badge variant="outline" className="ml-auto">
                    {favorites.length}
                  </Badge>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <div className="border-primary border-b" />

        <SidebarGroup>
          <ScrollArea className="h-[71svh]">
            <SidebarGroupLabel className="px-2">Categories</SidebarGroupLabel>
            <SidebarMenu>
              {toolCategories.map((category) => {
                const Icon = iconMap[category.icon] || Wrench;
                const isOpen = openCategories.includes(category.id);
                return (
                  <SidebarMenuItem key={category.id} className="[&>ul]:my-1">
                    <div className="flex w-full">
                      {/* Left side - Category link */}
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === category.href}
                        className="flex-1 justify-start rounded-none rounded-l-md"
                      >
                        <Link href={category.href}>
                          <Icon className="h-4 w-4" />
                          <span>{category.name}</span>
                        </Link>
                      </SidebarMenuButton>

                      {/* Right side - Toggle button */}
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="cursor-pointer flex items-center justify-center px-2 hover:bg-sidebar-ring hover:text-secondary transition-colors rounded-none rounded-r-md"
                      >
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform data-[state=open]:rotate-90",
                            isOpen && "rotate-90",
                          )}
                        />
                      </button>
                    </div>
                    {isOpen && (
                      <SidebarMenuSub>
                        {getToolsByCategory(category.id)
                          .filter((tool) => tool.status === "active")
                          .map((tool) => (
                            <SidebarMenuSubItem key={tool.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === tool.href}
                              >
                                <Link href={tool.href}>{tool.name}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </ScrollArea>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
