import type { Metadata } from "next";
import { SlotExperience } from "@/components/slot-experience";

export const metadata: Metadata = {
  title: "Slot da Sorte",
  description:
    "Conheça a prévia visual do Slot da Sorte 6DNX e como funcionará o ecossistema de moedas fechadas.",
  robots: { index: false, follow: false },
};

export default function SlotPage() {
  return <SlotExperience />;
}
