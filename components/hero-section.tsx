"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import type { StorefrontContent } from "@/lib/storefront-content/types";

gsap.registerPlugin(ScrollTrigger);

const HERO_PARTICLES = [
  { x: 7, y: 88, size: 2, delay: 0.4, duration: 8.6, drift: 34 },
  { x: 13, y: 72, size: 3, delay: 4.2, duration: 10.4, drift: -22 },
  { x: 19, y: 94, size: 2, delay: 6.7, duration: 9.5, drift: 48 },
  { x: 25, y: 81, size: 4, delay: 2.1, duration: 12.2, drift: -30 },
  { x: 31, y: 90, size: 2, delay: 8.4, duration: 10.8, drift: 18 },
  { x: 38, y: 76, size: 3, delay: 5.3, duration: 11.4, drift: 42 },
  { x: 44, y: 92, size: 2, delay: 1.3, duration: 9.8, drift: -36 },
  { x: 50, y: 84, size: 3, delay: 7.1, duration: 12.8, drift: 26 },
  { x: 56, y: 96, size: 2, delay: 3.7, duration: 9.2, drift: -18 },
  { x: 62, y: 73, size: 4, delay: 9.2, duration: 13.4, drift: 38 },
  { x: 68, y: 89, size: 2, delay: 2.8, duration: 10.1, drift: -46 },
  { x: 73, y: 78, size: 3, delay: 6.1, duration: 11.8, drift: 24 },
  { x: 79, y: 93, size: 2, delay: 0.9, duration: 8.9, drift: -28 },
  { x: 84, y: 69, size: 4, delay: 7.8, duration: 12.6, drift: 44 },
  { x: 89, y: 86, size: 2, delay: 4.7, duration: 9.7, drift: -24 },
  { x: 94, y: 95, size: 3, delay: 10.1, duration: 13.1, drift: 32 },
  { x: 35, y: 66, size: 2, delay: 5.8, duration: 10.6, drift: -40 },
  { x: 65, y: 63, size: 2, delay: 3.2, duration: 11.1, drift: 36 },
] as const;

type ParticleStyle = CSSProperties & {
  "--particle-drift": string;
};

export function HeroSection({ content }: { content: StorefrontContent }) {
  const sceneRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const leftActorRef = useRef<HTMLDivElement>(null);
  const rightActorRef = useRef<HTMLDivElement>(null);
  const leftActorReactiveRef = useRef<HTMLDivElement>(null);
  const rightActorReactiveRef = useRef<HTMLDivElement>(null);
  const leftActorBeamRef = useRef<HTMLSpanElement>(null);
  const rightActorBeamRef = useRef<HTMLSpanElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const bloodEyeRef = useRef<HTMLDivElement>(null);
  const bloodEyeCoreRef = useRef<HTMLDivElement>(null);
  const bloodEyePointerRef = useRef<HTMLDivElement>(null);
  const transformationFlashRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const logoScrollRef = useRef<HTMLSpanElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLAnchorElement>(null);
  const cueArrowRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    const eyeElement = bloodEyeRef.current;
    const eyeVisibility = { hover: 0, scroll: 0 };
    const renderEyeOpacity = () => {
      if (eyeElement) {
        eyeElement.style.opacity = Math.min(
          0.46,
          eyeVisibility.hover + eyeVisibility.scroll,
        ).toFixed(3);
      }
    };

    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        wide: "(min-width: 768px)",
      },
      (ctx) => {
        const { motion, wide } = ctx.conditions as {
          motion: boolean;
          wide: boolean;
        };
        if (!motion) return;

        eyeVisibility.hover = 0;
        eyeVisibility.scroll = 0;
        renderEyeOpacity();
        gsap.set(bloodEyeCoreRef.current, {
          rotate: wide ? -32 : 28,
          scale: 0.96,
          transformOrigin: "50% 50%",
        });
        gsap.set(logoScrollRef.current, { transformOrigin: "50% 50%" });

        // The hero owns one natural viewport. Its actors are local to this
        // section; the independent product-scene companions remain untouched.
        let endIntro: (() => void) | undefined;
        if (window.scrollY < 40) {
          const intro = gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .from(
              backdropRef.current,
              { scale: 1.055, opacity: 0.72, duration: 1.45 },
              0,
            )
            .from(
              [leftActorRef.current, rightActorRef.current],
              {
                y: 38,
                opacity: 0,
                duration: 1.08,
                stagger: 0.12,
              },
              0.08,
            )
            .from(titleRef.current, { y: 34, opacity: 0, duration: 0.9 }, 0.15)
            .from(cueRef.current, { opacity: 0, duration: 0.65 }, 0.7);

          // Intro and the scrubbed timeline both drive xPercent/opacity. If the
          // user scrolls mid-intro they fight; snapping it to its end state on
          // the first scroll hands the properties over cleanly.
          endIntro = () => intro.progress(1);
          window.addEventListener("scroll", endIntro, {
            once: true,
            passive: true,
          });
        }

        gsap.to(auraRef.current, {
          opacity: 0,
          scale: 1,
          duration: 5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        gsap.fromTo(
          cueArrowRef.current,
          { y: -6, opacity: 0.3 },
          {
            y: 2,
            opacity: 1,
            duration: 1.2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          },
        );

        // No pin: one viewport of scrolling naturally reaches the products.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sceneRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.8,
          },
        });

        tl.addLabel("push", 0)
          .addLabel("payoff", 0.38)
          .addLabel("release", 0.78);

        // Beat 1 — camera pushes in while the first pose remains readable.
        tl.to(
          backdropRef.current,
          { scale: 1.085, yPercent: 1.6, ease: "none", duration: 0.46 },
          "push",
        )
          .to(
            leftActorRef.current,
            {
              xPercent: -5,
              yPercent: 4,
              scale: 1.06,
              ease: "none",
              duration: 0.46,
            },
            "push",
          )
          .to(
            rightActorRef.current,
            {
              xPercent: 5,
              yPercent: 4,
              scale: 1.055,
              ease: "none",
              duration: 0.46,
            },
            "push",
          )
          .to(
            titleRef.current,
            { y: -10, ease: "none", duration: 0.28 },
            "push",
          )
          .to(
            logoScrollRef.current,
            { scale: 1.18, ease: "none", duration: 0.28 },
            "push",
          )
          .to(
            auraRef.current,
            { scale: 1, opacity: 0, ease: "none", duration: 0.28 },
            "push",
          )
          .to(cueRef.current, { opacity: 0, y: 16, duration: 0.1 }, "push")
          .to(
            eyeVisibility,
            {
              scroll: wide ? 0.14 : 0.09,
              ease: "power2.out",
              duration: 0.18,
              onUpdate: renderEyeOpacity,
            },
            "push+=0.02",
          )
          .to(
            bloodEyeCoreRef.current,
            {
              rotate: wide ? 154 : -128,
              scale: 1,
              ease: "none",
              duration: 0.34,
            },
            "push",
          );

        // Beat 2 — the angel completes a wing cycle while the operator walks
        // from low-ready into a full aim. Frames share the same canvas and
        // overlap, preventing the hard pose cuts the previous version had.
        // Beat 3 — the final poses lock, then clear the frame. Opacity
        // starts only near the end of travel so no character vanishes on-screen.
        tl.to(
          logoScrollRef.current,
          {
            scale: 1.72,
            ease: "power2.in",
            duration: 0.26,
          },
          "payoff-=0.16",
        )
          .to(
            titleRef.current,
            {
              opacity: 0,
              ease: "power2.in",
              duration: 0.22,
            },
            "payoff-=0.12",
          )
          .to(
            [leftActorRef.current, rightActorRef.current],
            {
              opacity: 0,
              yPercent: 8,
              ease: "power2.in",
              duration: 0.22,
            },
            "payoff-=0.22",
          );

        // Beat 4 — the ocular sigil gains presence under the existing
        // overlays. Scroll owns this rotor; logo hover owns a nested rotor so
        // the two directions can compose without overwriting one another.
        tl.to(
          eyeVisibility,
          {
            scroll: wide ? 0.22 : 0.14,
            ease: "power2.out",
            duration: 0.28,
            onUpdate: renderEyeOpacity,
          },
          "payoff-=0.1",
        )
          .to(
            bloodEyeCoreRef.current,
            {
              rotate: wide ? 418 : -336,
              scale: 1.035,
              ease: "none",
              duration: 0.46,
            },
            "payoff-=0.1",
          )
          .fromTo(
            transformationFlashRef.current,
            { opacity: 0, scale: 0.96 },
            {
              opacity: 0,
              scale: 1.025,
              ease: "sine.out",
              duration: 0.1,
            },
            "payoff-=0.08",
          )
          .to(
            transformationFlashRef.current,
            { opacity: 0, scale: 1.08, ease: "sine.in", duration: 0.16 },
            "payoff+=0.02",
          )
          .fromTo(
            revealRef.current,
            { opacity: 0, y: 36 },
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
              duration: 0.2,
            },
            "payoff",
          )
          .to(
            auraRef.current,
            { opacity: 0, scale: 1, ease: "none", duration: 0.22 },
            "payoff",
          )
          .to(
            revealRef.current,
            {
              opacity: 0,
              y: -40,
              ease: "power2.in",
              duration: 0.18,
            },
            "release",
          )
          .to(
            eyeVisibility,
            {
              scroll: 0,
              ease: "power2.in",
              duration: 0.18,
              onUpdate: renderEyeOpacity,
            },
            "release",
          );

        return () => {
          if (endIntro) window.removeEventListener("scroll", endIntro);
          eyeVisibility.scroll = 0;
          renderEyeOpacity();
        };
      },
      sceneRef,
    );

    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        finePointer: "(pointer: fine)",
      },
      (ctx) => {
        const { motion, finePointer } = ctx.conditions as {
          motion: boolean;
          finePointer: boolean;
        };
        const hitArea = logoScrollRef.current;
        const logo = logoRef.current;
        const eye = eyeElement;
        const eyePointer = bloodEyePointerRef.current;

        if (
          !motion ||
          !finePointer ||
          !hitArea ||
          !logo ||
          !eye ||
          !eyePointer
        ) {
          return;
        }

        // Scroll owns the outer shell while the pointer owns only the image.
        // Keeping these transforms separate prevents GSAP timelines from
        // overwriting one another when the user hovers and scrolls together.
        gsap.set(logo, {
          transformPerspective: 900,
          transformOrigin: "50% 50%",
          transformStyle: "preserve-3d",
          force3D: true,
          scaleX: 1,
          scaleY: 1,
        });
        gsap.set(eyePointer, {
          transformOrigin: "50% 50%",
          force3D: true,
          scaleX: 1,
          scaleY: 1,
        });

        const moveX = gsap.quickTo(logo, "x", {
          duration: 0.5,
          ease: "power3.out",
        });
        const moveY = gsap.quickTo(logo, "y", {
          duration: 0.5,
          ease: "power3.out",
        });
        const tiltX = gsap.quickTo(logo, "rotationX", {
          duration: 0.58,
          ease: "power3.out",
        });
        const tiltY = gsap.quickTo(logo, "rotationY", {
          duration: 0.58,
          ease: "power3.out",
        });
        const breatheX = gsap.quickTo(logo, "scaleX", {
          duration: 0.42,
          ease: "power3.out",
        });
        const breatheY = gsap.quickTo(logo, "scaleY", {
          duration: 0.42,
          ease: "power3.out",
        });
        const spinEye = gsap.quickTo(eyePointer, "rotation", {
          duration: 0.52,
          ease: "power3.out",
        });
        const breatheEyeX = gsap.quickTo(eyePointer, "scaleX", {
          duration: 0.48,
          ease: "power3.out",
        });
        const breatheEyeY = gsap.quickTo(eyePointer, "scaleY", {
          duration: 0.48,
          ease: "power3.out",
        });

        let pointerX = 0;
        let pointerY = 0;
        let lastPointerX: number | null = null;
        let lastPointerY: number | null = null;
        let eyeRotation = 0;
        let animationFrame = 0;
        const clampEyeStep = gsap.utils.clamp(-14, 14);

        const updateLogo = () => {
          animationFrame = 0;
          const bounds = hitArea.getBoundingClientRect();
          if (!bounds.width || !bounds.height) return;

          const normalizedX = Math.max(
            -1,
            Math.min(1, ((pointerX - bounds.left) / bounds.width) * 2 - 1),
          );
          const normalizedY = Math.max(
            -1,
            Math.min(1, ((pointerY - bounds.top) / bounds.height) * 2 - 1),
          );

          moveX(normalizedX * 12);
          moveY(normalizedY * 8);
          tiltX(normalizedY * -4.5);
          tiltY(normalizedX * 5.5);
          breatheX(1.025);
          breatheY(1.025);

          if (lastPointerX !== null && lastPointerY !== null) {
            eyeRotation += clampEyeStep(
              (pointerX - lastPointerX) * 0.22 -
                (pointerY - lastPointerY) * 0.16,
            );
          }
          lastPointerX = pointerX;
          lastPointerY = pointerY;
          spinEye(eyeRotation + normalizedX * 7 - normalizedY * 5);
          breatheEyeX(1.025);
          breatheEyeY(1.025);
        };

        const revealEye = (event: PointerEvent) => {
          pointerX = event.clientX;
          pointerY = event.clientY;
          lastPointerX = event.clientX;
          lastPointerY = event.clientY;
          gsap.to(eyeVisibility, {
            hover: 0.46,
            duration: 0.28,
            ease: "power2.out",
            overwrite: "auto",
            onUpdate: renderEyeOpacity,
          });
        };

        const handlePointerMove = (event: PointerEvent) => {
          if (lastPointerX === null || lastPointerY === null) {
            revealEye(event);
          }
          pointerX = event.clientX;
          pointerY = event.clientY;
          if (!animationFrame) {
            animationFrame = window.requestAnimationFrame(updateLogo);
          }
        };

        const resetLogo = () => {
          if (animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = 0;
          }
          moveX(0);
          moveY(0);
          tiltX(0);
          tiltY(0);
          breatheX(1);
          breatheY(1);
          eyeRotation += 18;
          spinEye(eyeRotation);
          breatheEyeX(1);
          breatheEyeY(1);
          lastPointerX = null;
          lastPointerY = null;
          gsap.to(eyeVisibility, {
            hover: 0,
            duration: 0.38,
            ease: "power2.out",
            overwrite: "auto",
            onUpdate: renderEyeOpacity,
          });
        };

        const pointerIsInsideLogo = () => {
          const bounds = hitArea.getBoundingClientRect();
          return (
            pointerX >= bounds.left &&
            pointerX <= bounds.right &&
            pointerY >= bounds.top &&
            pointerY <= bounds.bottom
          );
        };
        const handleWindowPointerMove = (event: PointerEvent) => {
          pointerX = event.clientX;
          pointerY = event.clientY;
          if (pointerIsInsideLogo()) {
            handlePointerMove(event);
          } else if (lastPointerX !== null || lastPointerY !== null) {
            resetLogo();
          }
        };
        const resetIfLogoMovedAway = () => {
          if (
            (lastPointerX !== null || lastPointerY !== null) &&
            !pointerIsInsideLogo()
          ) {
            resetLogo();
          }
        };

        window.addEventListener("pointermove", handleWindowPointerMove, {
          passive: true,
        });
        window.addEventListener("scroll", resetIfLogoMovedAway, {
          passive: true,
        });
        window.addEventListener("pointercancel", resetLogo);
        window.addEventListener("blur", resetLogo);

        return () => {
          if (animationFrame) window.cancelAnimationFrame(animationFrame);
          window.removeEventListener("pointermove", handleWindowPointerMove);
          window.removeEventListener("scroll", resetIfLogoMovedAway);
          window.removeEventListener("pointercancel", resetLogo);
          window.removeEventListener("blur", resetLogo);
          eyeVisibility.hover = 0;
          renderEyeOpacity();
        };
      },
      sceneRef,
    );

    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        finePointer: "(pointer: fine)",
      },
      (ctx) => {
        const { motion, finePointer } = ctx.conditions as {
          motion: boolean;
          finePointer: boolean;
        };
        const scene = sceneRef.current;
        const leftActor = leftActorRef.current;
        const rightActor = rightActorRef.current;
        const leftReactive = leftActorReactiveRef.current;
        const rightReactive = rightActorReactiveRef.current;
        const leftBeam = leftActorBeamRef.current;
        const rightBeam = rightActorBeamRef.current;

        if (
          !motion ||
          !finePointer ||
          !scene ||
          !leftActor ||
          !rightActor ||
          !leftReactive ||
          !rightReactive ||
          !leftBeam ||
          !rightBeam
        ) {
          return;
        }

        gsap.set([leftReactive, rightReactive], {
          transformPerspective: 900,
          transformOrigin: "50% 68%",
          transformStyle: "preserve-3d",
          force3D: true,
        });

        const createController = (
          actor: HTMLDivElement,
          reactive: HTMLDivElement,
          beam: HTMLSpanElement,
          beamOrigin: { x: number; y: number },
          movement: { x: number; y: number },
        ) => ({
          actor,
          reactive,
          beam,
          beamOrigin,
          movement,
          x: gsap.quickTo(reactive, "x", {
            duration: 0.48,
            ease: "power3.out",
          }),
          y: gsap.quickTo(reactive, "y", {
            duration: 0.48,
            ease: "power3.out",
          }),
          rotationX: gsap.quickTo(reactive, "rotationX", {
            duration: 0.62,
            ease: "power3.out",
          }),
          rotationY: gsap.quickTo(reactive, "rotationY", {
            duration: 0.62,
            ease: "power3.out",
          }),
        });

        const controllers = [
          createController(
            leftActor,
            leftReactive,
            leftBeam,
            { x: 0.36, y: 0.3 },
            { x: 18, y: 12 },
          ),
          createController(
            rightActor,
            rightReactive,
            rightBeam,
            { x: 0.54, y: 0.45 },
            { x: 16, y: 11 },
          ),
        ];

        const clamp = gsap.utils.clamp(-1, 1);
        let pointerX = -10_000;
        let pointerY = -10_000;
        let pointerFrame = 0;

        const updateController = (controller: (typeof controllers)[number]) => {
          const rect = controller.actor.getBoundingClientRect();
          const sceneRect = scene.getBoundingClientRect();
          const actorOpacity = Number.parseFloat(
            window.getComputedStyle(controller.actor).opacity,
          );
          const sceneVisible =
            sceneRect.bottom > 0 && sceneRect.top < window.innerHeight;
          const centerX = rect.left + rect.width * 0.5;
          const centerY = rect.top + rect.height * 0.48;
          const normalX = clamp(
            (pointerX - centerX) / Math.max(rect.width * 0.78, 1),
          );
          const normalY = clamp(
            (pointerY - centerY) / Math.max(rect.height * 0.7, 1),
          );
          const ellipticalDistance = Math.hypot(normalX, normalY * 0.9);
          const proximity = Math.max(0, 1 - ellipticalDistance);
          const rawIntensity = proximity * proximity * (3 - 2 * proximity);
          const intensity = sceneVisible ? rawIntensity * actorOpacity : 0;

          controller.x(normalX * controller.movement.x * intensity);
          controller.y(normalY * controller.movement.y * intensity);
          controller.rotationX(normalY * -2.4 * intensity);
          controller.rotationY(normalX * 3.2 * intensity);

          const localX = Math.min(
            100,
            Math.max(0, ((pointerX - rect.left) / rect.width) * 100),
          );
          const localY = Math.min(
            100,
            Math.max(0, ((pointerY - rect.top) / rect.height) * 100),
          );
          controller.reactive.style.setProperty(
            "--pointer-intensity",
            intensity.toFixed(3),
          );
          controller.reactive.style.setProperty(
            "--pointer-local-x",
            `${localX.toFixed(2)}%`,
          );
          controller.reactive.style.setProperty(
            "--pointer-local-y",
            `${localY.toFixed(2)}%`,
          );

          const originX = rect.left + rect.width * controller.beamOrigin.x;
          const originY = rect.top + rect.height * controller.beamOrigin.y;
          const deltaX = pointerX - originX;
          const deltaY = pointerY - originY;
          controller.beam.style.setProperty(
            "--beam-x",
            `${originX - sceneRect.left}px`,
          );
          controller.beam.style.setProperty(
            "--beam-y",
            `${originY - sceneRect.top}px`,
          );
          controller.beam.style.setProperty(
            "--beam-length",
            `${Math.hypot(deltaX, deltaY) + 54}px`,
          );
          controller.beam.style.setProperty(
            "--beam-angle",
            `${Math.atan2(deltaY, deltaX)}rad`,
          );
          controller.beam.style.setProperty(
            "--beam-opacity",
            Math.min(0.88, intensity * 1.08).toFixed(3),
          );
        };

        const renderPointerEffect = () => {
          pointerFrame = 0;
          controllers.forEach(updateController);
        };
        const schedulePointerEffect = () => {
          if (!pointerFrame) {
            pointerFrame = window.requestAnimationFrame(renderPointerEffect);
          }
        };
        const onPointerMove = (event: PointerEvent) => {
          pointerX = event.clientX;
          pointerY = event.clientY;
          schedulePointerEffect();
        };
        const resetPointerEffect = () => {
          pointerX = -10_000;
          pointerY = -10_000;
          schedulePointerEffect();
        };
        const onPointerOut = (event: PointerEvent) => {
          if (event.relatedTarget === null) resetPointerEffect();
        };

        window.addEventListener("pointermove", onPointerMove, {
          passive: true,
        });
        window.addEventListener("scroll", schedulePointerEffect, {
          passive: true,
        });
        window.addEventListener("pointerout", onPointerOut, {
          passive: true,
        });
        window.addEventListener("blur", resetPointerEffect);

        return () => {
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("scroll", schedulePointerEffect);
          window.removeEventListener("pointerout", onPointerOut);
          window.removeEventListener("blur", resetPointerEffect);
          if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
        };
      },
      sceneRef,
    );

    return () => {
      mm.revert();
      eyeElement?.style.removeProperty("opacity");
    };
  }, []);

  return (
    <section
      id="inicio"
      ref={sceneRef}
      className="hero-apocalypse relative flex w-full items-center justify-center overflow-hidden bg-transparent"
      aria-label="6DNX"
    >
      <div
        ref={backdropRef}
        className="hero-apocalypse-stage pointer-events-none absolute inset-0"
        aria-hidden
      >
        <Image
          src="/hero-apocalypse.jpg"
          alt=""
          fill
          preload
          sizes="100vw"
          className="hero-apocalypse-stage__image"
        />
        <span className="hero-apocalypse-stage__grade" />
      </div>

      <>
        <div
          ref={auraRef}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[130svh] w-[130svh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 will-change-transform"
          style={{
            background:
              "radial-gradient(circle, oklch(0.55 0.22 25 / 0.5) 0%, oklch(0.55 0.22 25 / 0.12) 42%, transparent 68%)",
          }}
          aria-hidden
        />

        <div className="hero-atmosphere" aria-hidden>
          <span className="hero-smoke hero-smoke--left" />
          <span className="hero-smoke hero-smoke--center" />
          <span className="hero-smoke hero-smoke--right" />
          {HERO_PARTICLES.map((particle, index) => (
            <span
              key={`${particle.x}-${particle.y}`}
              className="hero-particle"
              style={
                {
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: particle.size,
                  height: particle.size,
                  animationDelay: `-${particle.delay}s`,
                  animationDuration: `${particle.duration}s`,
                  "--particle-drift": `${particle.drift}px`,
                  opacity: index % 4 === 0 ? 0.8 : 0.55,
                } as ParticleStyle
              }
            />
          ))}
        </div>

        <div
          ref={bloodEyeRef}
          data-hero-eye
          className="hero-blood-eye pointer-events-none absolute left-1/2 top-1/2 z-[7] aspect-square w-[min(88vw,48rem)] -translate-x-1/2 -translate-y-1/2 opacity-0 will-change-[opacity]"
          aria-hidden
        >
          <div
            ref={bloodEyeCoreRef}
            className="hero-blood-eye__core h-full w-full will-change-transform"
          >
            <div
              ref={bloodEyePointerRef}
              className="hero-blood-eye__pointer h-full w-full will-change-transform"
            >
              <svg viewBox="0 0 800 800" className="h-full w-full">
                <defs>
                  <radialGradient id="blood-iris" cx="50%" cy="48%" r="52%">
                    <stop offset="0%" stopColor="#060001" />
                    <stop offset="18%" stopColor="#190003" />
                    <stop offset="48%" stopColor="#7b0511" />
                    <stop offset="72%" stopColor="#310006" />
                    <stop offset="100%" stopColor="#050001" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="blood-pupil" cx="50%" cy="45%" r="55%">
                    <stop offset="0%" stopColor="#000" />
                    <stop offset="66%" stopColor="#090001" />
                    <stop offset="100%" stopColor="#5d020b" />
                  </radialGradient>
                </defs>

                <circle cx="400" cy="400" r="360" fill="url(#blood-iris)" />
                <circle
                  cx="400"
                  cy="400"
                  r="292"
                  fill="none"
                  stroke="#d80b22"
                  strokeOpacity="0.24"
                  strokeWidth="13"
                />
                <circle
                  cx="400"
                  cy="400"
                  r="208"
                  fill="none"
                  stroke="#ff1731"
                  strokeOpacity="0.28"
                  strokeWidth="9"
                />
                <circle cx="400" cy="400" r="84" fill="url(#blood-pupil)" />
                <circle
                  cx="400"
                  cy="400"
                  r="44"
                  fill="#010000"
                  stroke="#e10b22"
                  strokeOpacity="0.32"
                  strokeWidth="5"
                />

                {[0, 120, 240].map((rotation) => (
                  <g
                    key={rotation}
                    transform={`rotate(${rotation} 400 400) translate(400 176)`}
                    fill="#070001"
                  >
                    <path d="M0-42c27 0 49 22 49 49 0 18-9 34-23 42 15 20 17 44 4 70-2-31-20-50-48-61A49 49 0 0 1 0-42Z" />
                    <circle cx="0" cy="6" r="31" />
                  </g>
                ))}

                <path
                  d="M102 404c68-110 174-176 298-176s230 66 298 176c-68 110-174 176-298 176S170 514 102 404Z"
                  fill="none"
                  stroke="#ff1731"
                  strokeOpacity="0.16"
                  strokeWidth="7"
                />
              </svg>
            </div>
          </div>
        </div>

        <span
          ref={leftActorBeamRef}
          className="cinematic-pointer-beam cinematic-pointer-beam--operator hero-apocalypse-pointer-beam"
        >
          <span className="cinematic-pointer-beam__origin" />
        </span>
        <span
          ref={rightActorBeamRef}
          className="cinematic-pointer-beam cinematic-pointer-beam--angel hero-apocalypse-pointer-beam"
        >
          <span className="cinematic-pointer-beam__origin" />
        </span>

        <div
          ref={leftActorRef}
          data-hero-character="couple"
          className="hero-apocalypse-actor hero-apocalypse-actor--left"
          aria-hidden
        >
          <div
            ref={leftActorReactiveRef}
            className="hero-apocalypse-actor__reactive"
          >
            <span className="hero-apocalypse-actor__aura" />
            <Image
              src="/killa-casal-hero.png"
              alt=""
              fill
              loading="eager"
              sizes="(max-width: 899px) 88vw, 56vw"
              className="hero-apocalypse-actor__image"
            />
            <span className="cinematic-pointer-light hero-apocalypse-pointer-light" />
            <span className="hero-apocalypse-actor__smoke" />
          </div>
        </div>

        <div
          ref={rightActorRef}
          data-hero-character="angel"
          className="hero-apocalypse-actor hero-apocalypse-actor--right"
          aria-hidden
        >
          <div
            ref={rightActorReactiveRef}
            className="hero-apocalypse-actor__reactive"
          >
            <span className="hero-apocalypse-actor__aura" />
            <Image
              src="/anjo-frame-03-ivory-v2.webp"
              alt=""
              fill
              loading="eager"
              sizes="(max-width: 899px) 88vw, 58vw"
              className="hero-apocalypse-actor__image"
            />
            <span className="cinematic-pointer-light hero-apocalypse-pointer-light" />
            <span className="hero-apocalypse-actor__smoke" />
          </div>
        </div>

        <div
          ref={transformationFlashRef}
          className="pointer-events-none absolute inset-0 z-[9] opacity-0 will-change-transform"
          style={{
            background:
              "radial-gradient(ellipse at 20% 62%, oklch(0.68 0.24 25 / 0.7), transparent 35%), radial-gradient(ellipse at 80% 58%, oklch(0.68 0.24 25 / 0.72), transparent 36%)",
            mixBlendMode: "screen",
          }}
          aria-hidden
        />

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
          }}
          aria-hidden
        />
      </>

      <div className="hero-apocalypse-seam pointer-events-none" aria-hidden>
        <span className="hero-apocalypse-seam__smoke hero-apocalypse-seam__smoke--left" />
        <span className="hero-apocalypse-seam__smoke hero-apocalypse-seam__smoke--center" />
        <span className="hero-apocalypse-seam__smoke hero-apocalypse-seam__smoke--right" />
      </div>

      <div
        data-hero-copy-position
        className="hero-apocalypse-copy pointer-events-none absolute inset-x-0 z-[var(--z-hero-copy)] px-6"
      >
        <div
          ref={titleRef}
          className="hero-apocalypse-copy__inner mx-auto text-center select-none will-change-transform"
        >
          <h1 className="mb-1" data-hero-brand-overlay="visible">
            <span
              ref={logoScrollRef}
              data-hero-logo-shell
              className="hero-brand-logo-shell inline-block align-middle"
            >
              <Image
                ref={logoRef}
                data-hero-logo-motion
                src="/logo-asas-optimized.webp"
                alt="6Dorme Nois Xita"
                width={1536}
                height={1024}
                preload
                unoptimized
                sizes="(max-width: 899px) 94vw, 48vw"
                className="hero-brand-logo block h-auto w-full"
              />
            </span>
          </h1>
          <p className="hero-copy-headline mb-0 text-balance text-[clamp(0.95rem,2.2vw,1.6rem)] font-extrabold uppercase tracking-[0.05em]">
            {content.heroHeadlineLead}{" "}
            <span className="italic text-primary">
              {content.heroHeadlineAccent}
            </span>{" "}
            {content.heroHeadlineTail}
          </p>
          <p className="hero-copy-support mx-auto max-w-xl text-[0.65rem] uppercase leading-[1.45] tracking-[0.22em] md:text-xs">
            {content.heroSupport}
          </p>
        </div>
      </div>

      <div
        ref={revealRef}
        className="pointer-events-none absolute inset-x-0 z-[var(--z-hero-copy)] px-6 text-center opacity-0 will-change-transform"
        aria-hidden
      >
        <p className="mx-auto max-w-2xl text-[clamp(1.4rem,4vw,2.75rem)] font-extrabold uppercase leading-[1.05] tracking-tight text-ink">
          {content.heroRevealTitle}{" "}
          <span className="text-primary">{content.heroRevealAccent}</span>
        </p>
        <p className="mx-auto mt-4 max-w-md text-[0.65rem] uppercase tracking-[0.24em] text-muted">
          {content.heroRevealSupport}
        </p>
      </div>

      <a
        ref={cueRef}
        href="#produtos"
        className="hero-buy-key-shell absolute bottom-7 left-1/2 z-[var(--z-hero-copy)] -translate-x-1/2"
        aria-label="Comprar agora — ver soluções 6DNX"
      >
        <span className="hero-buy-key">
          <span className="hero-buy-key__label">{content.heroCtaLabel}</span>
          <span ref={cueArrowRef} className="hero-buy-key__glow" aria-hidden />
        </span>
      </a>
    </section>
  );
}
