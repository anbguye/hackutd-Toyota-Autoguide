"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp, staggerContainer } from "@/lib/motion/variants";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionSection({ children, className, ...props }: PageShellProps & React.HTMLAttributes<HTMLElement>) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <section className={className} {...props}>{children}</section>;
  }

  return (
    <motion.section
      variants={fadeUp}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
}

