"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ToolCard } from "@/components/tools/tool-card";
import { Badge } from "@/components/ui/badge";
import {
  getActiveToolsByCategory,
  getToolsByCategory,
} from "@/lib/tools-config";
import { useAnimations } from "@/stores/settings-store";
import {
  ArrowUpDown,
  Calculator,
  CheckCircle,
  Crown,
  Divide,
  RatioIcon as Factorial,
  GitBranch,
  Grid,
  Hash,
  List,
  Microscope,
  Percent,
  RotateCcw,
  Shuffle,
  Target,
  TrendingUp,
  Type,
  Zap,
} from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef } from "react";

/**
 * Icon mapping for number tools
 */
const iconMap = {
  Hash,
  Calculator,
  Shuffle,
  CheckCircle,
  Percent,
  Divide,
  List,
  RotateCcw,
  Zap,
  Crown,
  Grid,
  Microscope,
  Target,
  GitBranch,
  RatioIcon: Factorial,
  TrendingUp,
  Type,
  ArrowUpDown,
};

/**
 * Number tools overview page
 */
export default function NumberToolsPage() {
  const numberTools = getToolsByCategory("number");
  const activeTools = getActiveToolsByCategory("number");
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const headerRef = useRef(null);
  const toolsRef = useRef(null);

  // InView hooks
  const headerInView = useInView(headerRef, { once: true, amount: 0.2 });
  const toolsInView = useInView(toolsRef, { once: true, amount: 0.2 });

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

  return (
    <ToolLayout toolId="number">
      <MotionSection
        ref={headerRef}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={
          animationsEnabled ? (headerInView ? "visible" : "hidden") : undefined
        }
        variants={animationsEnabled ? sectionVariants : undefined}
        className="space-y-6"
      >
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
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold">Number Tools</h2>
            <p className="text-muted-foreground">
              Mathematical utilities for calculations and number processing
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {activeTools.length}/{numberTools.length} Available
          </Badge>
        </MotionDiv>

        <MotionDiv
          ref={toolsRef}
          variants={animationsEnabled ? staggerContainer : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled ? (toolsInView ? "visible" : "hidden") : undefined
          }
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {numberTools.map((tool, index) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              animationDelay={index}
              enableHoverAnimations={animationsEnabled}
            />
          ))}
        </MotionDiv>
      </MotionSection>
    </ToolLayout>
  );
}
