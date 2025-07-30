'use client';

import { ToolCard } from '@/components/tools/tool-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Tool } from '@/lib/tools-config';
import { allTools, getToolStats, toolCategories } from '@/lib/tools-config';
import {
  useAnimations,
  useFavorites,
  useSettingsStore,
  useViewModeStore,
} from '@/stores/settings-store';
import { Filter, Grid3X3, List, Search, SortAsc, Star } from 'lucide-react';
import { m, useInView } from 'motion/react';
import { useMemo, useRef, useState } from 'react';

type SortOption = 'name' | 'category' | 'popular' | 'recent';

export default function FavoritesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { viewMode, setViewMode } = useViewModeStore();
  const [sortBy, setSortBy] = useState<SortOption>('name');

  const favorites = useFavorites();
  const { toggleFavorite } = useSettingsStore();
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const filtersRef = useRef(null);
  const toolsRef = useRef(null);

  // InView hooks
  const headerInView = useInView(headerRef, { once: true, amount: 0.2 });
  const statsInView = useInView(statsRef, { once: true, amount: 0.2 });
  const filtersInView = useInView(filtersRef, { once: true, amount: 0.2 });
  const toolsInView = useInView(toolsRef, { once: true, amount: 0.2 });

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
  const MotionDiv = animationsEnabled ? m.div : 'div';
  const MotionSection = animationsEnabled ? m.section : 'section';

  const filteredTools = useMemo(() => {
    // Get only favorited tools
    let tools: Tool[] = allTools.filter(tool => favorites.includes(tool.id));

    // Apply search filter
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      tools = tools.filter(
        (tool: Tool) =>
          tool.name.toLowerCase().includes(lowercaseQuery) ||
          tool.description.toLowerCase().includes(lowercaseQuery) ||
          tool.tags.some((tag: string) => tag.toLowerCase().includes(lowercaseQuery)),
      );
    }

    // Apply category filter
    if (selectedCategory) {
      tools = tools.filter((tool: Tool) => tool.category === selectedCategory);
    }

    // Sort tools
    tools.sort((a: Tool, b: Tool) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'popular':
          return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
        case 'recent':
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        default:
          return 0;
      }
    });

    return tools;
  }, [searchQuery, selectedCategory, favorites, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSortBy('name');
  };

  const hasActiveFilters = searchQuery || selectedCategory || sortBy !== 'name';

  return (
    <div className='space-y-8'>
      {/* Header */}
      <MotionSection
        ref={headerRef}
        initial={animationsEnabled ? 'hidden' : undefined}
        animate={animationsEnabled ? (headerInView ? 'visible' : 'hidden') : undefined}
        variants={animationsEnabled ? sectionVariants : undefined}
        className='space-y-6'
      >
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-3'>
            <div>
              <h1 className='text-4xl font-bold tracking-tight'>Favorites</h1>
              <p className='text-muted-foreground'>
                Your favorite tools ({favorites.length} saved)
              </p>
            </div>
          </div>
        </div>
      </MotionSection>

      {/* Advanced Search and Filters */}
      <MotionSection
        ref={filtersRef}
        initial={animationsEnabled ? 'hidden' : undefined}
        animate={animationsEnabled ? (filtersInView ? 'visible' : 'hidden') : undefined}
        variants={animationsEnabled ? sectionVariants : undefined}
        className='space-y-4'
      >
        {/* Search Bar */}
        <MotionDiv
          variants={animationsEnabled ? itemVariants : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (filtersInView ? 'visible' : 'hidden') : undefined}
          className='relative'
        >
          <Search className='absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search your favorite tools...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='h-12 pl-12 pr-4 text-base'
          />
        </MotionDiv>

        {/* Filter Controls */}
        <MotionDiv
          variants={animationsEnabled ? itemVariants : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (filtersInView ? 'visible' : 'hidden') : undefined}
          className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'
        >
          <div className='flex flex-wrap items-center gap-3'>
            {/* Category Filter */}
            <Select
              value={selectedCategory || 'all'}
              onValueChange={value => setSelectedCategory(value === 'all' ? null : value)}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='All Categories' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Categories</SelectItem>
                {toolCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={value => setSortBy(value as SortOption)}>
              <SelectTrigger className='w-[140px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='name'>Name A-Z</SelectItem>
                <SelectItem value='category'>Category</SelectItem>
                <SelectItem value='popular'>Most Popular</SelectItem>
                <SelectItem value='recent'>Recently Added</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className='flex items-center gap-2'>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className='h-4 w-4' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setViewMode('list')}
            >
              <List className='h-4 w-4' />
            </Button>
          </div>
        </MotionDiv>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <MotionDiv
            variants={animationsEnabled ? itemVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={animationsEnabled ? (filtersInView ? 'visible' : 'hidden') : undefined}
            className='flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3'
          >
            <Filter className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm font-medium text-muted-foreground'>Active filters:</span>
            <div className='flex flex-wrap gap-2'>
              {searchQuery && (
                <Badge variant='secondary' className='gap-1'>
                  <Search className='h-3 w-3' />"{searchQuery}"
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant='secondary' className='gap-1'>
                  {toolCategories.find(c => c.id === selectedCategory)?.name}
                </Badge>
              )}
              {sortBy !== 'name' && (
                <Badge variant='secondary' className='gap-1'>
                  <SortAsc className='h-3 w-3' />
                  {sortBy === 'popular'
                    ? 'Most Popular'
                    : sortBy === 'recent'
                      ? 'Recently Added'
                      : 'By Category'}
                </Badge>
              )}
            </div>
            <Button variant='ghost' size='sm' onClick={clearFilters} className='ml-auto'>
              Clear all
            </Button>
          </MotionDiv>
        )}
      </MotionSection>

      {/* Favorites Tools */}
      <MotionSection
        ref={toolsRef}
        initial={animationsEnabled ? 'hidden' : undefined}
        animate={animationsEnabled ? (toolsInView ? 'visible' : 'hidden') : undefined}
        variants={animationsEnabled ? sectionVariants : undefined}
        className='space-y-6'
      >
        {filteredTools.length === 0 ? (
          <MotionDiv
            variants={animationsEnabled ? itemVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={animationsEnabled ? (toolsInView ? 'visible' : 'hidden') : undefined}
          >
            <Card className='p-12 text-center'>
              <CardContent>
                <Star className='mx-auto h-12 w-12 text-muted-foreground mb-4 fill-current' />
                <h3 className='text-lg font-semibold mb-2'>
                  {favorites.length === 0 ? 'No favorites yet' : 'No favorites match your search'}
                </h3>
                <p className='text-muted-foreground mb-4'>
                  {favorites.length === 0
                    ? 'Start adding tools to your favorites to see them here.'
                    : 'Try adjusting your search or filters.'}
                </p>
                <Button variant='outline' onClick={clearFilters}>
                  {favorites.length === 0 ? 'Browse Tools' : 'Clear filters'}
                </Button>
              </CardContent>
            </Card>
          </MotionDiv>
        ) : (
          <MotionDiv
            variants={staggerContainer}
            initial='hidden'
            animate={toolsInView ? 'visible' : 'hidden'}
            className={`grid gap-4 ${
              viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            }`}
          >
            {filteredTools.map((tool, index) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                viewMode={viewMode}
                animationDelay={index}
                enableHoverAnimations={animationsEnabled}
              />
            ))}
          </MotionDiv>
        )}
      </MotionSection>
    </div>
  );
}
