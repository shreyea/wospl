"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { siteData } from "@/data/siteData";
import type { TemplateMemory } from "@/lib/types";

interface MemoryGeneratorProps {
  memories?: TemplateMemory[];
}

export default function MemoryGenerator(props: MemoryGeneratorProps) {
  const memories = (props.memories ?? siteData.memories).slice(0, 3); // Limit to 3 memories max
  const [currentMemory, setCurrentMemory] = useState<number | null>(null);
  const [revealKey, setRevealKey] = useState(0);
  const [usedCount, setUsedCount] = useState(0);
  const used = useRef(new Set<number>());

  const generateMemory = () => {
    const available = memories
      .map((_, i) => i)
      .filter((i) => !used.current.has(i));

    let nextIdx: number;
    if (available.length > 0) {
      nextIdx = available[Math.floor(Math.random() * available.length)];
    } else {
      used.current = new Set();
      nextIdx = Math.floor(Math.random() * memories.length);
    }

    used.current.add(nextIdx);
    setCurrentMemory(nextIdx);
    setUsedCount(used.current.size);
    setRevealKey((k) => k + 1);
  };

  const memory =
    currentMemory !== null ? memories[currentMemory] : null;

  return (
    <section
      id="memory-generator"
      className="relative min-h-[80dvh] py-16 sm:py-20 px-5 overflow-hidden flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(180deg, #FFF8FA 0%, #fff0f4 50%, #FFF8FA 100%)",
      }}
    >
      <motion.div
        className="relative z-10 w-full max-w-lg text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Badge */}
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          style={{
            background: "rgba(139,92,246,0.08)",
            color: "#8B5CF6",
            border: "1px solid rgba(139,92,246,0.15)",
          }}
        >
          💕 Memory Vault
        </span>

        <h2
          className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-3"
          style={{ color: "#2d1b3d" }}
        >
          Memory Generator
        </h2>
        <p className="mb-8" style={{ color: "#6b5280" }}>
          Click to relive a random moment together.
        </p>

        {/* Generate button */}
        <motion.button
          className="lab-button text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 mb-8"
          onClick={generateMemory}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎲 Generate Random Memory
        </motion.button>

        {/* Memory card — polaroid style */}
        <AnimatePresence mode="wait">
          {memory && (
            <motion.div
              key={revealKey}
              className="relative mx-auto max-w-sm"
              initial={{ opacity: 0, scale: 0.8, rotate: -5, y: 30 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: [-3, 2, 0][revealKey % 3],
                y: 0,
              }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#fff",
                  padding: "12px 12px 48px 12px",
                  boxShadow:
                    "0 8px 30px rgba(139,92,246,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                  border: "1px solid rgba(139,92,246,0.08)",
                }}
              >
                {/* Photo area */}
                <div
                  className="aspect-4/3 rounded-xl overflow-hidden relative"
                  style={{
                    background:
                      "linear-gradient(135deg, #FFC6D3, #f0d0ff, #FFC6D3)",
                  }}
                >
                  {memory.photo && memory.photo.startsWith("http") ? (
                    <img
                      src={memory.photo}
                      alt={memory.text || "Memory photo"}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl opacity-[0.15]">
                        {memory.doodle}
                      </span>
                    </div>
                  )}
                  <div
                    className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{
                      background: "rgba(255,255,255,0.8)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    📌
                  </div>
                </div>

                {/* Caption */}
                <p
                  className="font-handwritten text-base sm:text-lg text-center mt-3 px-2"
                  style={{ color: "#2d1b3d" }}
                >
                  &ldquo;{memory.text}&rdquo;
                </p>
              </div>

              {/* Hearts burst */}
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={`${revealKey}-h-${i}`}
                  className="absolute text-lg pointer-events-none"
                  style={{ left: `${20 + i * 15}%`, top: "50%" }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.2, 0.6],
                    y: -40 - (i + 1) * 12,
                    x: (i - 2) * 20,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.2 + i * 0.1,
                    ease: "easeOut",
                  }}
                >
                  {["❤️", "💕", "💖", "💗", "💓"][i]}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Counter */}
        {usedCount > 0 && (
          <motion.p
            className="mt-6 text-xs"
            style={{ color: "#9f8ab5" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {usedCount} / {memories.length} memories unlocked 💕
          </motion.p>
        )}
      </motion.div>
    </section>
  );
}
