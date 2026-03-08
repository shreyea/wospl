"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { siteData } from "@/data/siteData";

function StatCard({
  stat,
  index,
}: {
  stat: (typeof siteData.stats)[number];
  index: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const hasDisplayText = !!stat.displayText;

  useEffect(() => {
    if (!started || hasDisplayText) return;
    let start = 0;
    const end = stat.value;
    const inc = end / 125;
    const t = setInterval(() => {
      start += inc;
      if (start >= end) {
        setCount(end);
        clearInterval(t);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(t);
  }, [started, stat.value, hasDisplayText]);

  return (
    <motion.div
      className="lab-card p-6 sm:p-8 text-center relative overflow-hidden cursor-pointer"
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: 0.1 + index * 0.1, type: "spring", damping: 15 }}
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.98 }}
      onViewportEnter={() => setStarted(true)}
    >
      {/* Emoji */}
      <div className="text-3xl sm:text-4xl mb-3">{stat.emoji}</div>

      {/* Number / Text */}
      <div
        className="text-4xl sm:text-5xl md:text-6xl font-bold"
        style={{ color: stat.color }}
      >
        {hasDisplayText ? stat.displayText : (
          <>
            {stat.prefix}
            {count}
            {stat.suffix}
          </>
        )}
      </div>

      {/* Label */}
      <p
        className="text-sm sm:text-base font-medium mt-2"
        style={{ color: "#6b5280" }}
      >
        {stat.label}
      </p>
    </motion.div>
  );
}

interface ImpactStatsProps {
  stats?: typeof siteData.stats;
}

export default function ImpactStats(props: ImpactStatsProps) {
  const stats = props.stats ?? siteData.stats;
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={ref}
      id="impact-stats"
      className="relative py-16 sm:py-20 px-5 overflow-hidden"
      style={{ background: "#FFF8FA" }}
    >
      {/* Section header */}
      <motion.div
        className="text-center mb-10 sm:mb-14 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          style={{
            background: "rgba(255,51,102,0.08)",
            color: "#FF3366",
            border: "1px solid rgba(255,51,102,0.15)",
          }}
        >
          📊 Impact Report
        </span>
        <h2
          className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-2"
          style={{ color: "#2d1b3d" }}
        >
          Your Effect on My Life
        </h2>
        <p style={{ color: "#6b5280" }}>The numbers don&apos;t lie.</p>
      </motion.div>

      {/* Stats grid */}
      <div className="relative z-10 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} stat={stat} index={i} />
        ))}
      </div>

      {/* Butterfly */}
      <motion.div
        className="absolute top-16 right-8 sm:right-16 text-2xl pointer-events-none"
        animate={{
          x: [0, 50, -30, 40, 0],
          y: [0, -20, 10, -30, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      >
        🦋
      </motion.div>
    </section>
  );
}
