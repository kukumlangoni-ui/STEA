import React from "react";
import { motion } from "framer-motion";

export default function AnimatedAssistantOrb() {
  const sparkles = [
    { top: "25%", left: "30%" },
    { top: "60%", left: "75%" },
    { top: "40%", left: "20%" },
    { top: "70%", left: "40%" },
    { top: "30%", left: "80%" },
    { top: "55%", left: "15%" },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center py-12">
      {/* Main Orb Container */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        
        {/* Outer Cinematic Glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-[#f5b642] blur-[60px]"
        />

        {/* Breathing Ring */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 20, repeat: Infinity, ease: "linear" }
          }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-[#f5b642]/30"
        />

        {/* The Core Orb */}
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-32 h-32 rounded-full bg-[#0b0f1a] border-2 border-[#f5b642] shadow-[0_0_30px_rgba(245,182,66,0.4)] flex items-center justify-center overflow-hidden"
        >
          {/* Internal Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f5b642]/20 to-transparent" />
          
          {/* Eyes Container */}
          <div className="flex gap-6 z-10">
            {/* Left Eye */}
            <div className="relative">
              <motion.div
                animate={{
                  scaleY: [1, 1, 0.1, 1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  times: [0, 0.45, 0.5, 0.55, 1],
                }}
                className="w-3 h-5 bg-[#f5b642] rounded-full shadow-[0_0_10px_#f5b642]"
              />
            </div>
            {/* Right Eye */}
            <div className="relative">
              <motion.div
                animate={{
                  scaleY: [1, 1, 0.1, 1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  times: [0, 0.45, 0.5, 0.55, 1],
                }}
                className="w-3 h-5 bg-[#f5b642] rounded-full shadow-[0_0_10px_#f5b642]"
              />
            </div>
          </div>

          {/* Scanning Line Effect */}
          <motion.div
            animate={{
              top: ["-100%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute left-0 right-0 h-[1px] bg-[#f5b642]/40 shadow-[0_0_8px_#f5b642]"
          />
        </motion.div>

        {/* Floating Sparkles */}
        {sparkles.map((pos, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -40, 0],
              x: [0, (i % 2 === 0 ? 20 : -20), 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
            className="absolute w-1 h-1 bg-[#ffd17c] rounded-full blur-[1px]"
            style={{
              top: pos.top,
              left: pos.left,
            }}
          />
        ))}
      </div>

      {/* Caption */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          STEA Assistant <span className="text-[#f5b642]">Live</span>
        </h2>
        <p className="text-[#f5b642]/60 font-medium text-sm sm:text-base uppercase letter-spacing-widest">
          Niko hapa kukusaidia 24/7
        </p>
      </motion.div>
    </div>
  );
}
