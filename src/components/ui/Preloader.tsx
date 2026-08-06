"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import PreloaderAnimation from "./PreloaderAnimation";

interface PreloaderProps {
  visible: boolean;
  onExited?: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ visible, onExited }) => {
  return (
    <AnimatePresence onExitComplete={onExited}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-teal-950 via-cyan-950 to-emerald-950 bg-black/30 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <PreloaderAnimation running={visible} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { Preloader };
export default Preloader;