"use client";

import { ToolsFooter } from "@/components/layout/tools-footer";
import { ToolsHeader } from "@/components/layout/tools-header";
import { ToolsSidebar } from "@/components/layout/tools-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useCompactMode } from "@/stores/settings-store";
import type React from "react";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const compactMode = useCompactMode();

  return (
    <SidebarProvider defaultOpen={true}>
      <ToolsSidebar />
      <SidebarInset>
        <ToolsHeader />
        <main
          className={cn(
            "container w-full flex-1 overflow-auto p-6 mb-6",
            compactMode ? "max-w-6xl mx-auto" : "mx-auto",
          )}
        >
          {children}
        </main>
        <ToolsFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
