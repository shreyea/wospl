"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const HeroSection = dynamic(() => import("@/components/HeroSection"), {
  ssr: false,
});
const ImpactStats = dynamic(() => import("@/components/ImpactStats"), {
  ssr: false,
});
const SuperpowerScanner = dynamic(
  () => import("@/components/SuperpowerScanner"),
  { ssr: false }
);
const MemoryGenerator = dynamic(
  () => import("@/components/MemoryGenerator"),
  { ssr: false }
);
const AppreciationMeter = dynamic(
  () => import("@/components/AppreciationMeter"),
  { ssr: false }
);
const FinalCelebration = dynamic(
  () => import("@/components/FinalCelebration"),
  { ssr: false }
);

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ImpactStats />
      <SuperpowerScanner />
      <MemoryGenerator />
      <AppreciationMeter />
      <FinalCelebration />

      {/* Creator login button — fixed bottom-right */}
      <Link
        href="/login"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 select-none"
        style={{
          background: "linear-gradient(135deg, #FF3366, #8B5CF6)",
          boxShadow: "0 4px 20px rgba(255,51,102,0.4)",
        }}
      >
        ✏️ Creator Login
      </Link>
    </main>
  );
}
