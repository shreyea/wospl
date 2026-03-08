"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { siteData } from "@/data/siteData";

/* Cursor heart trail */
function HeartTrail() {
  const [hearts, setHearts] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const counterRef = useRef(0);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (Math.random() > 0.85) {
        const id = counterRef.current++;
        setHearts((prev) => [
          ...prev.slice(-8),
          { id, x: e.clientX, y: e.clientY },
        ]);
        setTimeout(
          () => setHearts((prev) => prev.filter((h) => h.id !== id)),
          1200
        );
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div className="fixed inset-0 pointer-events-none z-100">
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.span
            key={h.id}
            className="absolute text-sm"
            style={{ left: h.x - 6, top: h.y - 6 }}
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{ opacity: 0, scale: 0.3, y: -40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            💕
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* Floating background hearts */
function FloatingHearts() {
  const [hearts, setHearts] = useState<
    { id: number; x: number; size: number; delay: number; dur: number }[]
  >([]);

  useEffect(() => {
    setHearts(
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: 12 + Math.random() * 18,
        delay: Math.random() * 5,
        dur: 5 + Math.random() * 6,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hearts.map((h) => (
        <div
          key={h.id}
          className="absolute"
          style={{
            left: `${h.x}%`,
            bottom: "-20px",
            fontSize: h.size,
            animation: `float-up ${h.dur}s ease-out ${h.delay}s infinite`,
            opacity: 0.12,
          }}
        >
          {["💕", "💖", "🦋", "✨"][h.id % 4]}
        </div>
      ))}
    </div>
  );
}

interface HeroSectionProps {
  heroHeadline?: string;
  heroSubtext?: string;
  heroLoading?: string;
  heroPhotos?: string[];
}

export default function HeroSection(props: HeroSectionProps) {
  const heroHeadline = props.heroHeadline ?? siteData.heroHeadline;
  const heroSubtext = props.heroSubtext ?? siteData.heroSubtext;
  const heroLoading = props.heroLoading ?? siteData.heroLoading;
  const heroPhotos = props.heroPhotos ?? siteData.heroPhotos ?? [];

  const [loadingDone, setLoadingDone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoadingDone(true), 400);
          return 100;
        }
        return p + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <HeartTrail />
      <section
        id="hero"
        className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden px-5"
        style={{
          background:
            "linear-gradient(180deg, #FFF8FA 0%, #fff0f4 40%, #ffe8f0 70%, #FFF8FA 100%)",
        }}
      >
        <FloatingHearts />

        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(139,92,246,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Soft blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,93,162,0.1) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
            }}
          />
        </div>

        <motion.div
          className="relative z-10 text-center max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Celebration emoji crown */}
          <motion.div
            className="text-4xl sm:text-5xl mb-5"
            animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            👑
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-5 leading-[1.1] text-center"
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #533483 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {heroHeadline.split("Favorite").map((part, i) =>
              i === 0 ? (
                <span key={i}>
                  {part}
                  <span style={{
                    background: "linear-gradient(135deg, #FF3366, #FF5DA2, #8B5CF6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text"
                  }}>Favorite</span>
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 px-2 text-center"
            style={{
              background: "linear-gradient(135deg, #4a4a6a, #6b5280, #8b5ca3)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            &ldquo;{heroSubtext}&rdquo;
          </motion.p>

         

          {/* Loading section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <AnimatePresence mode="wait">
              {!loadingDone ? (
                <motion.div
                  key="loading"
                  className="lab-card p-4 sm:p-5 md:p-6 max-w-xs sm:max-w-sm mx-auto"
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                >
                  <p
                    className="text-sm font-semibold mb-3"
                    style={{ color: "#8B5CF6" }}
                  >
                    {heroLoading}
                  </p>
                  <div
                    className="h-2.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(139,92,246,0.08)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, #FF3366, #FF5DA2, #8B5CF6)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s linear infinite",
                      }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <p
                    className="text-xs mt-2 font-mono"
                    style={{ color: "#9f8ab5" }}
                  >
                    {progress}% complete
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="flex flex-col items-center gap-4"
                >
                  <span className="status-badge status-success text-sm">
                    ✓ Analysis complete — results below
                  </span>

                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ color: "#FF3366" }}
                    >
                      <path
                        d="M12 5v14m0 0l-6-6m6 6l6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Floating emojis */}
        {["💕", "🦋", "✨", "💖", "🌸"].map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-xl sm:text-2xl pointer-events-none"
            style={{
              left: `${10 + i * 20}%`,
              top: `${15 + (i % 3) * 28}%`,
              opacity: 0.1,
            }}
            animate={{
              y: [0, -12, 0],
              rotate: [0, i % 2 === 0 ? 8 : -8, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.6,
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </section>
    </>
  );
}
