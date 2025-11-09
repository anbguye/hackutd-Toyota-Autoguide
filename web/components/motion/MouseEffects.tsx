"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

export function MouseEffects() {
  const prefersReducedMotion = useReducedMotion();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const trailRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    // Check if hovering over interactive elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.closest("[data-slot='card']") ||
        target.closest("[data-slot='button']");
      setIsHovering(!!isInteractive);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [cursorX, cursorY, prefersReducedMotion]);

  // Create particle trail
  useEffect(() => {
    if (prefersReducedMotion || !particlesRef.current) return;

    const createParticle = () => {
      const particle = document.createElement("div");
      particle.className = "absolute pointer-events-none";
      particle.style.width = "4px";
      particle.style.height = "4px";
      particle.style.borderRadius = "50%";
      particle.style.background = "rgba(235, 10, 30, 0.8)";
      particle.style.boxShadow = "0 0 8px rgba(235, 10, 30, 0.6)";
      particle.style.left = `${mousePosition.x}px`;
      particle.style.top = `${mousePosition.y}px`;
      particle.style.transform = "translate(-50%, -50%)";
      particle.style.transition = "all 0.6s ease-out";
      particle.style.opacity = "1";

      particlesRef.current?.appendChild(particle);

      setTimeout(() => {
        particle.style.opacity = "0";
        particle.style.transform = `translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px) scale(0)`;
      }, 10);

      setTimeout(() => {
        particle.remove();
      }, 600);
    };

    const interval = setInterval(() => {
      if (isHovering) {
        createParticle();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [mousePosition, isHovering, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <>
      {/* Custom Cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <div
          className={`w-8 h-8 rounded-full border-2 transition-all duration-300 ${
            isHovering
              ? "border-primary bg-primary/20 scale-150 shadow-[0_0_20px_rgba(235,10,30,0.8)]"
              : "border-primary/60 bg-transparent scale-100 shadow-[0_0_10px_rgba(235,10,30,0.4)]"
          }`}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
          animate={{
            scale: isHovering ? [1, 1.5, 1] : 1,
          }}
          transition={{
            duration: 0.6,
            repeat: isHovering ? Infinity : 0,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Cursor Trail */}
      <motion.div
        ref={trailRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <div className="relative">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30"
              style={{
                width: `${8 - i * 1.2}px`,
                height: `${8 - i * 1.2}px`,
              }}
              animate={{
                scale: [1, 0.5, 0],
                opacity: [0.6 - i * 0.1, 0.3 - i * 0.05, 0],
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Particle Container */}
      <div ref={particlesRef} className="fixed inset-0 pointer-events-none z-[9997]" />

      {/* Glow Effect on Hover */}
      {isHovering && (
        <motion.div
          className="fixed pointer-events-none z-[9996]"
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
            translateX: "-50%",
            translateY: "-50%",
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        >
          <div className="w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
        </motion.div>
      )}
    </>
  );
}

