const COLORS = ["#dc2626", "#f87171", "#ffffff", "#fca5a5", "#7f1d1d"];

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  w: number;
  h: number;
  color: string;
};

/**
 * Soft confetti burst from a point. Self-contained canvas that removes itself
 * when the last piece leaves the screen — no dependency, no lingering DOM.
 * Resolves when the burst is done so callers can chain a navigation.
 */
export function burstConfetti(x: number, y: number, count = 90): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return Promise.resolve();
  }

  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return Promise.resolve();
  }
  ctx.scale(dpr, dpr);

  const pieces: Piece[] = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    // Gentle spread: low initial speed, gravity does the rest.
    const speed = 2 + Math.random() * 5;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.2,
      w: 5 + Math.random() * 5,
      h: 8 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  });

  return new Promise((resolve) => {
    let frame = 0;
    const done = () => {
      canvas.remove();
      resolve();
    };

    const step = () => {
      frame++;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let alive = 0;

      for (const p of pieces) {
        p.vy += 0.16; // gravity
        p.vx *= 0.99; // drag
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;

        if (p.y < window.innerHeight + 40) alive++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - frame / 110);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (alive === 0 || frame > 110) done();
      else requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  });
}
