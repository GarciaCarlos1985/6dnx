"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const OPERATOR_FRAMES = [
  "/operador-premium-v2.webp",
  "/operador-frame-03.webp",
  "/operador-frame-04-v2.webp",
  "/operador-frame-05.webp",
  "/operador2-premium.webp",
] as const;

// Visual contract: pose 1 has exactly two arms and two hands: one index
// finger on the lips and the other hand clearly resting on the upper chest.
// Poses 2–5 preserve their body posture, and every wing stays pale ivory.
const ANGEL_FRAMES = [
  "/anjo-hero-shh-v4.webp",
  "/anjo-frame-02-ivory-v2.webp",
  "/anjo-frame-03-ivory-v2.webp",
  "/anjo-frame-04-ivory-v2.webp",
  "/anjo-frame-05-ivory-v2.webp",
] as const;

const PRODUCT_LEFT_FRAMES = ["/casal-killa.webp"] as const;
const PRODUCT_RIGHT_FRAMES = ["/anjo-hero-shh-v4.webp"] as const;

const FEATHERS = [
  { x: 18, delay: 0.2, duration: 7.4, rotate: 54 },
  { x: 31, delay: 2.8, duration: 8.8, rotate: -42 },
  { x: 45, delay: 1.2, duration: 6.9, rotate: 68 },
  { x: 57, delay: 4.1, duration: 9.2, rotate: -58 },
  { x: 70, delay: 0.8, duration: 7.8, rotate: 46 },
  { x: 82, delay: 3.4, duration: 8.4, rotate: -64 },
] as const;

const EMBERS = [
  { x: 14, delay: 0.4, duration: 4.8 },
  { x: 28, delay: 2.1, duration: 5.6 },
  { x: 43, delay: 1.2, duration: 4.4 },
  { x: 57, delay: 3.1, duration: 6.2 },
  { x: 72, delay: 0.9, duration: 5.2 },
  { x: 86, delay: 2.7, duration: 4.9 },
] as const;

type FeatherStyle = CSSProperties & {
  "--feather-rotation": string;
};

type CinematicCompanionsProps = {
  mode?: "full" | "beams-only";
  scene?: "page" | "products";
  aurasEnabled?: boolean;
  pointerEffectsEnabled?: boolean;
  smokeEnabled?: boolean;
};

export function CinematicCompanions({
  mode = "full",
  scene = "page",
  aurasEnabled = true,
  pointerEffectsEnabled = true,
  smokeEnabled = true,
}: CinematicCompanionsProps) {
  const beamsOnly = mode === "beams-only";
  const productScene = scene === "products";
  const leftFrames = productScene ? PRODUCT_LEFT_FRAMES : OPERATOR_FRAMES;
  const rightFrames = productScene ? PRODUCT_RIGHT_FRAMES : ANGEL_FRAMES;
  const layerRef = useRef<HTMLDivElement>(null);
  const beamLayerRef = useRef<HTMLDivElement>(null);
  const operatorRef = useRef<HTMLDivElement>(null);
  const angelRef = useRef<HTMLDivElement>(null);
  const operatorReactiveRef = useRef<HTMLDivElement>(null);
  const angelReactiveRef = useRef<HTMLDivElement>(null);
  const operatorBeamRef = useRef<HTMLSpanElement>(null);
  const angelBeamRef = useRef<HTMLSpanElement>(null);
  const operatorTransitionRef = useRef<HTMLSpanElement>(null);
  const angelTransitionRef = useRef<HTMLSpanElement>(null);
  const operatorFrameRefs = useRef<Array<HTMLDivElement | null>>([]);
  const angelFrameRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        desktop: "(min-width: 768px)",
        finePointer: "(pointer: fine)",
      },
      (context) => {
        const { motion, desktop, finePointer } = context.conditions as {
          motion: boolean;
          desktop: boolean;
          finePointer: boolean;
        };
        const layer = layerRef.current;
        const beamLayer = beamLayerRef.current;
        const storyTrigger = productScene
          ? document.querySelector<HTMLElement>("#produtos")
          : document.documentElement;
        if (!layer || !beamLayer || !storyTrigger) return;

        if (!motion || !desktop) {
          if (!productScene) {
            gsap.set([layer, beamLayer], { opacity: 1 });
            return;
          }

          const syncStaticVisibility = (self: ScrollTrigger) => {
            gsap.set([layer, beamLayer], {
              opacity: self.isActive ? 1 : 0,
            });
          };
          ScrollTrigger.create({
            trigger: storyTrigger,
            start: "top 92%",
            end: "bottom top",
            onToggle: syncStaticVisibility,
            onRefresh: syncStaticVisibility,
          });
          return;
        }

        const operatorFrames = operatorFrameRefs.current.filter(
          (frame): frame is HTMLDivElement => frame !== null,
        );
        const angelFrames = angelFrameRefs.current.filter(
          (frame): frame is HTMLDivElement => frame !== null,
        );

        gsap.set([layer, beamLayer], { opacity: productScene ? 0 : 1 });
        if (!beamsOnly) {
          const inactiveFrames = [
            ...operatorFrames.slice(1),
            ...angelFrames.slice(1),
          ];
          if (inactiveFrames.length > 0) {
            gsap.set(inactiveFrames, {
              opacity: 0,
              scale: 0.965,
              filter: "blur(10px) brightness(1.25)",
            });
          }
          gsap.set([operatorFrames[0], angelFrames[0]], {
            opacity: 1,
            scale: 1,
            filter: "blur(0px) brightness(1)",
          });
          gsap.set(
            [operatorTransitionRef.current, angelTransitionRef.current],
            { opacity: 0, scale: 0.86 },
          );
        }

        // One scroll story owns every pose from the first hero pixel to the
        // document footer. The previous hero/lower-section timelines repeated
        // the same sequence and forced an unnecessarily long pinned intro.
        const story = gsap.timeline({
          scrollTrigger: {
            trigger: storyTrigger,
            start: productScene ? "top 92%" : "top top",
            end: () => ScrollTrigger.maxScroll(window),
            scrub: 0.9,
            invalidateOnRefresh: true,
          },
        });

        if (productScene) {
          story.fromTo(
            [layer, beamLayer],
            { opacity: 0 },
            {
              opacity: 1,
              ease: "power1.out",
              duration: 0.08,
              immediateRender: true,
            },
            0,
          );
        }

        story
          .fromTo(
            operatorRef.current,
            productScene
              ? { xPercent: -8, yPercent: 7, scale: 0.91, rotate: -1.8 }
              : { xPercent: -5, yPercent: 1, scale: 0.96, rotate: -1.2 },
            {
              xPercent: 3,
              yPercent: -4,
              scale: productScene ? 1.16 : 1.12,
              rotate: 1.2,
              ease: "none",
              duration: 1,
            },
            0,
          )
          .fromTo(
            angelRef.current,
            productScene
              ? { xPercent: 8, yPercent: 7, scale: 0.91, rotate: 1.8 }
              : { xPercent: 5, yPercent: 1, scale: 0.96, rotate: 1.2 },
            {
              xPercent: -3,
              yPercent: -5,
              scale: productScene ? 1.18 : 1.14,
              rotate: -1.2,
              ease: "none",
              duration: 1,
            },
            0,
          );

        const pulseTransition = (
          transition: HTMLSpanElement | null,
          at: number,
        ) => {
          if (!transition) return;

          story
            .fromTo(
              transition,
              { opacity: 0, scale: 0.84 },
              {
                // Half of the previous peak keeps the transition
                // subordinate to faces, wings, weapons, and product copy.
                opacity: 0.42,
                scale: 1.08,
                ease: "power2.out",
                duration: 0.055,
                immediateRender: false,
              },
              at,
            )
            .to(
              transition,
              {
                opacity: 0,
                scale: 1.22,
                ease: "power2.in",
                duration: 0.075,
              },
              at + 0.055,
            );
        };

        const crossFade = (
          frames: HTMLDivElement[],
          frameIndex: number,
          at: number,
          transition: HTMLSpanElement | null,
        ) => {
          const current = frames[frameIndex];
          const next = frames[frameIndex + 1];
          if (!current || !next) return;

          story
            .to(
              current,
              {
                opacity: 0,
                scale: 1.045,
                filter: "blur(10px) brightness(1.4)",
                ease: "power2.inOut",
                duration: 0.1,
              },
              at,
            )
            .fromTo(
              next,
              {
                opacity: 0,
                scale: 0.955,
                filter: "blur(12px) brightness(1.5)",
              },
              {
                opacity: 1,
                scale: 1,
                filter: "blur(0px) brightness(1)",
                ease: "power2.inOut",
                duration: 0.12,
              },
              at,
            );

          pulseTransition(transition, at);
        };

        if (!beamsOnly) {
          const transitions = [0.16, 0.36, 0.56, 0.76] as const;
          if (productScene) {
            transitions.forEach((at) => {
              pulseTransition(operatorTransitionRef.current, at);
              pulseTransition(angelTransitionRef.current, at);
            });
          } else {
            transitions.forEach((at, frameIndex) => {
              crossFade(
                operatorFrames,
                frameIndex,
                at,
                operatorTransitionRef.current,
              );
              crossFade(
                angelFrames,
                frameIndex,
                at,
                angelTransitionRef.current,
              );
            });
          }
        }

        if (!finePointer || !pointerEffectsEnabled) return;

        const operatorReactive = operatorReactiveRef.current;
        const angelReactive = angelReactiveRef.current;
        const operatorBeam = operatorBeamRef.current;
        const angelBeam = angelBeamRef.current;
        if (
          !operatorReactive ||
          !angelReactive ||
          !operatorBeam ||
          !angelBeam ||
          !operatorRef.current ||
          !angelRef.current
        ) {
          return;
        }

        gsap.set([operatorReactive, angelReactive], {
          transformPerspective: 900,
          transformOrigin: "50% 70%",
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
            operatorRef.current,
            operatorReactive,
            operatorBeam,
            productScene ? { x: 0.4, y: 0.36 } : { x: 0.36, y: 0.45 },
            { x: 17, y: 11 },
          ),
          createController(
            angelRef.current,
            angelReactive,
            angelBeam,
            { x: 0.56, y: 0.44 },
            { x: 15, y: 10 },
          ),
        ];

        const clamp = gsap.utils.clamp(-1, 1);
        let pointerX = -10_000;
        let pointerY = -10_000;
        let pointerFrame = 0;

        const updateController = (controller: (typeof controllers)[number]) => {
          const rect = controller.actor.getBoundingClientRect();
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
          const intensity = proximity * proximity * (3 - 2 * proximity);

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
          controller.beam.style.setProperty("--beam-x", `${originX}px`);
          controller.beam.style.setProperty("--beam-y", `${originY}px`);
          controller.beam.style.setProperty(
            "--beam-length",
            `${Math.hypot(deltaX, deltaY) + 44}px`,
          );
          controller.beam.style.setProperty(
            "--beam-angle",
            `${Math.atan2(deltaY, deltaX)}rad`,
          );
          controller.beam.style.setProperty(
            "--beam-opacity",
            Math.min(0.92, intensity * 1.12).toFixed(3),
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
        window.addEventListener("pointerout", onPointerOut, {
          passive: true,
        });
        window.addEventListener("blur", resetPointerEffect);

        return () => {
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerout", onPointerOut);
          window.removeEventListener("blur", resetPointerEffect);
          window.cancelAnimationFrame(pointerFrame);
        };
      },
    );

    return () => mm.revert();
  }, [aurasEnabled, beamsOnly, pointerEffectsEnabled, productScene, smokeEnabled]);

  return (
    <>
      <div
        ref={beamLayerRef}
        className="cinematic-pointer-overlay"
        data-cinematic-scene={scene}
        data-cinematic-pointer={pointerEffectsEnabled ? "on" : "off"}
        aria-hidden
      >
        <span
          ref={operatorBeamRef}
          className="cinematic-pointer-beam cinematic-pointer-beam--operator"
        >
          <span className="cinematic-pointer-beam__origin" />
        </span>
        <span
          ref={angelBeamRef}
          className="cinematic-pointer-beam cinematic-pointer-beam--angel"
        >
          <span className="cinematic-pointer-beam__origin" />
        </span>
      </div>

      <div
        ref={layerRef}
        className="cinematic-companions"
        data-cinematic-mode={mode}
        data-cinematic-scene={scene}
        data-cinematic-auras={aurasEnabled ? "on" : "off"}
        data-cinematic-pointer={pointerEffectsEnabled ? "on" : "off"}
        data-cinematic-smoke={smokeEnabled ? "on" : "off"}
        aria-hidden
      >
        <div
          ref={operatorRef}
          data-cinematic-character={productScene ? "couple" : "operator"}
          className={`cinematic-actor cinematic-actor--operator ${
            productScene ? "cinematic-actor--couple" : ""
          }`}
        >
          <div ref={operatorReactiveRef} className="cinematic-actor__reactive">
            {!beamsOnly ? (
              <>
                <span className="cinematic-actor__aura" />
                <span
                  ref={operatorTransitionRef}
                  className="cinematic-actor__transition"
                />
                <div className="cinematic-actor__frames">
                  {leftFrames.map((src, index) => (
                    <div
                      key={src}
                      ref={(node) => {
                        operatorFrameRefs.current[index] = node;
                      }}
                      data-cinematic-pose={index + 1}
                      className={`cinematic-actor__frame ${
                        index === 0 ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={
                          index === 0 ? (productScene ? "low" : "high") : "auto"
                        }
                        sizes="(max-width: 899px) 48vw, 46vw"
                        className="object-contain object-left-bottom"
                      />
                    </div>
                  ))}
                </div>
                <span className="cinematic-pointer-light" />
                <span className="cinematic-waist-smoke cinematic-waist-smoke--left" />
                <div className="cinematic-embers">
                  {EMBERS.map((ember) => (
                    <span
                      key={`${ember.x}-${ember.delay}`}
                      style={{
                        left: `${ember.x}%`,
                        animationDelay: `-${ember.delay}s`,
                        animationDuration: `${ember.duration}s`,
                      }}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div
          ref={angelRef}
          data-cinematic-character="angel"
          className="cinematic-actor cinematic-actor--angel"
        >
          <div ref={angelReactiveRef} className="cinematic-actor__reactive">
            {!beamsOnly ? (
              <>
                <span className="cinematic-actor__aura" />
                <span
                  ref={angelTransitionRef}
                  className="cinematic-actor__transition"
                />
                <div className="cinematic-actor__frames">
                  {rightFrames.map((src, index) => (
                    <div
                      key={src}
                      ref={(node) => {
                        angelFrameRefs.current[index] = node;
                      }}
                      data-cinematic-pose={index + 1}
                      className={`cinematic-actor__frame ${
                        index === 0 ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={
                          index === 0 ? (productScene ? "low" : "high") : "auto"
                        }
                        sizes="(max-width: 899px) 54vw, 54vw"
                        className="object-contain object-right-bottom"
                      />
                    </div>
                  ))}
                </div>
                <span className="cinematic-pointer-light" />
                <span className="cinematic-waist-smoke cinematic-waist-smoke--right" />
                <div className="cinematic-feathers">
                  {FEATHERS.map((feather) => (
                    <span
                      key={`${feather.x}-${feather.delay}`}
                      style={
                        {
                          left: `${feather.x}%`,
                          animationDelay: `-${feather.delay}s`,
                          animationDuration: `${feather.duration}s`,
                          "--feather-rotation": `${feather.rotate}deg`,
                        } as FeatherStyle
                      }
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
