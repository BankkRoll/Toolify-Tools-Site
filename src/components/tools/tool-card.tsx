"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Tool } from "@/lib/tools-config";
import { useAnimations, useSettingsStore } from "@/stores/settings-store";
import { Star, Zap } from "lucide-react";
import { m } from "motion/react";
import Link from "next/link";

/**
 * Props for the ToolCard component
 */
interface ToolCardProps {
  /** The tool data to display */
  tool: Tool;
  /** View mode for the card layout */
  viewMode?: "grid" | "list";
  /** Whether to show recently viewed badge */
  showRecentlyViewed?: boolean;
  /** Whether to show popular badge */
  showPopularBadge?: boolean;
  /** Whether to show featured badge */
  showFeaturedBadge?: boolean;
  /** Whether to show status badge */
  showStatusBadge?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Animation delay for staggered animations */
  animationDelay?: number;
  /** Whether to enable hover animations */
  enableHoverAnimations?: boolean;
}

/**
 * Reusable tool card component with full functionality
 */
export function ToolCard({
  tool,
  viewMode = "grid",
  showRecentlyViewed = true,
  showPopularBadge = true,
  showFeaturedBadge = true,
  showStatusBadge = true,
  className = "",
  animationDelay = 0,
}: ToolCardProps) {
  const { isFavorite, toggleFavorite } = useSettingsStore();
  const animationsEnabled = useAnimations();

  // Local storage for recently viewed tools
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage<string[]>(
    "tools-recently-viewed",
    [],
  );

  const isRecentlyViewed =
    showRecentlyViewed && recentlyViewed.includes(tool.id);

  /**
   * Handles favorite toggle for tools
   * @param e - Mouse event
   */
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(tool.id);
  };

  /**
   * Handles tool click to track recently viewed
   */
  const handleToolClick = () => {
    if (!recentlyViewed.includes(tool.id)) {
      const updatedRecent = [tool.id, ...recentlyViewed.slice(0, 9)]; // Keep last 10
      setRecentlyViewed(updatedRecent);
    }
  };

  // Motion variants for animations
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: animationDelay * 0.1,
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
  };

  // Conditional motion component
  const MotionCard = animationsEnabled ? m(Card) : Card;

  return (
    <MotionCard
      variants={animationsEnabled ? cardVariants : undefined}
      initial={animationsEnabled ? "hidden" : undefined}
      animate={animationsEnabled ? "visible" : undefined}
      className={`group cursor-pointer transition-all ${
        viewMode === "list" ? "flex items-center" : ""
      } ${isRecentlyViewed ? "ring-2 ring-primary/20" : ""} ${className}`}
    >
      <Link href={tool.href} onClick={handleToolClick} className="block">
        <CardHeader className={`pb-3 ${viewMode === "list" ? "flex-1" : ""}`}>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="capitalize">
              {tool.category}
            </Badge>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 transition-colors"
                onClick={handleToggleFavorite}
                aria-label={`${isFavorite(tool.id) ? "Remove from" : "Add to"} favorites`}
              >
                <Star
                  className={`h-4 w-4 transition-all ${
                    isFavorite(tool.id)
                      ? "fill-current scale-110"
                      : "hover:scale-110"
                  }`}
                />
              </Button>
              {isRecentlyViewed && (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  Recent
                </Badge>
              )}
              {showPopularBadge && tool.popular && (
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors"
                >
                  <Star className="mr-1 h-3 w-3" />
                  Popular
                </Badge>
              )}
              {showFeaturedBadge && tool.featured && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Zap className="mr-1 h-3 w-3" />
                  Featured
                </Badge>
              )}
              {showStatusBadge && tool.status !== "active" && (
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    tool.status === "beta"
                      ? "border-blue-200 text-blue-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {tool.status === "beta" ? "Beta" : "Soon"}
                </Badge>
              )}
            </div>
          </div>
          <CardTitle
            className={`group-hover:text-primary transition-colors duration-200 ${
              viewMode === "list" ? "text-lg" : "text-lg"
            }`}
          >
            {tool.name}
          </CardTitle>
        </CardHeader>
        <CardContent className={viewMode === "list" ? "flex-1" : ""}>
          <CardDescription
            className={`mb-4 transition-colors duration-200 ${
              viewMode === "list" ? "text-sm" : ""
            }`}
          >
            {tool.description}
          </CardDescription>
          <Button
            size="sm"
            className={`w-full transition-all duration-200 ${
              tool.status === "active"
                ? "hover:shadow-md"
                : "opacity-75 cursor-not-allowed"
            }`}
            disabled={tool.status !== "active"}
          >
            {tool.status === "active"
              ? "Use Tool"
              : tool.status === "beta"
                ? "Beta Access"
                : "Coming Soon"}
          </Button>
        </CardContent>
      </Link>
    </MotionCard>
  );
}
