"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { siteData } from "../data/siteData";

interface SuperpowerScannerProps {
  superpowers?: typeof siteData.superpowers;
}

export default function SuperpowerScanner(props: SuperpowerScannerProps) {
  const superpowers = props.superpowers ?? siteData.superpowers;
  const [scanning, setScanning] = useState(false);
  const [revealedPowers, setRevealedPowers] = useState<number[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const scanIndex = useRef(0);
  const started = useRef(false);

  const startScan = () => {
    if (started.current) return;
    started.current = true;
    setTimeout(() => {
      setScanning(true);
      const total = superpowers.length;
      scanIndex.current = 0;

      const interval = setInterval(() => {
        if (scanIndex.current < total) {
          const idx = scanIndex.current;
          setRevealedPowers((prev) => [...prev, idx]);
          scanIndex.current++;
        } else {
          clearInterval(interval);
          setScanComplete(true);
        }
      }, 800);
    }, 600);
  };

  return (
    <section
      id="superpower-scanner"
      className="relative min-h-[80dvh] py-16 sm:py-20 px-5 overflow-hidden flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(180deg, #FFF8FA 0%, #fff0f4 50%, #FFF8FA 100%)",
      }}
    >
      <motion.div
        className="relative z-10 w-full max-w-xl text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        onViewportEnter={startScan}
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
          🔬 Superpower Scan
        </span>

        <h2
          className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-3"
          style={{ color: "#2d1b3d" }}
        >
          Your Secret Abilities
        </h2>
        <p className="mb-8" style={{ color: "#6b5280" }}>
          {scanning && !scanComplete
            ? "Scanning superpowers…"
            : scanComplete
              ? "Scan complete ✓"
              : "Preparing scanner…"}
        </p>

        {/* Power cards */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <AnimatePresence>
            {revealedPowers.map((idx) => {
              const power = superpowers[idx];
              if (!power) return null;
              return (
                <motion.div
                  key={idx}
                  className="lab-card p-5 sm:p-6 flex items-center gap-4 text-left"
                  initial={{ opacity: 0, x: -40, scale: 0.85 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                >
                  <div className="text-2xl sm:text-3xl shrink-0">
                    {power.icon}
                  </div>
                  <span
                    className="font-medium text-sm sm:text-base flex-1"
                    style={{ color: "#2d1b3d" }}
                  >
                    {power.text}
                  </span>
                  <span
                    className="text-xs px-2 py-1 rounded-full shrink-0"
                    style={{
                      background: "rgba(139,92,246,0.08)",
                      color: "#8B5CF6",
                    }}
                  >
                    Verified ✓
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Complete message */}
        <AnimatePresence>
          {scanComplete && (
            <motion.p
              className="mt-6 text-sm"
              style={{ color: "#FF3366" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              🚨 Warning: These abilities are dangerously powerful.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
