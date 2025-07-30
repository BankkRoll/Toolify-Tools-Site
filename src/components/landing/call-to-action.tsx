"use client";

import { useAnimations } from "@/stores/settings-store";
import { Clock, Shield, Zap } from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef } from "react";

export function CallToAction() {
  const animationsEnabled = useAnimations();
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const MotionSection = animationsEnabled ? m.section : "section";
  const MotionDiv = animationsEnabled ? m.div : "div";

  return (
    <MotionSection
      ref={featuresRef}
      initial={animationsEnabled ? "hidden" : undefined}
      animate={
        animationsEnabled ? (featuresInView ? "visible" : "hidden") : undefined
      }
      variants={animationsEnabled ? sectionVariants : undefined}
      id="features"
      className="py-16"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why Choose Our Tools?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built for professionals who value efficiency and reliability
          </p>
        </div>
        <MotionDiv
          variants={animationsEnabled ? staggerContainer : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? featuresInView
                ? "visible"
                : "hidden"
              : undefined
          }
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3"
        >
          <MotionDiv
            variants={animationsEnabled ? itemVariants : undefined}
            className="text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              <Zap className="h-8 w-8 text-accent-foreground" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-foreground">
              Lightning Fast
            </h3>
            <p className="mt-4 text-muted-foreground">
              All tools run directly in your browser with optimized performance
              and instant results.
            </p>
          </MotionDiv>
          <MotionDiv
            variants={animationsEnabled ? itemVariants : undefined}
            className="text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              <Shield className="h-8 w-8 text-accent-foreground" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-foreground">
              Privacy First
            </h3>
            <p className="mt-4 text-muted-foreground">
              Your data never leaves your device. All processing happens locally
              in your browser.
            </p>
          </MotionDiv>
          <MotionDiv
            variants={animationsEnabled ? itemVariants : undefined}
            className="text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              <Clock className="h-8 w-8 text-accent-foreground" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-foreground">
              Always Available
            </h3>
            <p className="mt-4 text-muted-foreground">
              No downloads or installations required. Access your tools from
              anywhere, anytime.
            </p>
          </MotionDiv>
        </MotionDiv>
      </div>
    </MotionSection>
  );
}
