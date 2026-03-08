"use client";

import dynamic from "next/dynamic";
import type { TemplateData } from "@/lib/types";

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

interface ShareableTemplateProps {
  data: TemplateData;
}

export default function ShareableTemplate({ data }: ShareableTemplateProps) {
  return (
    <main>
      <HeroSection
        heroHeadline={data.heroHeadline}
        heroSubtext={data.heroSubtext}
        heroLoading={data.heroLoading}
        heroPhotos={data.heroPhotos}
      />
      <ImpactStats stats={data.stats} />
      <SuperpowerScanner superpowers={data.superpowers} />
      <MemoryGenerator memories={data.memories} />
      <AppreciationMeter appreciationResult={data.appreciationResult} />
      <FinalCelebration
        finalMessage={data.finalMessage}
        personalNote={data.personalNote}
        herName={data.herName}
      />
    </main>
  );
}
