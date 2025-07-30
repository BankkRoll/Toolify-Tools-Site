"use client";

import { Badge } from "@/components/ui/badge";
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
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/tools")}
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
                isActive={pathname.startsWith("/tools/favorites")}
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

        <SidebarSeparator />

        <SidebarGroup>
          <ScrollArea className="h-[80svh]">
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
                        className="cursor-pointer flex items-center justify-center px-2 hover:bg-accent hover:text-accent-foreground transition-colors rounded-none rounded-r-md"
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
