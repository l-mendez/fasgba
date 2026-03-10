"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Crown, Timer, Zap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RatingType } from "@/lib/rankingUtils";

interface RatingTypeSelectorProps {
  currentType: RatingType;
}

const ratingTypeConfig: Record<RatingType, { label: string; icon: typeof Crown }> = {
  standard: { label: "Standard", icon: Crown },
  rapid: { label: "Rápido", icon: Timer },
  blitz: { label: "Blitz", icon: Zap },
};

export function RatingTypeSelector({ currentType }: RatingTypeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "standard") {
      params.delete("sortBy");
    } else {
      params.set("sortBy", value);
    }
    params.set("page", "1");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={currentType} onValueChange={handleChange}>
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        {(Object.entries(ratingTypeConfig) as [RatingType, typeof ratingTypeConfig.standard][]).map(
          ([type, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger key={type} value={type} className="flex items-center gap-1.5">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            );
          }
        )}
      </TabsList>
    </Tabs>
  );
}
