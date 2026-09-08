import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SlotExperience } from "@/components/slot-experience";
import { PUBLIC_FEATURES } from "@/lib/public-features";
import { experienceThemeStyle } from "@/lib/site-experience/presentation";
import { getSiteExperience } from "@/lib/site-experience/repository";

export const metadata: Metadata = {
  title: "Slot da Sorte",
  description:
    "Conheça a prévia visual do Slot da Sorte 6DNX e como funcionará o ecossistema de moedas fechadas.",
  robots: { index: false, follow: false },
};

export default async function SlotPage() {
  if (!PUBLIC_FEATURES.slot) notFound();

  const experience = await getSiteExperience();
  return (
    <SlotExperience
      content={experience.slot.content}
      effects={experience.slot.effects}
      themeStyle={experienceThemeStyle(experience.slot.theme, experience.slot.background)}
    />
  );
}
