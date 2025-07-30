"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
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
import {
  getActiveToolsByCategory,
  getToolsByCategory,
} from "@/lib/tools-config";
import { useAnimations } from "@/stores/settings-store";
import {
  Beaker,
  Clock,
  DollarSign,
  Fuel,
  Gauge,
  HardDrive,
  Power,
  Radio,
  RotateCcw,
  Ruler,
  FastForwardIcon as SpeedIcon,
  Square,
  Thermometer,
  Weight,
  Zap,
} from "lucide-react";
import { m, useInView } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

/**
 * Icon mapping for unit converter tools
 */
const iconMap = {
  Ruler,
  Weight,
  Thermometer,
  Square,
  Beaker,
  HardDrive,
  RotateCcw,
  Gauge,
  Zap,
  Power,
  FastForwardIcon: SpeedIcon,
  Radio,
  Fuel,
  DollarSign,
  Clock,
};

/**
 * Unit converters tools page
 */
export default function UnitToolsPage() {
  const unitTools = getToolsByCategory("units");
  const activeTools = getActiveToolsByCategory("units");
  const animationsEnabled = useAnimations();

  // Local storage for user preferences
  const [recentlyUsed] = useLocalStorage<string[]>("units-recently-used", []);

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
    <ToolLayout toolId="units">
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
            <h2 className="text-2xl font-bold">Unit Converters</h2>
            <p className="text-muted-foreground">
              Comprehensive unit conversion tools for all measurement systems
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {activeTools.length}/{unitTools.length} Available
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
          {unitTools.map((tool, index) => {
            const IconComponent =
              iconMap[tool.icon as keyof typeof iconMap] || Ruler;
            const isActive = tool.status === "active";
            const isRecentlyUsed = recentlyUsed.includes(tool.id);

            return (
              <MotionDiv
                key={tool.id}
                variants={animationsEnabled ? cardVariants : undefined}
                custom={index}
              >
                <Card
                  className={`hover:shadow-md transition-shadow ${
                    !isActive ? "opacity-75" : ""
                  } ${isRecentlyUsed ? "ring-2 ring-primary/20" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <IconComponent className="h-6 w-6 text-primary" />
                      <div className="flex items-center gap-2">
                        {isRecentlyUsed && (
                          <Badge variant="secondary" className="text-xs">
                            Recent
                          </Badge>
                        )}
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive
                            ? "Ready"
                            : tool.status === "beta"
                              ? "Beta"
                              : "Coming Soon"}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {isActive ? (
                      <Button asChild className="w-full">
                        <Link href={tool.href}>Open Tool</Link>
                      </Button>
                    ) : (
                      <Button disabled className="w-full">
                        {tool.status === "beta" ? "Beta Access" : "Coming Soon"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </MotionDiv>
            );
          })}
        </MotionDiv>
      </MotionSection>
    </ToolLayout>
  );
}
