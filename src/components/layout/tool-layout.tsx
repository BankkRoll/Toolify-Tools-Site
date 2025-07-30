import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  features?: ReactNode;
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
  features,
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
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });

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
    <div className="space-y-8">
      {/* Header */}
      <MotionSection
        ref={headerRef}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={
          animationsEnabled ? (headerInView ? "visible" : "hidden") : undefined
        }
        variants={animationsEnabled ? sectionVariants : undefined}
        className="space-y-4"
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
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tools">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tools
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
          className="space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight">
                  {finalTitle}
                </h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {finalCategory}
                  </Badge>
                  {!isCategoryPage && finalPopular && (
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-800"
                    >
                      <Star className="mr-1 h-3 w-3" />
                      Popular
                    </Badge>
                  )}
                  {!isCategoryPage && finalFeatured && (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary"
                    >
                      <Zap className="mr-1 h-3 w-3" />
                      Featured
                    </Badge>
                  )}
                  {!isCategoryPage && finalStatus !== "active" && (
                    <Badge variant="outline" className="text-xs">
                      {finalStatus === "beta" ? "Beta" : "Coming Soon"}
                    </Badge>
                  )}
                </div>
              </div>
              <p
                className={cn(
                  "text-lg text-muted-foreground",
                  compactMode ? "max-w-2xl" : "max-w-3xl",
                )}
              >
                {finalDescription}
              </p>
            </div>

            {/* Action Buttons - Only show for individual tool pages */}
            {!isCategoryPage && toolData && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleFavorite}
                  className={
                    isFavorite(toolId)
                      ? "text-yellow-500 border-yellow-200 hover:bg-yellow-50"
                      : ""
                  }
                >
                  <Star
                    className={`mr-2 h-4 w-4 ${isFavorite(toolId) ? "fill-current" : ""}`}
                  />
                  {isFavorite(toolId) ? "Favorited" : "Favorite"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            )}
          </div>
        </MotionDiv>
      </MotionSection>

      <Separator />

      {/* Main Content */}
      <MotionSection
        ref={contentRef}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={
          animationsEnabled ? (contentInView ? "visible" : "hidden") : undefined
        }
        variants={animationsEnabled ? sectionVariants : undefined}
        className="space-y-6"
      >
        {children}
      </MotionSection>

      {/* Features Section */}
      {features && (
        <>
          <Separator />
          <MotionSection
            ref={featuresRef}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? featuresInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
            variants={animationsEnabled ? sectionVariants : undefined}
            className="space-y-4"
          >
            <MotionDiv
              variants={animationsEnabled ? itemVariants : undefined}
              initial={animationsEnabled ? "hidden" : undefined}
              animate={
                animationsEnabled
                  ? featuresInView
                    ? "visible"
                    : "hidden"
                  : undefined
              }
            >
              <div>
                <h2 className="text-2xl font-semibold">Features</h2>
                <p className="text-muted-foreground">
                  Key features and capabilities of this tool
                </p>
              </div>
            </MotionDiv>
            <MotionDiv
              variants={animationsEnabled ? itemVariants : undefined}
              initial={animationsEnabled ? "hidden" : undefined}
              animate={
                animationsEnabled
                  ? featuresInView
                    ? "visible"
                    : "hidden"
                  : undefined
              }
            >
              {features}
            </MotionDiv>
          </MotionSection>
        </>
      )}

      {/* Footer */}
      <Separator />
      <MotionDiv
        variants={animationsEnabled ? itemVariants : undefined}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={
          animationsEnabled ? (contentInView ? "visible" : "hidden") : undefined
        }
        className="flex items-center justify-between text-sm text-muted-foreground"
      >
        <div className="flex items-center gap-4">
          <span>Need help? Check out our documentation</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Powered by Toolify</span>
        </div>
      </MotionDiv>
    </div>
  );
}
