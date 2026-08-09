import type { CSSProperties } from "react";
import type { ExperienceFontId, ExperienceTheme } from "@/lib/site-experience/types";

const FONT_VARIABLES: Record<ExperienceFontId, string> = {
  "archivo-black": "var(--font-display)",
  manrope: "var(--font-body)",
};

export type ExperienceStyle = CSSProperties & {
  "--experience-bg": string;
  "--experience-surface": string;
  "--experience-accent": string;
  "--experience-heading": string;
  "--experience-body": string;
  "--experience-display-font": string;
  "--experience-body-font": string;
};

export function experienceThemeStyle(theme: ExperienceTheme): ExperienceStyle {
  return {
    "--experience-bg": theme.backgroundColor,
    "--experience-surface": theme.surfaceColor,
    "--experience-accent": theme.accentColor,
    "--experience-heading": theme.headingColor,
    "--experience-body": theme.bodyColor,
    "--experience-display-font": FONT_VARIABLES[theme.displayFont],
    "--experience-body-font": FONT_VARIABLES[theme.bodyFont],
  };
}
