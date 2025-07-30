"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import {
  ChevronRight,
  Clock,
  Filter,
  Hash,
  Loader2,
  Search,
  Sparkles,
  Star,
  StarOff,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

// ============================================================================
// VISUALLY HIDDEN COMPONENT
// ============================================================================

/**
 * Visually hidden component for screen reader accessibility
 */
const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
      className,
    )}
    {...props}
  />
));
VisuallyHidden.displayName = "VisuallyHidden";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents a single command item in the search dialog
 */
interface CommandItem {
  /** Unique identifier for the command */
  id: string;
  /** Display title of the command */
  title: string;
  /** Optional description shown below the title */
  description?: string;
  /** Icon component to display next to the command */
  icon?: React.ComponentType<{ className?: string }>;
  /** Function to execute when command is selected */
  action: () => void | Promise<void>;
  /** Keywords for enhanced search matching */
  keywords?: string[];
  /** Alternative names/aliases for the command */
  aliases?: string[];
  /** Category for grouping commands */
  category?: string;
  /** Keyboard shortcut display text */
  shortcut?: string;
  /** Search relevance score (computed internally) */
  score?: number;
  /** Whether the command action is asynchronous */
  isAsync?: boolean;
  /** Badge text to display */
  badge?: string;
  /** Child commands for nested navigation */
  children?: CommandItem[];
  /** Parent command ID for breadcrumb navigation */
  parent?: string;
}

/**
 * Represents a group of related commands
 */
interface CommandGroup {
  /** Group heading text */
  heading: string;
  /** Commands in this group */
  items: CommandItem[];
  /** Optional icon for the group */
  icon?: React.ComponentType<{ className?: string }>;
  /** Whether the group can be collapsed */
  collapsible?: boolean;
  /** Whether the group starts collapsed */
  defaultCollapsed?: boolean;
}

/**
 * Command execution history entry
 */
interface CommandHistory {
  /** Command ID */
  id: string;
  /** Last execution timestamp */
  timestamp: number;
  /** Number of times executed */
  count: number;
}

/**
 * Available filter types for command display
 */
type FilterType = "all" | "favorites" | "recent";

/**
 * Filter configuration
 */
interface FilterConfig {
  id: FilterType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Props for the SearchCommand component
 */
interface SearchCommandProps {
  /** Custom trigger element (defaults to search button) */
  trigger?: React.ReactNode;
  /** Array of command groups to display */
  commands?: CommandGroup[];
  /** Placeholder text for search input */
  placeholder?: string;
  /** Message shown when no results found */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
  /** Maximum number of recent commands to show */
  maxRecent?: number;
  /** Enable fuzzy search algorithm */
  enableFuzzySearch?: boolean;
  /** Enable command history tracking */
  enableHistory?: boolean;
  /** Enable favorites system */
  enableFavorites?: boolean;
  /** Enable keyboard shortcuts */
  enableShortcuts?: boolean;
  /** Show command badges */
  showBadges?: boolean;
  /** Show search scores (debug mode) */
  showScores?: boolean;
  /** Theme preference */
  theme?: "light" | "dark" | "system";
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/** Local storage keys for persistence */
const STORAGE_KEYS = {
  HISTORY: "search-command-history",
  FAVORITES: "search-command-favorites",
  RECENT_SEARCHES: "search-command-recent-searches",
} as const;

/** Available filter configurations */
const FILTER_CONFIGS: FilterConfig[] = [
  { id: "all", label: "All", icon: Hash },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "recent", label: "Recent", icon: Clock },
] as const;

/** Fuzzy search scoring weights */
const SEARCH_WEIGHTS = {
  TITLE_EXACT: 100,
  TITLE_FUZZY: 80,
  ALIAS_EXACT: 90,
  ALIAS_FUZZY: 70,
  DESCRIPTION_EXACT: 60,
  DESCRIPTION_FUZZY: 40,
  KEYWORD_EXACT: 75,
  KEYWORD_FUZZY: 50,
  FAVORITE_BOOST: 20,
  RECENT_BOOST: 15,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safely get item from localStorage with fallback
 */
const getStorageItem = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Safely set item in localStorage
 */
const setStorageItem = <T,>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail if localStorage is not available
  }
};

/**
 * Advanced fuzzy search algorithm with scoring
 */
const fuzzySearch = (query: string, text: string): number => {
  const queryLower = query.toLowerCase().trim();
  const textLower = text.toLowerCase().trim();

  if (!queryLower || !textLower) return 0;

  // Exact match gets highest score
  if (textLower === queryLower) return 100;

  // Starts with query gets high score
  if (textLower.startsWith(queryLower)) return 90;

  // Contains query gets medium score
  if (textLower.includes(queryLower)) return 70;

  // Fuzzy matching for partial matches
  let score = 0;
  let queryIndex = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 1;
      queryIndex++;
      consecutiveMatches++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
    } else {
      consecutiveMatches = 0;
    }
  }

  // Bonus for consecutive character matches
  score += maxConsecutive * 2;

  // Return percentage match with minimum threshold
  const percentage =
    queryIndex === queryLower.length ? (score / queryLower.length) * 50 : 0;
  return percentage > 10 ? percentage : 0;
};

/**
 * Calculate comprehensive search score for a command
 */
const calculateCommandScore = (
  command: CommandItem,
  query: string,
  favorites: Set<string>,
  history: CommandHistory[],
): number => {
  if (!query.trim()) return 0;

  let score = 0;

  // Title scoring
  if (command.title.toLowerCase().includes(query.toLowerCase())) {
    score += SEARCH_WEIGHTS.TITLE_EXACT;
  } else {
    score +=
      fuzzySearch(query, command.title) * (SEARCH_WEIGHTS.TITLE_FUZZY / 100);
  }

  // Description scoring
  if (command.description) {
    if (command.description.toLowerCase().includes(query.toLowerCase())) {
      score += SEARCH_WEIGHTS.DESCRIPTION_EXACT;
    } else {
      score +=
        fuzzySearch(query, command.description) *
        (SEARCH_WEIGHTS.DESCRIPTION_FUZZY / 100);
    }
  }

  // Keywords scoring
  if (command.keywords) {
    for (const keyword of command.keywords) {
      if (keyword.toLowerCase().includes(query.toLowerCase())) {
        score += SEARCH_WEIGHTS.KEYWORD_EXACT;
      } else {
        score +=
          fuzzySearch(query, keyword) * (SEARCH_WEIGHTS.KEYWORD_FUZZY / 100);
      }
    }
  }

  // Aliases scoring
  if (command.aliases) {
    for (const alias of command.aliases) {
      if (alias.toLowerCase().includes(query.toLowerCase())) {
        score += SEARCH_WEIGHTS.ALIAS_EXACT;
      } else {
        score += fuzzySearch(query, alias) * (SEARCH_WEIGHTS.ALIAS_FUZZY / 100);
      }
    }
  }

  // Boost for favorites
  if (favorites.has(command.id)) {
    score += SEARCH_WEIGHTS.FAVORITE_BOOST;
  }

  // Boost for recent usage
  const historyItem = history.find((h) => h.id === command.id);
  if (historyItem) {
    score += Math.min(historyItem.count * 3, SEARCH_WEIGHTS.RECENT_BOOST);
  }

  return Math.round(score);
};

/**
 * Flatten nested command structure for easier processing
 */
const flattenCommands = (groups: CommandGroup[]): CommandItem[] => {
  const flatten = (
    items: CommandItem[],
    parentPath: string[] = [],
  ): CommandItem[] => {
    return items.flatMap((item) => {
      const itemWithPath = { ...item, parent: parentPath.join("/") };
      if (item.children) {
        return [
          itemWithPath,
          ...flatten(item.children, [...parentPath, item.id]),
        ];
      }
      return [itemWithPath];
    });
  };

  return groups.flatMap((group) => flatten(group.items));
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook for managing command history with localStorage persistence
 */
const useCommandHistory = (enabled: boolean) => {
  const [history, setHistory] = React.useState<CommandHistory[]>(() =>
    enabled ? getStorageItem(STORAGE_KEYS.HISTORY, []) : [],
  );

  const updateHistory = React.useCallback(
    (commandId: string) => {
      if (!enabled) return;

      setHistory((prev) => {
        const existing = prev.find((h) => h.id === commandId);
        const updated = existing
          ? prev.map((h) =>
              h.id === commandId
                ? { ...h, count: h.count + 1, timestamp: Date.now() }
                : h,
            )
          : [...prev, { id: commandId, timestamp: Date.now(), count: 1 }];

        const sorted = updated
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 100); // Keep last 100 commands

        setStorageItem(STORAGE_KEYS.HISTORY, sorted);
        return sorted;
      });
    },
    [enabled],
  );

  return { history, updateHistory };
};

/**
 * Hook for managing favorites with localStorage persistence
 */
const useFavorites = (enabled: boolean) => {
  const [favorites, setFavorites] = React.useState<Set<string>>(() =>
    enabled ? new Set(getStorageItem(STORAGE_KEYS.FAVORITES, [])) : new Set(),
  );

  const toggleFavorite = React.useCallback(
    (commandId: string) => {
      if (!enabled) return;

      setFavorites((prev) => {
        const newFavorites = new Set(prev);
        if (newFavorites.has(commandId)) {
          newFavorites.delete(commandId);
        } else {
          newFavorites.add(commandId);
        }
        setStorageItem(STORAGE_KEYS.FAVORITES, Array.from(newFavorites));
        return newFavorites;
      });
    },
    [enabled],
  );

  return { favorites, toggleFavorite };
};

/**
 * Hook for managing keyboard shortcuts
 */
const useKeyboardShortcuts = (
  enabled: boolean,
  open: boolean,
  setOpen: (open: boolean) => void,
  search: string,
  setSearch: (search: string) => void,
  showFilters: boolean,
  setShowFilters: (show: boolean) => void,
) => {
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcut ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
        return;
      }

      // Only handle other shortcuts when dialog is open
      if (!open) return;

      // Clear search with Escape
      if (e.key === "Escape" && search) {
        e.preventDefault();
        setSearch("");
        return;
      }

      // Toggle filters with ⌘F
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowFilters(!showFilters);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, open, search, showFilters, setOpen, setSearch, setShowFilters]);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const tape = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="95"
    height="80"
    viewBox="0 0 95 80"
    fill="none"
  >
    <path
      d="M1 45L70.282 5L88.282 36.1769L19 76.1769L1 45Z"
      fill="currentColor"
      className="text-muted-foreground/20"
    />
    <path
      d="M69.6829 39.997C74.772 36.9233 80.2799 35.022 85.4464 32.0415C85.5584 31.9769 85.6703 31.912 85.782 31.8468L83.9519 38.6769C80.2833 32.3886 75.7064 26.4975 72.2275 20.0846C70.0007 15.9783 67.7966 11.8425 65.6183 7.69261L72.9746 9.66373C70.566 10.9281 68.1526 12.1837 65.7375 13.4301C59.1543 16.828 52.5477 20.1634 45.9059 23.4675C39.2779 26.7637 32.6138 30.0293 25.946 33.2683C21.417 35.4683 16.8774 37.6611 12.3408 39.8468C10.3494 40.8065 8.36335 41.7623 6.37228 42.7203C4.88674 43.4348 3.40117 44.1492 1.91563 44.8637C1.70897 44.9628 1.48389 45.0108 1.28779 44.994C1.0916 44.977 0.940536 44.8975 0.866099 44.7681C0.791689 44.6386 0.798739 44.4674 0.882816 44.289C0.966978 44.111 1.12195 43.9408 1.31146 43.8119C2.68692 42.8791 4.06239 41.9462 5.43785 41.0134C6.96571 39.9774 8.49068 38.9427 10.0185 37.9078C10.5758 38.2934 11.1526 38.4968 11.9006 38.3019C12.2823 38.2024 12.7844 37.9628 13.0812 37.66C13.3477 37.388 13.4958 37.092 13.6361 36.8103C13.7828 36.5157 13.922 36.236 14.1819 36.0157C14.6227 35.6416 14.9608 35.1461 15.3159 34.6256C15.4451 34.4362 15.5766 34.2432 15.7162 34.0517C17.1755 33.0653 18.6355 32.0797 20.0958 31.0952C20.7161 30.8123 21.2829 30.546 21.7287 30.2596C22.1286 30.0027 22.4405 29.6732 22.7349 29.3173C22.9611 29.1651 23.1873 29.0128 23.4135 28.8606C24.8734 27.8785 26.3349 26.8977 27.7969 25.9178C29.0653 25.3742 30.3884 24.7936 32.0404 23.9203C32.7524 23.544 33.4842 23.2235 34.1877 22.9153C35.2267 22.4601 36.204 22.0318 36.9653 21.4906C37.4742 21.1289 38.0837 20.8769 38.6916 20.6256C39.507 20.2886 40.3209 19.9521 40.8884 19.3523C41.2452 18.9751 41.5509 18.5904 41.8339 18.234C42.2841 17.6669 42.6773 17.1712 43.1308 16.8909C43.9827 16.3643 44.6366 15.763 45.2128 15.2329C45.9058 14.5954 46.4871 14.0607 47.1661 13.8832C47.2691 13.8563 47.3895 13.83 47.5253 13.8008C48.2409 13.6467 49.3854 13.4004 50.6721 12.4297C51.1302 12.084 51.5022 11.6584 51.8663 11.2413C52.3964 10.634 52.9113 10.0444 53.6546 9.74536C53.7656 9.70072 53.9081 9.70004 54.0379 9.69961C54.203 9.69906 54.3472 9.69852 54.3802 9.60751C54.4771 9.34055 54.6749 8.99305 54.8896 8.61527C55.0473 8.33772 55.2144 8.04348 55.3576 7.75325C57.0866 6.63773 58.8181 5.52571 60.5527 4.41789C61.3473 3.91034 62.1427 3.40353 62.9389 2.89753C63.4939 2.89483 64.0449 2.86301 64.5895 2.76514C65.3015 2.63711 66.1031 2.26098 67.1366 1.7766C67.4515 1.62902 67.788 1.47135 68.1502 1.30751C70.2985 0.211054 72.8781 0.719848 73.9745 2.86814C74.2063 3.38051 74.4505 3.94413 74.6959 4.57024C75.4715 6.54841 76.6121 8.38172 77.451 9.4943C77.6285 9.72958 77.8088 9.965 78.0022 10.2164C78.7359 11.1701 79.6521 12.3598 81.2553 14.6987C82.7718 16.9111 83.9554 18.8538 84.8446 20.3132C85.2985 21.0581 85.6753 21.6776 85.981 22.1424C86.5039 22.9378 87.13 23.9238 87.7583 24.9138C88.7415 26.463 89.7306 28.0221 90.3417 28.8752C90.5592 29.1788 90.7935 29.4941 91.046 29.8348C91.6954 30.711 92.4701 31.7564 93.4198 33.2106C94.9454 36.1998 94.2374 39.789 91.2483 41.3146C91.1356 41.3882 91.0205 41.4628 90.9029 41.5385C89.1849 42.6436 88.0561 43.2181 86.8458 43.7492C86.3539 43.965 85.8291 43.9984 85.2883 44.0321C84.5207 44.08 83.72 44.1298 82.9316 44.7081C82.7476 44.8431 82.5657 45.0123 82.3757 45.1895C82.0265 45.5149 81.649 45.8671 81.1774 46.0805C81.0129 46.1549 80.8442 46.1792 80.6788 46.2029C80.4969 46.229 80.3186 46.2548 80.1526 46.3463C79.5326 46.6883 78.9438 47.0464 78.4208 47.3647C77.7463 47.7753 77.1806 48.1194 76.7972 48.2768C76.1137 48.5573 75.4647 49.0342 74.8076 49.5175C74.3056 49.8867 73.7989 50.2601 73.2678 50.5517C71.7504 51.3848 69.7735 52.7209 67.7901 54.1904C67.0396 54.7464 66.2862 55.0138 65.3207 55.3561C64.7201 55.569 64.0372 55.8105 63.2221 56.1693C62.76 56.3726 62.4565 56.6971 62.1754 56.9973C61.9165 57.2738 61.6763 57.5299 61.3489 57.6526C61.0599 57.7608 60.7846 57.6688 60.5231 57.5815C60.2321 57.4843 59.9583 57.3929 59.702 57.5895C59.5657 57.6942 59.4406 57.8919 59.2918 58.1269C59.233 58.2198 59.1699 58.3187 59.1013 58.4201C59.0842 58.3791 59.0657 58.3442 59.0508 58.3184C58.9457 58.1356 58.6072 58.2028 58.2752 58.2689C58.1427 58.2953 58.0108 58.3219 57.8957 58.3319C57.4719 58.3686 56.8253 58.708 56.3466 58.9941C56.144 59.1151 55.9262 59.1653 55.672 59.224C55.4463 59.2761 55.1919 59.3347 54.894 59.4553C54.7241 59.5242 54.5728 59.541 54.4474 59.5545C54.3567 59.5642 54.2794 59.5724 54.2182 59.5982C54.1652 59.6205 54.1556 59.6959 54.1448 59.7807C54.137 59.8418 54.1285 59.908 54.1028 59.9628C54.0412 60.0939 53.9214 60.1919 53.8153 60.2225C53.7663 60.2366 53.7206 60.2358 53.6753 60.2349C53.6225 60.234 53.5698 60.2326 53.5113 60.2553C53.2429 60.3595 53.0377 60.5575 52.8246 60.7633C52.5903 60.9894 52.3457 61.225 51.9975 61.3556C51.8879 61.3967 51.7593 61.42 51.6348 61.4426C51.5045 61.4661 51.378 61.4893 51.2831 61.5308C50.8977 61.6994 50.6327 62.0265 50.389 62.3273C50.2269 62.5274 50.0737 62.716 49.9013 62.8385C49.5852 63.063 49.4962 63.3233 49.4307 63.5155C49.3967 63.615 49.3692 63.6966 49.3191 63.7453C49.2628 63.772 49.2053 63.7983 49.1487 63.8235C49.093 63.8403 49.0355 63.8576 48.9902 63.8888C48.9867 63.8912 48.9836 63.8939 48.9802 63.8963C48.6593 64.0309 48.3345 64.1466 48.0116 64.2613C47.2865 64.519 46.5701 64.7733 45.9244 65.2359C45.7853 65.3355 45.6724 65.487 45.5575 65.641C45.4167 65.8297 45.2727 66.0228 45.0741 66.1295C44.6008 66.3839 44.0696 66.5483 43.5464 66.7102C42.7594 66.9536 41.9904 67.1916 41.4633 67.722C41.2894 67.897 41.142 68.1064 40.9944 68.3169C40.9122 68.4342 40.8296 68.5523 40.7422 68.6643C40.7169 68.5646 40.6833 68.4767 40.652 68.3947C40.5875 68.2257 40.5324 68.081 40.5769 67.9054C40.6823 67.4901 40.7644 66.9549 40.5779 66.7069C40.5272 66.6396 40.4878 66.5548 40.4487 66.4691C40.3507 66.254 40.2505 66.0344 39.9558 66.0791C39.7572 66.1092 39.2569 66.204 39.082 66.5127C39.044 66.5799 39.0478 66.6675 39.0518 66.7648C39.0592 66.9397 39.0675 67.1471 38.838 67.329C38.7994 67.3596 38.7566 67.3917 38.7122 67.4244C38.5349 67.5546 38.3363 67.7 38.3194 67.8538C38.3 68.0309 38.4017 68.1621 38.5204 68.3152C38.6749 68.5145 38.8585 68.7512 38.8407 69.1745C38.8371 69.2583 38.7749 69.3221 38.728 69.3705C38.695 69.4045 38.6699 69.4309 38.6775 69.4511C38.6864 69.4742 38.7244 69.511 38.7726 69.5575C38.9428 69.7213 39.2396 70.008 38.8369 70.2599C38.7279 70.328 38.5912 70.3851 38.4686 70.4362C38.2879 70.5115 38.1379 70.5742 38.1516 70.6412C38.1569 70.6665 38.1652 70.6925 38.175 70.7189C38.0372 70.7894 37.8994 70.8599 37.7617 70.9305C37.5513 70.9626 37.3136 71.1075 37.017 71.2886C36.9451 71.3326 36.8691 71.3787 36.7896 71.4258C36.5175 71.5644 36.2453 71.7032 35.973 71.8416C35.7472 71.9341 35.4976 72.0165 35.2199 72.0788C34.6635 72.2038 34.1132 72.1978 33.5754 72.1917C33.3488 72.1891 33.1241 72.1864 32.9021 72.1937C32.9618 72.1444 33.0138 72.0968 33.0493 72.0522C33.292 71.7467 33.2773 71.4299 33.2636 71.1383C33.2545 70.9444 33.246 70.7614 33.3141 70.6009C33.4387 70.3069 33.3041 70.125 33.2048 69.9903C33.1532 69.9205 33.1115 69.863 33.1199 69.8097C33.1268 69.7669 33.1736 69.7216 33.2219 69.6748C33.264 69.6341 33.3074 69.5918 33.3263 69.5495C33.5565 69.0365 33.3423 68.9396 33.0306 68.7984C32.8587 68.7205 32.6575 68.6289 32.4843 68.4469C32.3112 68.2483 32.2881 68.1742 32.4435 67.9656C32.2185 67.9481 31.9934 67.9305 31.7683 67.913C31.7092 67.9567 31.7012 68.0535 31.7002 68.2073C31.6983 68.482 31.3496 68.7833 31.0772 69.0187C30.951 69.1277 30.8413 69.2227 30.7898 69.2944C30.5158 69.6756 30.7581 69.8463 30.9714 69.9966C31.0888 70.0793 31.1972 70.1559 31.206 70.2579C31.2099 70.3014 31.2524 70.3223 31.2955 70.3438C31.3288 70.3604 31.3629 70.3772 31.3798 70.4049C31.5026 70.6062 31.3709 70.8843 31.2487 71.1425C31.1788 71.2903 31.1123 71.4317 31.098 71.5486C31.0936 71.5842 31.0933 71.6181 31.0936 71.6508C31.0939 71.6984 31.0938 71.7441 31.0797 71.7913C31.0475 71.899 30.9277 72.0281 30.7962 72.1694C30.7288 72.2419 30.6585 72.3175 30.5954 72.3951C30.5137 72.4957 30.5226 72.5982 30.5314 72.7056C30.5377 72.7814 30.5436 72.8599 30.5186 72.9418C30.4732 73.0899 30.294 73.2374 30.1276 73.3743C30.0552 73.434 29.9853 73.492 29.9298 73.5468C29.9072 73.5691 29.9025 73.5904 29.9107 73.611C29.6455 73.8494 29.3946 74.0812 29.1507 74.3073C27.928 75.4406 26.8699 76.422 24.9338 77.2712C24.5678 77.4317 24.2027 77.6527 23.847 77.8987C22.8466 78.3902 21.8448 78.8802 20.8427 79.3685C18.9858 80.3162 16.7561 79.8764 15.8084 78.0196C15.6912 77.779 15.5741 77.5385 15.4571 77.2979C15.5046 76.9554 15.4922 76.5771 15.4159 76.1649C15.2724 75.3908 14.9393 74.7016 14.5464 73.8883C14.2558 73.287 13.9326 72.6178 13.6287 71.7959C13.1181 70.415 12.555 69.0197 11.8089 67.5091C11.066 66.0051 10.1771 64.3053 9.52376 63.1169C9.16763 62.469 8.944 61.7017 8.73537 60.9866C8.44191 59.9808 8.17835 59.0784 7.61958 58.7572C7.44108 58.6546 7.19967 58.5953 6.96499 58.5373C6.79786 58.496 6.63406 58.4547 6.49825 58.4001C6.36908 58.1203 6.23948 57.8403 6.11042 57.5602C6.02416 56.9799 5.8002 56.13 5.18227 55.5402C5.04958 55.251 4.91666 54.9617 4.78958 54.6817C4.50993 54.0719 4.23819 53.4743 3.96388 52.8713C3.87458 52.6744 3.78424 52.4755 3.69373 52.2762C3.69291 52.2743 3.69208 52.2724 3.69126 52.2705C3.50907 51.8692 3.32548 51.4649 3.14577 51.0668C3.06874 50.8964 2.99171 50.7259 2.91467 50.5554C2.71886 50.1222 2.52147 49.686 2.32862 49.2567C2.22665 49.0294 2.12332 48.8001 2.02011 48.5702C1.85267 48.1974 1.68389 47.8217 1.5164 47.4477C1.2455 46.843 0.976827 46.2405 0.707979 45.6366C0.664122 45.5378 0.643515 45.4304 0.652618 45.3375C0.661818 45.2445 0.699512 45.1734 0.760479 45.1383C0.821487 45.1032 0.902318 45.1064 0.987373 45.1452C1.07223 45.1841 1.15414 45.256 1.21749 45.3435C1.60461 45.8796 1.99066 46.4153 2.37757 46.9536C2.6167 47.2863 2.85707 47.6205 3.09529 47.9526C3.24216 48.1573 3.38828 48.3616 3.53359 48.564C3.80784 48.9465 4.08653 49.3367 4.3626 49.7236C4.47129 49.8757 4.57998 50.0279 4.68867 50.1801C4.94315 50.5364 5.20093 50.8992 5.4569 51.2592C5.45844 51.2614 5.45998 51.2636 5.46152 51.2658C5.58745 51.4429 5.71324 51.6197 5.83773 51.7946C6.22127 52.3348 6.60139 52.8703 6.98805 53.4185C7.18905 53.7011 7.39667 53.9966 7.60327 54.2896C7.7183 54.4528 7.83322 54.6155 7.94616 54.7753C8.00768 54.8628 8.06986 54.9515 8.13237 55.0408C9.57264 57.0858 10.9968 59.12 12.4247 61.1784C13.848 63.2287 15.2661 65.2871 16.6737 67.3431C18.0842 69.4042 19.4854 71.4657 20.8812 73.5327C21.1336 73.9063 21.3858 74.2801 21.6379 74.6539L17.477 73.539C30.2295 64.9403 43.1287 56.4797 56.1947 48.2951C58.1128 47.093 60.086 45.8684 62.0158 44.6777C63.9671 43.4745 65.8814 42.3014 67.8458 41.1091C68.4422 40.7466 69.0543 40.3763 69.6829 39.997Z"
      fill="currentColor"
      className="text-muted-foreground/20"
    />
  </svg>
);

/**
 * Advanced search command dialog component with fuzzy search, favorites, history, and more
 */
const SearchCommand = React.forwardRef<HTMLDivElement, SearchCommandProps>(
  (
    {
      trigger,
      commands = [],
      placeholder = "Type a command or search...",
      emptyMessage = "No results found.",
      className,
      maxRecent = 8,
      enableFuzzySearch = true,
      enableHistory = true,
      enableFavorites = true,
      enableShortcuts = true,
      showBadges = true,
      showScores = false,
      theme = "system",
      ...props
    },
    ref,
  ) => {
    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================

    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [selectedFilter, setSelectedFilter] =
      React.useState<FilterType>("all");
    const [showFilters, setShowFilters] = React.useState(false);

    const inputRef = React.useRef<HTMLInputElement>(null);

    // Custom hooks for advanced features
    const { history, updateHistory } = useCommandHistory(enableHistory);
    const { favorites, toggleFavorite } = useFavorites(enableFavorites);

    // Keyboard shortcuts
    useKeyboardShortcuts(
      enableShortcuts,
      open,
      setOpen,
      search,
      setSearch,
      showFilters,
      setShowFilters,
    );

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    /** All commands flattened for easier processing */
    const allCommands = React.useMemo(
      () => flattenCommands(commands),
      [commands],
    );

    /** Recent commands based on history */
    const recentCommands = React.useMemo(() => {
      if (!enableHistory) return [];

      return history
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxRecent)
        .map((h) => allCommands.find((c) => c.id === h.id))
        .filter(Boolean) as CommandItem[];
    }, [history, allCommands, maxRecent, enableHistory]);

    /** Favorite commands */
    const favoriteCommands = React.useMemo(() => {
      if (!enableFavorites) return [];
      return allCommands.filter((cmd) => favorites.has(cmd.id));
    }, [allCommands, favorites, enableFavorites]);

    /** Filtered and searched results */
    const searchResults = React.useMemo(() => {
      // Handle empty search based on selected filter
      if (!search.trim()) {
        switch (selectedFilter) {
          case "favorites":
            return favoriteCommands.length > 0
              ? [{ heading: "Favorites", items: favoriteCommands, icon: Star }]
              : [];

          case "recent":
            return recentCommands.length > 0
              ? [{ heading: "Recent", items: recentCommands, icon: Clock }]
              : [];

          case "all":
          default:
            const groups: CommandGroup[] = [];

            if (favoriteCommands.length > 0) {
              groups.push({
                heading: "Favorites",
                items: favoriteCommands,
                icon: Star,
              });
            }

            if (recentCommands.length > 0) {
              groups.push({
                heading: "Recent",
                items: recentCommands,
                icon: Clock,
              });
            }

            // Add original groups, excluding items already shown in favorites/recent
            const shownIds = new Set([
              ...favoriteCommands.map((c) => c.id),
              ...recentCommands.map((c) => c.id),
            ]);

            const filteredOriginalGroups = commands
              .map((group) => ({
                ...group,
                items: group.items.filter((item) => !shownIds.has(item.id)),
              }))
              .filter((group) => group.items.length > 0);

            return [...groups, ...filteredOriginalGroups];
        }
      }

      // Search with scoring
      const scoredCommands = allCommands
        .map((cmd) => ({
          ...cmd,
          score: enableFuzzySearch
            ? calculateCommandScore(cmd, search, favorites, history)
            : cmd.title.toLowerCase().includes(search.toLowerCase())
              ? 100
              : 0,
        }))
        .filter((cmd) => cmd.score > 0)
        .sort((a, b) => b.score - a.score);

      // Apply filter to search results
      let filteredCommands = scoredCommands;
      switch (selectedFilter) {
        case "favorites":
          filteredCommands = scoredCommands.filter((cmd) =>
            favorites.has(cmd.id),
          );
          break;
        case "recent":
          const recentIds = new Set(history.map((h) => h.id));
          filteredCommands = scoredCommands.filter((cmd) =>
            recentIds.has(cmd.id),
          );
          break;
      }

      if (filteredCommands.length === 0) return [];

      // Group by category
      const groupedResults = new Map<string, CommandItem[]>();
      filteredCommands.forEach((cmd) => {
        const category = cmd.category || "Other";
        if (!groupedResults.has(category)) {
          groupedResults.set(category, []);
        }
        groupedResults.get(category)!.push(cmd);
      });

      return Array.from(groupedResults.entries()).map(([heading, items]) => ({
        heading: `${heading} (${items.length})`,
        items,
        icon: Sparkles,
      }));
    }, [
      search,
      selectedFilter,
      allCommands,
      favoriteCommands,
      recentCommands,
      commands,
      favorites,
      history,
      enableFuzzySearch,
    ]);

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /** Handle command execution */
    const handleCommandSelect = React.useCallback(
      async (item: CommandItem) => {
        if (item.isAsync) setLoading(true);

        try {
          await item.action();
          updateHistory(item.id);
          setOpen(false);
          setSearch("");
        } catch (error) {
          console.error("Command execution failed:", error);
        } finally {
          setLoading(false);
        }
      },
      [updateHistory],
    );

    /** Handle favorite toggle */
    const handleFavoriteToggle = React.useCallback(
      (commandId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFavorite(commandId);
      },
      [toggleFavorite],
    );

    // ========================================================================
    // EFFECTS
    // ========================================================================

    /** Focus input when dialog opens */
    React.useEffect(() => {
      if (open && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }, [open]);

    /** Reset state when dialog closes */
    React.useEffect(() => {
      if (!open) {
        setSearch("");
        setLoading(false);
        setShowFilters(false);
        setSelectedFilter("all");
      }
    }, [open]);

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
          {/* Trigger Button */}
          <DialogPrimitive.Trigger asChild>
            {trigger || (
              <button
                className={cn(
                  "inline-flex items-center gap-3 rounded-xl border border-input bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:border-accent",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "group relative overflow-hidden min-w-[300px]",
                )}
              >
                <Search className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span className="flex-1 text-left">Search commands...</span>
                <div className="flex items-center gap-2">
                  <kbd className="hidden h-6 select-none items-center gap-1 rounded-md border bg-muted px-2 font-mono text-[11px] font-medium sm:flex">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                  <Zap className="h-3 w-3 opacity-60" />
                </div>
              </button>
            )}
          </DialogPrimitive.Trigger>

          <DialogPrimitive.Portal>
            {/* Overlay */}
            <DialogPrimitive.Overlay
              className={cn(
                "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              )}
            />

            {/* Content */}
            <DialogPrimitive.Content
              className={cn(
                "fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2",
                "border bg-background shadow-2xl sm:rounded-2xl",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
                "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
                "max-h-[85vh]",
              )}
            >
              {/* Visually hidden title for accessibility */}
              <DialogPrimitive.Title asChild>
                <VisuallyHidden>Search Commands</VisuallyHidden>
              </DialogPrimitive.Title>
              {/* Tape decorations */}
              <div className="hidden md:block absolute -top-9 -left-9 w-[80px] h-[36px] scale-75">
                {tape}
              </div>
              <div className="hidden md:block absolute -top-4 -right-14 rotate-90 w-[80px] h-[36px] scale-75">
                {tape}
              </div>
              <CommandPrimitive className="flex h-full w-full flex-col">
                {/* Header */}
                <div className="flex items-center border-b bg-muted/20 px-4">
                  <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />

                  <CommandPrimitive.Input
                    ref={inputRef}
                    value={search}
                    onValueChange={setSearch}
                    placeholder={placeholder}
                    className={cn(
                      "flex h-14 w-full bg-transparent py-4 text-base outline-none",
                      "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  />

                  <div className="flex items-center gap-2">
                    {loading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}

                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={cn(
                        "rounded-lg p-2 transition-colors hover:bg-accent",
                        showFilters && "bg-accent text-accent-foreground",
                      )}
                    >
                      <Filter className="h-4 w-4" />
                    </button>

                    <DialogPrimitive.Close
                      className={cn(
                        "rounded-lg p-2 opacity-70 transition-all hover:opacity-100 hover:bg-accent",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      )}
                    >
                      <X className="h-4 w-4" />
                    </DialogPrimitive.Close>
                  </div>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="border-b bg-muted/10 px-4 py-3">
                    <div className="flex gap-2">
                      {FILTER_CONFIGS.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setSelectedFilter(filter.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                            selectedFilter === filter.id
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
                          )}
                        >
                          <filter.icon className="h-4 w-4" />
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Command List */}
                <CommandPrimitive.List className="max-h-[400px] overflow-y-auto p-2">
                  <CommandPrimitive.Empty className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Search className="h-12 w-12 opacity-20" />
                      <p className="text-sm">{emptyMessage}</p>
                    </div>
                  </CommandPrimitive.Empty>

                  {searchResults.map((group, groupIndex) => (
                    <CommandPrimitive.Group
                      key={`${group.heading}-${groupIndex}`}
                    >
                      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground">
                        {group.icon && <group.icon className="h-3 w-3" />}
                        {group.heading}
                      </div>

                      {group.items.map((item) => (
                        <CommandPrimitive.Item
                          key={item.id}
                          onSelect={() => handleCommandSelect(item)}
                          className={cn(
                            "relative flex cursor-pointer select-none items-center rounded-xl px-3 py-3 text-sm outline-none transition-all",
                            "hover:bg-accent hover:text-accent-foreground",
                            "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
                            "group",
                          )}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {item.icon && (
                              <div className="flex-shrink-0 rounded-lg bg-muted/50 p-2">
                                <item.icon className="h-4 w-4" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">
                                  {item.title}
                                </span>
                                {showBadges && item.badge && (
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                    {item.badge}
                                  </span>
                                )}
                                {showScores && item.score && (
                                  <span className="text-[10px] text-muted-foreground bg-muted rounded px-1">
                                    {item.score}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {enableFavorites && (
                              <button
                                onClick={(e) =>
                                  handleFavoriteToggle(item.id, e)
                                }
                                className="rounded-md p-1.5 hover:bg-background/50 transition-colors"
                              >
                                {favorites.has(item.id) ? (
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                ) : (
                                  <StarOff className="h-3 w-3 text-muted-foreground" />
                                )}
                              </button>
                            )}

                            {item.shortcut && (
                              <kbd className="hidden h-6 select-none items-center gap-1 rounded-md border bg-muted px-2 font-mono text-[10px] font-medium sm:flex">
                                {item.shortcut}
                              </kbd>
                            )}

                            {item.children && (
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </CommandPrimitive.Item>
                      ))}
                    </CommandPrimitive.Group>
                  ))}
                </CommandPrimitive.List>

                {/* Footer */}
                <div className="border-t bg-muted/20 px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <kbd className="rounded bg-muted px-1">↑↓</kbd> navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="rounded bg-muted px-1">↵</kbd> select
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="rounded bg-muted px-1">⌘K</kbd> toggle
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>Advanced Search</span>
                    </div>
                  </div>
                </div>
              </CommandPrimitive>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </div>
    );
  },
);

SearchCommand.displayName = "SearchCommand";

// ============================================================================
// EXPORTS
// ============================================================================

export {
  SearchCommand,
  type CommandGroup,
  type CommandItem,
  type SearchCommandProps,
};
