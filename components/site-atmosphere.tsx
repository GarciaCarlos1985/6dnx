import type { CSSProperties } from "react";

type AtmosphereParticle = {
  kind: "soot" | "spark";
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  rotation: number;
  opacity: number;
};

type AtmosphereParticleStyle = CSSProperties & {
  "--atmosphere-drift": string;
  "--atmosphere-opacity": number;
  "--atmosphere-rotation": string;
  "--atmosphere-size": string;
};

const ATMOSPHERE_PARTICLES: readonly AtmosphereParticle[] = [
  { kind: "soot", x: 4, y: -2, size: 2, delay: 1.1, duration: 15.2, drift: 24, rotation: 92, opacity: 0.18 },
  { kind: "spark", x: 11, y: 3, size: 1.5, delay: 5.4, duration: 12.8, drift: -18, rotation: -42, opacity: 0.34 },
  { kind: "soot", x: 18, y: 8, size: 2.6, delay: 8.7, duration: 17.4, drift: -31, rotation: -105, opacity: 0.16 },
  { kind: "soot", x: 29, y: 14, size: 1.4, delay: 3.2, duration: 14.8, drift: 16, rotation: 76, opacity: 0.2 },
  { kind: "spark", x: 43, y: 18, size: 1.2, delay: 9.1, duration: 13.6, drift: 28, rotation: 38, opacity: 0.3 },
  { kind: "soot", x: 57, y: 23, size: 2.2, delay: 0.8, duration: 16.6, drift: -20, rotation: -84, opacity: 0.17 },
  { kind: "soot", x: 72, y: 28, size: 1.7, delay: 6.6, duration: 15.8, drift: 34, rotation: 118, opacity: 0.2 },
  { kind: "spark", x: 88, y: 32, size: 1.4, delay: 2.3, duration: 12.4, drift: -26, rotation: -48, opacity: 0.36 },
  { kind: "soot", x: 95, y: 37, size: 2.8, delay: 10.2, duration: 18.1, drift: -38, rotation: -126, opacity: 0.15 },
  { kind: "soot", x: 8, y: 42, size: 1.6, delay: 4.9, duration: 14.5, drift: 22, rotation: 64, opacity: 0.19 },
  { kind: "spark", x: 24, y: 47, size: 1.3, delay: 7.5, duration: 13.2, drift: 31, rotation: 45, opacity: 0.32 },
  { kind: "soot", x: 36, y: 51, size: 2.4, delay: 1.8, duration: 17.2, drift: -29, rotation: -96, opacity: 0.16 },
  { kind: "soot", x: 51, y: 56, size: 1.5, delay: 11.3, duration: 15.1, drift: 19, rotation: 82, opacity: 0.21 },
  { kind: "spark", x: 66, y: 61, size: 1.5, delay: 4.1, duration: 12.9, drift: -23, rotation: -36, opacity: 0.35 },
  { kind: "soot", x: 81, y: 65, size: 2.1, delay: 8.2, duration: 16.4, drift: 36, rotation: 112, opacity: 0.18 },
  { kind: "soot", x: 92, y: 70, size: 1.4, delay: 2.7, duration: 14.3, drift: -17, rotation: -70, opacity: 0.2 },
  { kind: "spark", x: 14, y: 75, size: 1.2, delay: 10.5, duration: 13.8, drift: -30, rotation: -52, opacity: 0.31 },
  { kind: "soot", x: 31, y: 79, size: 2.7, delay: 5.8, duration: 17.8, drift: 27, rotation: 124, opacity: 0.15 },
  { kind: "soot", x: 48, y: 84, size: 1.8, delay: 0.4, duration: 15.6, drift: -24, rotation: -88, opacity: 0.19 },
  { kind: "spark", x: 63, y: 88, size: 1.4, delay: 7.1, duration: 12.6, drift: 25, rotation: 41, opacity: 0.34 },
  { kind: "soot", x: 77, y: 92, size: 2.3, delay: 3.6, duration: 16.9, drift: -33, rotation: -116, opacity: 0.16 },
  { kind: "spark", x: 90, y: 96, size: 1.2, delay: 9.8, duration: 13.4, drift: 18, rotation: 34, opacity: 0.3 },
] as const;

export function SiteAtmosphere() {
  return (
    <div className="site-atmosphere" aria-hidden>
      {ATMOSPHERE_PARTICLES.map((particle, index) => (
        <span
          key={`${particle.kind}-${particle.x}-${particle.y}-${index}`}
          className={`site-atmosphere__particle site-atmosphere__particle--${particle.kind}`}
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
            } as AtmosphereParticleStyle
          }
        />
      ))}
    </div>
  );
}
