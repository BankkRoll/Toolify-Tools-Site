import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCategoryById, getToolById } from "@/lib/tools-config";
import { cn } from "@/lib/utils";
import {
  useAnimations,
  useCompactMode,
  useSettingsStore,
} from "@/stores/settings-store";
import { ArrowLeft, Share2, Star, Zap } from "lucide-react";
import { m, useInView } from "motion/react";
import Link from "next/link";
import { useRef, type ReactNode } from "react";

interface ToolLayoutProps {
  toolId: string; // Required - can be either tool ID or category ID
  children: ReactNode;
  // Optional overrides
  title?: string;
  description?: string;
  category?: string;
  popular?: boolean;
  featured?: boolean;
  status?: "active" | "beta" | "inactive";
}

export function ToolLayout({
  toolId,
  children,
  title,
  description,
  category,
  popular,
  featured,
  status,
}: ToolLayoutProps) {
  const { isFavorite, toggleFavorite } = useSettingsStore();
  const compactMode = useCompactMode();
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const featuresRef = useRef(null);

  // InView hooks
  const headerInView = useInView(headerRef, { once: true, amount: 0.2 });
  const contentInView = useInView(contentRef, { once: true, amount: 0.2 });

  // Motion variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";
  const MotionSection = animationsEnabled ? m.section : "section";

  // Try to get tool data first, then category data
  const toolData = getToolById(toolId);
  const categoryData = getCategoryById(toolId);

  // Determine if this is a category page or tool page
  const isCategoryPage = !toolData && !!categoryData;
  const data = toolData || categoryData;

  // Use config data with optional overrides
  const finalTitle = title || data?.name || "Tool";
  const finalDescription = description || data?.description || "";
  const finalCategory =
    category || toolData?.category || categoryData?.id || "general";
  const finalPopular =
    popular !== undefined ? popular : toolData?.popular || false;
  const finalFeatured =
    featured !== undefined ? featured : toolData?.featured || false;
  const finalStatus = status || toolData?.status || "active";

  const handleToggleFavorite = () => {
    if (toolData) {
      toggleFavorite(toolId);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: finalTitle,
          text: finalDescription,
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <MotionSection
        ref={headerRef}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={
          animationsEnabled ? (headerInView ? "visible" : "hidden") : undefined
        }
        variants={animationsEnabled ? sectionVariants : undefined}
        className="space-y-3 sm:space-y-4"
      >
        {/* Back Navigation */}
        <MotionDiv
          variants={animationsEnabled ? itemVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? headerInView
                ? "visible"
                : "hidden"
              : undefined
          }
          className="flex items-center gap-2"
        >
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 sm:h-9 px-2 sm:px-3"
          >
            <Link href="/tools">
              <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Back to Tools</span>
            </Link>
          </Button>
        </MotionDiv>

        {/* Title and Meta */}
        <MotionDiv
          variants={animationsEnabled ? itemVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? headerInView
                ? "visible"
                : "hidden"
              : undefined
          }
          className="space-y-3 sm:space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight truncate">
                  {finalTitle}
                </h1>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <Badge
                    variant="secondary"
                    className="capitalize text-xs sm:text-sm"
                  >
                    {finalCategory}
                  </Badge>
                  {!isCategoryPage && finalPopular && (
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-800 text-xs sm:text-sm"
                    >
                      <Star className="mr-1 h-3 w-3" />
                      Popular
                    </Badge>
                  )}
                  {!isCategoryPage && finalFeatured && (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary text-xs sm:text-sm"
                    >
                      <Zap className="mr-1 h-3 w-3" />
                      Featured
                    </Badge>
                  )}
                  {!isCategoryPage && finalStatus !== "active" && (
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      {finalStatus === "beta" ? "Beta" : "Coming Soon"}
                    </Badge>
                  )}
                </div>
              </div>
              <p
                className={cn(
                  "text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed",
                  compactMode ? "max-w-2xl" : "max-w-3xl xl:max-w-4xl",
                )}
              >
                {finalDescription}
              </p>
            </div>

            {/* Action Buttons */}
            {!isCategoryPage && toolData && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleFavorite}
                  className={cn(
                    "h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm",
                    isFavorite(toolId)
                      ? "text-yellow-500 border-yellow-200 hover:bg-yellow-50"
                      : "",
                  )}
                >
                  <Star
                    className={cn(
                      "mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4",
                      isFavorite(toolId) ? "fill-current" : "",
                    )}
                  />
                  <span className="hidden sm:inline">
                    {isFavorite(toolId) ? "Favorited" : "Favorite"}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <Share2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </div>
            )}
          </div>
        </MotionDiv>
      </MotionSection>

      <Separator className="w-full my-4 sm:my-6" />

      {/* Main Content */}
      <MotionSection
        ref={contentRef}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={
          animationsEnabled ? (contentInView ? "visible" : "hidden") : undefined
        }
        variants={animationsEnabled ? sectionVariants : undefined}
        className="space-y-4 sm:space-y-6"
      >
        {children}
      </MotionSection>

      {/* Footer */}
      <Separator className="my-4 sm:my-6" />
      <MotionDiv
        variants={animationsEnabled ? itemVariants : undefined}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={
          animationsEnabled ? (contentInView ? "visible" : "hidden") : undefined
        }
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground"
      >
        <div className="flex items-center gap-2 sm:gap-4">
          <span>
            {toolData?.name} - {toolData?.description}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>
            Created by:{" "}
            <a
              href="https://toolify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary"
            >
              Toolify
            </a>
          </span>
        </div>
      </MotionDiv>
    </div>
  );
}
