"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

interface NumberCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function NumberCounter({
  value,
  duration = 600,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: NumberCounterProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const spring = useSpring(prefersReducedMotion ? value : 0, {
    damping: 30,
    stiffness: 100,
  });

  const display = useTransform(spring, (current) => {
    if (prefersReducedMotion) {
      return value.toFixed(decimals);
    }
    return current.toFixed(decimals);
  });

  useEffect(() => {
    if (isInView && !prefersReducedMotion) {
      spring.set(value);
    }
  }, [isInView, value, spring, prefersReducedMotion]);

  return (
    <motion.span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </motion.span>
  );
}

