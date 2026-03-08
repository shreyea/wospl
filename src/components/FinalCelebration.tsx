"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { siteData } from "../data/siteData";

/* Confetti hearts */
function ConfettiHearts({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<
    { id: number; x: number; size: number; delay: number; dur: number; emoji: string }[]
  >([]);

  useEffect(() => {
    if (!active) return;
    setPieces(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: 12 + Math.random() * 16,
        delay: Math.random() * 2.5,
        dur: 3 + Math.random() * 3,
        emoji: ["❤️", "💕", "💖", "💗", "🦋", "✨"][Math.floor(Math.random() * 6)],
      }))
    );
  }, [active]);

  if (!pieces.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map((c) => (
        <div
          key={c.id}
          className="absolute"
          style={{
            left: `${c.x}%`,
            top: "-20px",
            fontSize: c.size,
            animation: `confetti-fall ${c.dur}s ease-in ${c.delay}s forwards`,
          }}
        >
          {c.emoji}
        </div>
      ))}
    </div>
  );
}

interface FinalCelebrationProps {
  finalMessage?: string;
  personalNote?: string;
  herName?: string;
}

export default function FinalCelebration(props: FinalCelebrationProps) {
  const finalMessage = props.finalMessage ?? siteData.finalMessage;
  const personalNote = props.personalNote ?? siteData.personalNote;
  const herName = props.herName ?? siteData.herName;
  const [showMessage, setShowMessage] = useState(false);
  const [showPersonal, setShowPersonal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setShowMessage(true), 600);
    const t2 = setTimeout(() => setShowPersonal(true), 2000);
    const t3 = setTimeout(() => setShowConfetti(true), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [inView]);

  return (
    <section
      id="final-celebration"
      className="relative min-h-[100dvh] py-16 sm:py-20 px-5 overflow-hidden flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(180deg, #FFF8FA 0%, #fff0f4 20%, #ffe8f0 50%, #ffd8e8 75%, #FFC6D3 100%)",
      }}
    >
      <ConfettiHearts active={showConfetti} />

      <motion.div
        className="relative z-10 text-center max-w-xl"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        onViewportEnter={() => setInView(true)}
      >
        {/* Celebration emoji */}
        <motion.div
          className="text-5xl sm:text-6xl mb-6"
          animate={
            showMessage
              ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          🎉
        </motion.div>

        {/* Main headline */}
        <motion.h2
          className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-5 leading-[1.1]"
          initial={{ opacity: 0, y: 20 }}
          animate={showMessage ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span style={{ color: "#2d1b3d" }}>Happy </span>
          <span
            style={{
              background: "linear-gradient(135deg, #FF3366, #8B5CF6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Women&apos;s Day
          </span>
        </motion.h2>

        {/* Message */}
        <motion.p
          className="text-lg sm:text-xl md:text-2xl mb-6"
          style={{ color: "#6b5280" }}
          initial={{ opacity: 0 }}
          animate={showMessage ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          &ldquo;{finalMessage}&rdquo;
        </motion.p>

        {/* Divider */}
        <motion.div
          className="section-divider mx-auto mb-6"
          initial={{ scaleX: 0 }}
          animate={showPersonal ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8 }}
        />

        {/* Personal note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={showPersonal ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
        >
          <p
            className="font-handwritten text-2xl sm:text-3xl md:text-4xl leading-relaxed mb-2"
            style={{ color: "#FF3366" }}
          >
            &ldquo;{personalNote}&rdquo;
          </p>
          <p className="text-sm mt-4" style={{ color: "#9f8ab5" }}>
            — With all my love, for {herName} 💕
          </p>
        </motion.div>

        {/* Share button */}
        <motion.button
          className="lab-button text-base px-6 py-3 mt-8"
          initial={{ opacity: 0 }}
          animate={showPersonal ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (typeof navigator !== "undefined" && navigator.share) {
              navigator.share({
                title: "Happy Women's Day",
                text: personalNote,
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
        >
          Share The Love 💕
        </motion.button>
      </motion.div>
    </section>
  );
}
