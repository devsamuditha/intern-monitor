import type { Variants } from "motion/react";

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", stiffness: 300, damping: 24 } as any,
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { type: "spring", stiffness: 400, damping: 28 } as any,
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const hoverLift = {
  whileHover: { y: -2, scale: 1.01 },
  transition: { type: "spring", stiffness: 300, damping: 24 } as any,
};

export const tapScale = {
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 400, damping: 28 } as any,
};

export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 } as any,
};
