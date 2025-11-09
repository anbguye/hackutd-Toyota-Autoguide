/**
 * Framer Motion variants for Toyota brand animations
 * Maintains brand identity: confidence, precision, reliability
 */

export const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.12,
    },
  },
};

export const liftCard = {
  rest: {
    y: 0,
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  hover: {
    y: -4,
    boxShadow: "0 16px 32px rgba(0,0,0,0.35)",
    borderColor: "#EB0A1E",
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

export const buttonHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.04,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 17,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 17,
    },
  },
};

export const focusRing = {
  rest: {
    boxShadow: "0 0 0 0px rgba(235,10,30,0)",
  },
  focus: {
    boxShadow: "0 0 0 3px rgba(235,10,30,0.3)",
    transition: {
      duration: 0.12,
      ease: "easeOut",
    },
  },
};

export const specReveal = {
  hidden: { opacity: 0, x: -8 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export const specStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

export const scanLine = {
  hidden: { x: "-100%", opacity: 0 },
  show: {
    x: "100%",
    opacity: [0, 1, 1, 0],
    transition: {
      duration: 1.2,
      ease: "easeInOut",
      times: [0, 0.1, 0.9, 1],
    },
  },
};

export const rowHover = {
  rest: {
    borderLeftWidth: 0,
    borderLeftColor: "transparent",
  },
  hover: {
    borderLeftWidth: 3,
    borderLeftColor: "#EB0A1E",
    transition: {
      duration: 0.18,
      ease: "easeOut",
    },
  },
};

export const pulseOnChange = {
  pulse: {
    backgroundColor: ["#EB0A1E", "#FFFFFF"],
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

export const counterAnimation = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

