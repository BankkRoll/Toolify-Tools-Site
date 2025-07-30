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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Tool } from "@/lib/tools-config";
import {
  allTools,
  getAllActiveTools,
  getToolStats,
  searchTools,
  toolCategories,
} from "@/lib/tools-config";
import {
  useAnimations,
  useSettingsStore,
  useViewModeStore,
} from "@/stores/settings-store";
import {
  Clock,
  Filter,
  Grid3X3,
  List,
  Search,
  SortAsc,
  Star,
  Zap,
} from "lucide-react";
import { m, useInView } from "motion/react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

/**
 * Type for sort options
 */
type SortOption = "name" | "category" | "popular" | "recent";

/**
 * Main tools page component
 */
export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { viewMode, setViewMode } = useViewModeStore();
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [showInactive, setShowInactive] = useState(false);

  const { isFavorite, toggleFavorite } = useSettingsStore();
  const animationsEnabled = useAnimations();

  // Local storage for user preferences
  const [recentlyViewed] = useLocalStorage<string[]>(
    "tools-recently-viewed",
    [],
  );
  const [searchHistory] = useLocalStorage<string[]>("tools-search-history", []);

  // Refs for motion animations
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const filtersRef = useRef(null);
  const toolsRef = useRef(null);

  // InView hooks
  const headerInView = useInView(headerRef, { once: true, amount: 0.2 });
  const statsInView = useInView(statsRef, { once: true, amount: 0.2 });
  const filtersInView = useInView(filtersRef, { once: true, amount: 0.2 });
  const toolsInView = useInView(toolsRef, { once: true, amount: 0.1 });

  const stats = getToolStats();

  // Motion variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";
  const MotionSection = animationsEnabled ? m.section : "section";

  /**
   * Filters and sorts tools based on current state
   */
  const filteredTools = useMemo(() => {
    // Start with appropriate tool set based on showInactive toggle
    let tools: Tool[] = showInactive ? allTools : getAllActiveTools();

    // Apply search filter
    if (searchQuery) {
      if (showInactive) {
        // When showing inactive, search across all tools
        const lowercaseQuery = searchQuery.toLowerCase();
        tools = tools.filter(
          (tool: Tool) =>
            tool.name.toLowerCase().includes(lowercaseQuery) ||
            tool.description.toLowerCase().includes(lowercaseQuery) ||
            tool.tags.some((tag: string) =>
              tag.toLowerCase().includes(lowercaseQuery),
            ),
        );
      } else {
        // When showing only active, use the existing search function
        tools = searchTools(searchQuery);
      }
    }

    // Apply category filter
    if (selectedCategory) {
      tools = tools.filter((tool: Tool) => tool.category === selectedCategory);
    }

    // Sort tools
    tools.sort((a: Tool, b: Tool) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "category":
          return a.category.localeCompare(b.category);
        case "popular":
          return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
        case "recent":
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        default:
          return 0;
      }
    });

    return tools;
  }, [searchQuery, selectedCategory, showInactive, sortBy]);

  /**
   * Clears all active filters
   */
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setShowInactive(false);
    setSortBy("name");
  };

  const hasActiveFilters =
    searchQuery || selectedCategory || showInactive || sortBy !== "name";

  /**
   * Handles favorite toggle for tools
   */
  const handleToggleFavorite = (e: React.MouseEvent, toolId: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(toolId);
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
        className="space-y-6"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">All Tools</h1>
              <p className="text-muted-foreground">
                {stats.activeTools} active browser-based tools for developers
                and designers
              </p>
            </div>
          </div>
        </div>
      </MotionSection>

      {/* Advanced Search and Filters */}
      <MotionSection
        ref={filtersRef}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={
          animationsEnabled ? (filtersInView ? "visible" : "hidden") : undefined
        }
        variants={animationsEnabled ? sectionVariants : undefined}
        className="space-y-4"
      >
        {/* Search Bar */}
        <MotionDiv
          variants={animationsEnabled ? itemVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? filtersInView
                ? "visible"
                : "hidden"
              : undefined
          }
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tools by name, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 pr-4 text-base"
          />
        </MotionDiv>

        {/* Filter Controls */}
        <MotionDiv
          variants={animationsEnabled ? itemVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? filtersInView
                ? "visible"
                : "hidden"
              : undefined
          }
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <Select
              value={selectedCategory || "all"}
              onValueChange={(value) =>
                setSelectedCategory(value === "all" ? null : value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {toolCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="recent">Recently Added</SelectItem>
              </SelectContent>
            </Select>

            {/* Show Inactive Toggle */}
            <Button
              variant={showInactive ? "default" : "outline"}
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
            >
              <Clock className="mr-2 h-4 w-4" />
              {showInactive ? "Hide Inactive" : "Show All Tools"}
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </MotionDiv>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <MotionDiv
            variants={animationsEnabled ? itemVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? filtersInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
            className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3"
          >
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Active filters:
            </span>
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  <Search className="h-3 w-3" />"{searchQuery}"
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  {toolCategories.find((c) => c.id === selectedCategory)?.name}
                </Badge>
              )}
              {showInactive && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  All Tools (Including Inactive)
                </Badge>
              )}
              {sortBy !== "name" && (
                <Badge variant="secondary" className="gap-1">
                  <SortAsc className="h-3 w-3" />
                  {sortBy === "popular"
                    ? "Most Popular"
                    : sortBy === "recent"
                      ? "Recently Added"
                      : "By Category"}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              Clear all
            </Button>
          </MotionDiv>
        )}
      </MotionSection>

      {/* All Tools */}
      <MotionSection
        ref={toolsRef}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={
          animationsEnabled ? (toolsInView ? "visible" : "hidden") : undefined
        }
        variants={animationsEnabled ? sectionVariants : undefined}
        className="space-y-6"
      >
        {filteredTools.length === 0 ? (
          <MotionDiv
            variants={animationsEnabled ? itemVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? toolsInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card className="p-12 text-center">
              <CardContent>
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tools found</h3>
                <p className="text-muted-foreground mb-4">
                  No tools match your current filters.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          </MotionDiv>
        ) : (
          <MotionDiv
            variants={staggerContainer}
            initial="hidden"
            animate={toolsInView ? "visible" : "hidden"}
            className={`grid gap-4 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {filteredTools.map((tool, index) => {
              const isRecentlyViewed = recentlyViewed.includes(tool.id);

              return (
                <MotionDiv key={tool.id} variants={cardVariants} custom={index}>
                  <Link href={tool.href}>
                    <Card
                      className={`group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
                        viewMode === "list" ? "flex items-center" : ""
                      } ${isRecentlyViewed ? "ring-2 ring-primary/20" : ""}`}
                    >
                      <CardHeader
                        className={`pb-3 ${viewMode === "list" ? "flex-1" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="capitalize">
                            {tool.category}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                              onClick={(e) => handleToggleFavorite(e, tool.id)}
                            >
                              <Star
                                className={`h-4 w-4 ${isFavorite(tool.id) ? "fill-current" : ""}`}
                              />
                            </Button>
                            {isRecentlyViewed && (
                              <Badge variant="secondary" className="text-xs">
                                Recent
                              </Badge>
                            )}
                            {tool.popular && (
                              <Badge
                                variant="secondary"
                                className="bg-orange-100 text-orange-800"
                              >
                                <Star className="mr-1 h-3 w-3" />
                                Popular
                              </Badge>
                            )}
                            {tool.featured && (
                              <Badge
                                variant="secondary"
                                className="bg-primary/10 text-primary"
                              >
                                <Zap className="mr-1 h-3 w-3" />
                                Featured
                              </Badge>
                            )}
                            {tool.status !== "active" && (
                              <Badge variant="outline" className="text-xs">
                                {tool.status === "beta" ? "Beta" : "Soon"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle
                          className={`group-hover:text-primary transition-colors ${
                            viewMode === "list" ? "text-lg" : "text-lg"
                          }`}
                        >
                          {tool.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent
                        className={viewMode === "list" ? "flex-1" : ""}
                      >
                        <CardDescription
                          className={`mb-4 ${viewMode === "list" ? "text-sm" : ""}`}
                        >
                          {tool.description}
                        </CardDescription>
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={tool.status !== "active"}
                        >
                          {tool.status === "active"
                            ? "Use Tool"
                            : "Coming Soon"}
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </MotionDiv>
              );
            })}
          </MotionDiv>
        )}
      </MotionSection>
    </div>
  );
}
