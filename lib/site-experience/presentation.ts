import type { CSSProperties } from "react";
import type {
  ExperienceBackground,
  ExperienceFontId,
  ExperienceTheme,
} from "@/lib/site-experience/types";

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

export function experienceThemeStyle(
  theme: ExperienceTheme,
  background?: ExperienceBackground,
): ExperienceStyle {
  return {
    "--experience-bg": theme.backgroundColor,
    "--experience-surface": theme.surfaceColor,
    "--experience-accent": theme.accentColor,
    "--experience-heading": theme.headingColor,
    "--experience-body": theme.bodyColor,
    "--experience-display-font": FONT_VARIABLES[theme.displayFont],
    "--experience-body-font": FONT_VARIABLES[theme.bodyFont],
    ...experienceBackgroundStyle(background ?? { imageUrl: null }),
  };
}

/**
 * The URL has already passed the strict Studio validator. Keep the grade with
 * the artwork so an editor cannot accidentally trade readable copy for a
 * beautiful but unusable banner.
 */
export function experienceBackgroundStyle(
  background: ExperienceBackground,
): CSSProperties | undefined {
  if (!background.imageUrl) return undefined;
  return {
    backgroundImage: `linear-gradient(180deg, rgb(0 0 0 / 0.35), rgb(0 0 0 / 0.78)), url("${background.imageUrl}")`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
  };
}
