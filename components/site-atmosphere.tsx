import type { CSSProperties } from "react";
import {
  DEFAULT_SITE_EXPERIENCE,
  type ExperienceEffectFamily,
  type ExperienceEffects,
} from "@/lib/site-experience/types";

type Particle = {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  rotation: number;
  opacity: number;
};

type ParticleStyle = CSSProperties & {
  "--atmosphere-drift": string;
  "--atmosphere-opacity": number;
  "--atmosphere-rotation": string;
  "--atmosphere-size": string;
};

const MAX_PARTICLES = 24;
const LIGHT_PARTICLES = 10;

const PARTICLES: readonly Particle[] = Array.from({ length: MAX_PARTICLES }, (_, index) => ({
  x: (index * 37 + 7) % 97,
  y: (index * 23 + 3) % 101,
  size: 1.2 + ((index * 7) % 17) / 10,
  delay: ((index * 31) % 113) / 10,
  duration: 12.4 + ((index * 13) % 61) / 10,
  drift: ((index % 2 ? -1 : 1) * (16 + ((index * 11) % 24))),
  rotation: (index % 2 ? -1 : 1) * (34 + ((index * 29) % 96)),
  opacity: 0.16 + ((index * 3) % 20) / 100,
}));

export function SiteAtmosphere({
  effects = DEFAULT_SITE_EXPERIENCE.home.effects,
}: {
  effects?: ExperienceEffects;
}) {
  if (effects.density === "off" || effects.families.length === 0) return null;
  const count = effects.density === "light" ? LIGHT_PARTICLES : MAX_PARTICLES;

  return (
    <div className="site-atmosphere" aria-hidden data-effect-density={effects.density}>
      {PARTICLES.slice(0, count).map((particle, index) => {
        const family = effects.families[index % effects.families.length] as ExperienceEffectFamily;
        return (
          <span
            key={`${family}-${index}`}
            className={`site-atmosphere__particle site-atmosphere__particle--${family}`}
            data-site-effect-particle
            data-effect-family={family}
            style={
              {
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: `-${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
                "--atmosphere-drift": `${particle.drift}px`,
                "--atmosphere-opacity": particle.opacity,
                "--atmosphere-rotation": `${particle.rotation}deg`,
                "--atmosphere-size": `${particle.size}px`,
              } as ParticleStyle
            }
          />
        );
      })}
    </div>
  );
}
