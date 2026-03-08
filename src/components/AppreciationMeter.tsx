"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { siteData } from "@/data/siteData";

interface AppreciationMeterProps {
  appreciationResult?: string;
}

export default function AppreciationMeter(props: AppreciationMeterProps) {
  const appreciationResult = props.appreciationResult ?? siteData.appreciationResult;
  const [level, setLevel] = useState(50);
  const [showResult, setShowResult] = useState(false);
  const [floaters, setFloaters] = useState<
    { id: number; x: number; y: number; size: number; emoji: string }[]
  >([]);
  const counter = useRef(0);

  const getLevelLabel = () => {
    if (level < 25) return { text: "A lot 💕", color: "#8B5CF6" };
    if (level < 50) return { text: "So much 💖", color: "#FF5DA2" };
    if (level < 75) return { text: "Immensely 🔥", color: "#FF3366" };
    return { text: "OFF THE CHARTS 💥", color: "#FF3366" };
  };

  const spawnFloater = useCallback(() => {
    const count = level > 75 ? 3 : 1;
    const items = Array.from({ length: count }, () => {
      const id = counter.current++;
      return {
        id,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        size: 14 + Math.random() * 18,
        emoji: ["❤️", "💖", "💗", "🦋", "✨"][
          Math.floor(Math.random() * 5)
        ],
      };
    });
    setFloaters((prev) => [...prev.slice(-12), ...items]);
    items.forEach((f) =>
      setTimeout(
        () => setFloaters((prev) => prev.filter((fl) => fl.id !== f.id)),
        2500
      )
    );
  }, [level]);

  useEffect(() => {
    if (level >= 90 && !showResult) {
      setTimeout(() => setShowResult(true), 600);
    }
  }, [level, showResult]);

  useEffect(() => {
    spawnFloater();
  }, [level, spawnFloater]);

  const info = getLevelLabel();

  return (
    <section
      id="appreciation-meter"
      className="relative min-h-[80dvh] py-16 sm:py-20 px-5 overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "#FFF8FA" }}
    >
      {/* Floaters */}
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.div
            key={f.id}
            className="absolute pointer-events-none z-[5]"
            style={{ left: `${f.x}%`, top: `${f.y}%`, fontSize: f.size }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0.6],
              y: -70,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            {f.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div
        className="relative z-10 w-full max-w-xl text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Badge */}
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          style={{
            background: "rgba(255,93,162,0.08)",
            color: "#FF5DA2",
            border: "1px solid rgba(255,93,162,0.15)",
          }}
        >
          📏 Appreciation Meter
        </span>

        <h2
          className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-2"
          style={{ color: "#2d1b3d" }}
        >
          How Much I Appreciate You
        </h2>
        <p className="mb-8" style={{ color: "#6b5280" }}>
          Try adjusting the slider…
        </p>

        {/* Meter card */}
        <div className="lab-card p-6 sm:p-8">
          <div
            className="text-5xl sm:text-6xl font-bold mb-1"
            style={{ color: info.color }}
          >
            {level}%
          </div>
          <p
            className="text-sm font-semibold mb-5"
            style={{ color: info.color }}
          >
            {info.text}
          </p>

          <input
            type="range"
            min="0"
            max="100"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer mb-2"
            style={{
              background:
                "linear-gradient(90deg, #8B5CF6, #FF5DA2 50%, #FF3366 100%)",
              accentColor: "#FF3366",
            }}
          />
          <div
            className="flex justify-between text-xs"
            style={{ color: "#9f8ab5" }}
          >
            <span>A lot</span>
            <span>More than anything</span>
          </div>

          {/* Bar viz */}
          <div className="mt-4 flex gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-3 rounded-full transition-colors duration-300"
                style={{
                  background:
                    i < Math.floor(level / 5)
                      ? i < 6
                        ? "#8B5CF6"
                        : i < 14
                          ? "#FF5DA2"
                          : "#FF3366"
                      : "rgba(139,92,246,0.06)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Result at max */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <div className="lab-card p-5 sm:p-6">
                <p
                  className="text-sm uppercase tracking-widest mb-2 font-bold"
                  style={{ color: "#8B5CF6" }}
                >
                  📋 Result
                </p>
                <p
                  className="font-serif text-xl sm:text-2xl font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, #FF3366, #8B5CF6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {appreciationResult}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
