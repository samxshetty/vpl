"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function Splash() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem("vpl_splash_seen");
    if (hasSeenSplash) {
      setShowSplash(false);
    } else {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("vpl_splash_seen", "true");
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505] overflow-hidden"
        >
          {/* Subtle Background Glow */}
          <motion.div
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#ffffff_0%,_transparent_60%)] blur-[100px]"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, filter: "blur(20px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.2, ease: "backOut" }}
            className="relative z-10 flex flex-col items-center justify-center"
          >
            <div className="relative w-[300px] md:w-[400px] h-[150px] md:h-[200px] overflow-hidden">
              <Image 
                src="/vpl-logo-transparent.png" 
                alt="VPL Official Logo"
                fill
                className="object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                priority
              />
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-4"
            >
              <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mb-3" />
              <p className="text-[10px] tracking-[0.4em] text-white/50 uppercase text-center font-mono">
                Initializing Arena
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
