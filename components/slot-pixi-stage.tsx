"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Application,
  Container,
  Graphics,
  Text,
  Texture,
} from "pixi.js";
import {
  SLOT_PREVIEW_REEL_STOP_DURATION_MS,
  SLOT_PREVIEW_REEL_STOP_START_MS,
} from "@/lib/slot/preview-contract";

type MascotMood = "idle" | "anticipation" | "celebration";

type SlotPixiStageProps = {
  mood: MascotMood;
  round: number;
};

type SceneController = {
  setPhase: (mood: MascotMood, round: number) => void;
};

type SymbolDefinition = {
  glyph: string;
  label: string;
  color: number;
  accent: number;
};

type ReelTile = {
  container: Container;
  icon: Text;
  label: Text;
};

type ReelModel = {
  container: Container;
  tiles: ReelTile[];
  cursor: number;
  speed: number;
  stopped: boolean;
  resultPrepared: boolean;
  stopStartPositions: number[];
  stopDistance: number;
};

type ParticleModel = {
  view: Graphics;
  angle: number;
  distance: number;
  life: number;
  duration: number;
};

const STAGE_WIDTH = 960;
const STAGE_HEIGHT = 660;
const REEL_HEIGHT = 330;
const TILE_HEIGHT = 110;
const REEL_COUNT = 4;
const REEL_MARKS = ["6", "D", "N", "X"] as const;

const SYMBOLS: readonly SymbolDefinition[] = [
  { glyph: "6", label: "SEIS", color: 0xf7c24b, accent: 0xff193f },
  { glyph: "D", label: "DORME", color: 0xff3157, accent: 0xffc857 },
  { glyph: "N", label: "NOIS", color: 0xffe8a8, accent: 0xd20a34 },
  { glyph: "X", label: "XITA", color: 0xff183e, accent: 0xffcd66 },
  { glyph: "♛", label: "COROA", color: 0xffd76a, accent: 0xa70b25 },
  { glyph: "◆", label: "RUBI", color: 0xff3157, accent: 0xffc857 },
  { glyph: "✦", label: "ESTRELA", color: 0xffe8a8, accent: 0xd20a34 },
  { glyph: "×2", label: "CONCEITO", color: 0xffd76a, accent: 0xff2448 },
  { glyph: "+1", label: "GIRO DEMO", color: 0xeed292, accent: 0xff2448 },
] as const;

const RESULT_ROWS = [
  [
    [6, 0, 4],
    [5, 1, 7],
    [8, 2, 6],
    [4, 3, 5],
  ],
  [
    [0, 6, 5],
    [2, 7, 4],
    [1, 8, 6],
    [3, 4, 0],
  ],
] as const;

function deterministicUnit(index: number, seed: number) {
  const value = Math.sin((index + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function setTileSymbol(tile: ReelTile, symbol: SymbolDefinition) {
  tile.icon.text = symbol.glyph;
  tile.icon.style.fill = symbol.color;
  tile.icon.style.stroke = { color: symbol.accent, width: 3 };
  tile.label.text = symbol.label;
  tile.label.style.fill = symbol.color;
}

async function buildScene(
  pixi: typeof import("pixi.js"),
  app: Application,
  reducedMotion: boolean,
): Promise<SceneController> {
  const {
    Assets,
    BlurFilter,
    Container,
    Graphics,
    Sprite,
    Text,
  } = pixi;

  const [idleTexture, anticipationTexture, celebrationTexture, excitedTexture] =
    await Promise.all([
      Assets.load<Texture>("/slot/dragon-idle-v2.png"),
      Assets.load<Texture>("/slot/dragon-anticipation-v2.png"),
      Assets.load<Texture>("/slot/dragon-celebration-v2.png"),
      Assets.load<Texture>("/slot/dragon-excited-v2.png"),
    ]);

  const mascotTextures = {
    idle: idleTexture,
    anticipation: anticipationTexture,
    celebration: celebrationTexture,
  } satisfies Record<MascotMood, Texture>;

  const ambientMascotTextures = {
    idle: excitedTexture,
    anticipation: anticipationTexture,
    celebration: excitedTexture,
  } satisfies Record<MascotMood, Texture>;

  const mascotBaseScale = 0.39;
  const ambientMascotBaseScale = 0.24;

  const background = new Graphics()
    .roundRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT, 34)
    .fill({ color: 0x070207 })
    .stroke({ color: 0xf3bd45, width: 3, alpha: 0.55 });
  app.stage.addChild(background);

  const ambientGlow = new Graphics()
    .circle(250, 225, 230)
    .fill({ color: 0xef0038, alpha: 0.24 });
  ambientGlow.filters = [new BlurFilter({ strength: 24, quality: 1 })];
  app.stage.addChild(ambientGlow);

  const reelGlow = new Graphics()
    .roundRect(355, 150, 560, 365, 24)
    .fill({ color: 0xff163f, alpha: 0.15 });
  reelGlow.filters = [new BlurFilter({ strength: 18, quality: 1 })];
  app.stage.addChild(reelGlow);

  const scanLines = new Graphics();
  for (let y = 16; y < STAGE_HEIGHT; y += 8) {
    scanLines.rect(0, y, STAGE_WIDTH, 1).fill({ color: 0xffffff, alpha: 0.018 });
  }
  app.stage.addChild(scanLines);

  const crownMark = new Text({
    text: "6DNX // EXPERIENCE LAB",
    style: {
      fill: 0xf5cf76,
      fontFamily: "Arial, sans-serif",
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: 5,
    },
  });
  crownMark.position.set(40, 31);
  app.stage.addChild(crownMark);

  const safetyMark = new Text({
    text: "PRÉVIA VISUAL  •  SEM MOEDAS  •  SEM PRÊMIO",
    style: {
      fill: 0xff4769,
      fontFamily: "Arial, sans-serif",
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 2.5,
    },
  });
  safetyMark.anchor.set(1, 0);
  safetyMark.position.set(STAGE_WIDTH - 40, 34);
  app.stage.addChild(safetyMark);

  const mascotAura = new Graphics()
    .circle(180, 250, 138)
    .fill({ color: 0xef0038, alpha: 0.3 });
  mascotAura.filters = [new BlurFilter({ strength: 20, quality: 1 })];
  app.stage.addChild(mascotAura);

  const mascot = new Sprite(mascotTextures.idle);
  mascot.anchor.set(0.5);
  mascot.position.set(180, 252);
  mascot.scale.set(mascotBaseScale);
  app.stage.addChild(mascot);

  const ambientMascot = new Sprite(ambientMascotTextures.idle);
  ambientMascot.anchor.set(0.5);
  ambientMascot.position.set(866, 105);
  ambientMascot.scale.set(ambientMascotBaseScale);
  ambientMascot.alpha = 0.14;
  app.stage.addChild(ambientMascot);

  const mascotMoodLabel = new Text({
    text: "O GUARDIÃO ESTÁ PRONTO",
    style: {
      fill: 0xf7d47b,
      fontFamily: "Arial, sans-serif",
      fontSize: 16,
      fontWeight: "900",
      letterSpacing: 1.4,
      align: "center",
      wordWrap: true,
      wordWrapWidth: 245,
      dropShadow: {
        alpha: 0.9,
        blur: 8,
        color: 0x000000,
        distance: 2,
      },
    },
  });
  mascotMoodLabel.anchor.set(0.5);
  mascotMoodLabel.position.set(180, 426);
  app.stage.addChild(mascotMoodLabel);

  const reelFrame = new Graphics()
    .roundRect(354, 92, 568, 425, 24)
    .fill({ color: 0x040204, alpha: 0.98 })
    .stroke({ color: 0xff2c50, width: 3, alpha: 0.78 });
  app.stage.addChild(reelFrame);

  const reels: ReelModel[] = [];
  const reelWidth = 122;
  const reelGap = 9;
  const reelStartX = 371;
  const reelStartY = 132;

  for (let reelIndex = 0; reelIndex < REEL_COUNT; reelIndex += 1) {
    const reelX = reelStartX + reelIndex * (reelWidth + reelGap);
    const reelMark = new Text({
      text: REEL_MARKS[reelIndex],
      style: {
        fill: reelIndex === 0 ? 0xf7c24b : 0xff3157,
        fontFamily: "Arial, sans-serif",
        fontSize: 18,
        fontWeight: "900",
        letterSpacing: 2,
      },
    });
    reelMark.anchor.set(0.5);
    reelMark.position.set(reelX + reelWidth / 2, 112);
    app.stage.addChild(reelMark);

    const reelBackdrop = new Graphics()
      .roundRect(reelX, reelStartY, reelWidth, REEL_HEIGHT, 16)
      .fill({ color: 0x0d070a })
      .stroke({ color: 0xf6bf4e, width: 2, alpha: 0.42 });
    app.stage.addChild(reelBackdrop);

    const reelMask = new Graphics()
      .roundRect(reelX + 2, reelStartY + 2, reelWidth - 4, REEL_HEIGHT - 4, 14)
      .fill({ color: 0xffffff });
    app.stage.addChild(reelMask);

    const reelContainer = new Container();
    reelContainer.position.set(reelX, reelStartY);
    reelContainer.mask = reelMask;
    app.stage.addChild(reelContainer);

    const tiles: ReelTile[] = [];
    for (let tileIndex = 0; tileIndex < 5; tileIndex += 1) {
      const tileContainer = new Container();
      tileContainer.y = (tileIndex - 1) * TILE_HEIGHT;

      const tileBackground = new Graphics()
        .roundRect(5, 4, reelWidth - 10, TILE_HEIGHT - 8, 12)
        .fill({ color: tileIndex % 2 === 0 ? 0x15070c : 0x090609 })
        .stroke({ color: 0xffffff, width: 1, alpha: 0.07 });
      tileContainer.addChild(tileBackground);

      const icon = new Text({
        text: "6",
        style: {
          fill: 0xf7c24b,
          fontFamily: "Georgia, serif",
          fontSize: 42,
          fontWeight: "900",
          stroke: { color: 0xff193f, width: 3 },
          dropShadow: {
            alpha: 0.65,
            blur: 9,
            color: 0xff0038,
            distance: 0,
          },
        },
      });
      icon.anchor.set(0.5);
      icon.position.set(reelWidth / 2, 50);
      tileContainer.addChild(icon);

      const label = new Text({
        text: "SEIS",
        style: {
          fill: 0xf7c24b,
          fontFamily: "Arial, sans-serif",
          fontSize: 8,
          fontWeight: "800",
          letterSpacing: 2,
        },
      });
      label.anchor.set(0.5);
      label.position.set(reelWidth / 2, 88);
      tileContainer.addChild(label);

      setTileSymbol(
        { container: tileContainer, icon, label },
        SYMBOLS[(tileIndex + reelIndex * 2) % SYMBOLS.length],
      );
      reelContainer.addChild(tileContainer);
      tiles.push({ container: tileContainer, icon, label });
    }

    reels.push({
      container: reelContainer,
      tiles,
      cursor: reelIndex * 2,
      speed: 0,
      stopped: true,
      resultPrepared: true,
      stopStartPositions: [],
      stopDistance: 0,
    });
  }

  const paylineGlow = new Graphics()
    .rect(360, reelStartY + TILE_HEIGHT + TILE_HEIGHT / 2 - 4, 556, 8)
    .fill({ color: 0xff0737, alpha: 0.55 });
  paylineGlow.filters = [new BlurFilter({ strength: 8, quality: 1 })];
  app.stage.addChild(paylineGlow);

  const payline = new Graphics()
    .rect(360, reelStartY + TILE_HEIGHT + TILE_HEIGHT / 2 - 1, 556, 2)
    .fill({ color: 0xffd266, alpha: 0.92 });
  app.stage.addChild(payline);

  const pulseRing = new Graphics()
    .circle(640, 297, 220)
    .stroke({ color: 0xffd266, width: 7, alpha: 0.65 });
  pulseRing.alpha = 0;
  app.stage.addChild(pulseRing);

  const statusBar = new Graphics()
    .roundRect(38, 478, 884, 72, 18)
    .fill({ color: 0x12070b, alpha: 0.95 })
    .stroke({ color: 0xffffff, width: 1, alpha: 0.1 });
  app.stage.addChild(statusBar);

  const statusTitle = new Text({
    text: "MOTOR VISUAL EM ESPERA",
    style: {
      fill: 0xffffff,
      fontFamily: "Arial, sans-serif",
      fontSize: 18,
      fontWeight: "900",
      letterSpacing: 2,
    },
  });
  statusTitle.position.set(68, 495);
  app.stage.addChild(statusTitle);

  const statusDetail = new Text({
    text: "Clique em VER ANIMAÇÃO para executar a sequência determinística.",
    style: {
      fill: 0xc8a7ad,
      fontFamily: "Arial, sans-serif",
      fontSize: 13,
    },
  });
  statusDetail.position.set(68, 525);
  app.stage.addChild(statusDetail);

  const footer = new Text({
    text: "PIXIJS  •  4 COLUNAS  •  SÍMBOLOS DEMO SEM EFEITO",
    style: {
      fill: 0x8d6b72,
      fontFamily: "Arial, sans-serif",
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 2.2,
    },
  });
  footer.anchor.set(0.5);
  footer.position.set(STAGE_WIDTH / 2, 614);
  app.stage.addChild(footer);

  const particles: ParticleModel[] = [];
  for (let index = 0; index < 42; index += 1) {
    const color = index % 3 === 0 ? 0xffd76a : index % 2 === 0 ? 0xff3157 : 0xffffff;
    const particle = new Graphics()
      .star(0, 0, 4, 3 + (index % 4), 1.3)
      .fill({ color, alpha: 0.94 });
    particle.blendMode = "add";
    particle.visible = false;
    app.stage.addChild(particle);
    particles.push({
      view: particle,
      angle: deterministicUnit(index, 4) * Math.PI * 2,
      distance: 140 + deterministicUnit(index, 9) * 360,
      life: 0,
      duration: 650 + deterministicUnit(index, 12) * 720,
    });
  }

  let phase: MascotMood = "idle";
  let round = 0;
  let phaseStarted = performance.now();
  let resultLocked = true;
  let elapsed = 0;

  const wrapReelY = (value: number) => {
    const range = TILE_HEIGHT * 5;
    return ((((value + TILE_HEIGHT) % range) + range) % range) - TILE_HEIGHT;
  };

  const applyResultSymbols = (
    reelIndex: number,
    resultRound: number,
    orderedTiles: ReelTile[],
  ) => {
    const result = RESULT_ROWS[resultRound % RESULT_ROWS.length];
    orderedTiles.forEach((tile, tileIndex) => {
      const rowIndex = Math.min(2, Math.max(0, tileIndex - 1));
      const symbolIndex = result[reelIndex][rowIndex];
      setTileSymbol(tile, SYMBOLS[symbolIndex]);
    });
  };

  const snapReelResult = (reelIndex: number, resultRound: number) => {
    const reel = reels[reelIndex];
    const orderedTiles = [...reel.tiles].sort(
      (left, right) => left.container.y - right.container.y,
    );
    orderedTiles.forEach((tile, tileIndex) => {
      tile.container.y = (tileIndex - 1) * TILE_HEIGHT;
    });
    applyResultSymbols(reelIndex, resultRound, orderedTiles);
    reel.speed = 0;
    reel.stopped = true;
    reel.resultPrepared = true;
    reel.stopStartPositions = [];
    reel.stopDistance = 0;
  };

  const snapResult = (resultRound: number) => {
    reels.forEach((_, reelIndex) => snapReelResult(reelIndex, resultRound));
  };

  const prepareReelResult = (reelIndex: number, resultRound: number) => {
    const reel = reels[reelIndex];
    const projected = reel.tiles
      .map((tile, tileIndex) => ({
        tile,
        y: wrapReelY(
          reel.stopStartPositions[tileIndex] + reel.stopDistance,
        ),
      }))
      .sort((left, right) => left.y - right.y);
    applyResultSymbols(
      reelIndex,
      resultRound,
      projected.map((entry) => entry.tile),
    );
    reel.resultPrepared = true;
  };

  const advanceReel = (reel: ReelModel, reelIndex: number, distance: number) => {
    reel.tiles.forEach((tile) => {
      const previousY = tile.container.y;
      tile.container.y = wrapReelY(previousY + distance);
      if (tile.container.y < previousY) {
        reel.cursor = (reel.cursor + 1) % SYMBOLS.length;
        setTileSymbol(tile, SYMBOLS[(reel.cursor + reelIndex) % SYMBOLS.length]);
      }
    });
  };

  const burst = (seed: number) => {
    particles.forEach((particle, index) => {
      particle.angle = deterministicUnit(index, seed + 17) * Math.PI * 2;
      particle.distance = 140 + deterministicUnit(index, seed + 23) * 360;
      particle.life = 1;
      particle.view.position.set(640, 297);
      particle.view.alpha = 1;
      particle.view.scale.set(0.55 + deterministicUnit(index, seed + 3));
      particle.view.visible = true;
    });
  };

  const setPhase = (nextPhase: MascotMood, nextRound: number) => {
    if (phase === nextPhase && round === nextRound) return;
    phase = nextPhase;
    round = nextRound;
    phaseStarted = performance.now();
    mascot.texture = mascotTextures[nextPhase];
    ambientMascot.texture = ambientMascotTextures[nextPhase];
    resultLocked = nextPhase !== "celebration";

    if (nextPhase === "idle") {
      mascotMoodLabel.text = "O GUARDIÃO ESTÁ PRONTO";
      statusTitle.text = "MOTOR VISUAL EM ESPERA";
      statusDetail.text = "Clique em VER ANIMAÇÃO para executar a sequência determinística.";
    } else if (nextPhase === "anticipation") {
      mascotMoodLabel.text = "SEGURA A EMOÇÃO...";
      statusTitle.text = "ROLOS EM MOVIMENTO";
      statusDetail.text = "As quatro colunas desaceleram e param uma por vez.";
      reels.forEach((reel) => {
        reel.speed = 0;
        reel.stopped = false;
        reel.resultPrepared = false;
        reel.stopStartPositions = [];
        reel.stopDistance = 0;
      });
      if (reducedMotion) snapResult(round + 1);
    } else {
      mascotMoodLabel.text = "A CABINE GANHOU VIDA!";
      statusTitle.text = "COMBINAÇÃO CENOGRÁFICA";
      statusDetail.text = "×2 e +1 são conceitos visuais sem efeito nesta prévia.";
    }
  };

  app.ticker.add((ticker) => {
    const deltaMs = Math.min(50, ticker.deltaMS);
    const delta = deltaMs / 16.6667;
    elapsed += deltaMs;
    const phaseElapsed = performance.now() - phaseStarted;

    ambientGlow.alpha = reducedMotion
      ? 0.72
      : 0.72 + Math.sin(elapsed * 0.0018) * 0.12;
    reelGlow.alpha = reducedMotion
      ? 0.62
      : 0.62 + Math.sin(elapsed * 0.0026 + 1.3) * 0.16;
    paylineGlow.alpha = reducedMotion
      ? 0.56
      : 0.56 + Math.sin(elapsed * 0.005) * 0.22;

    const ambientAlphaTarget =
      phase === "celebration" ? 0.58 : phase === "anticipation" ? 0.34 : 0.14;
    if (reducedMotion) {
      ambientMascot.alpha = ambientAlphaTarget;
    } else {
      ambientMascot.alpha +=
        (ambientAlphaTarget - ambientMascot.alpha) * 0.1 * delta;
    }

    if (!reducedMotion && phase === "anticipation") {
      mascot.position.x = 180 + Math.sin(elapsed * 0.035) * 4;
      mascot.position.y = 252 + Math.cos(elapsed * 0.028) * 4;
      mascot.scale.set(
        mascotBaseScale * (1 + Math.sin(elapsed * 0.018) * 0.025),
      );
      mascot.rotation = Math.sin(elapsed * 0.028) * 0.015;
      ambientMascot.position.set(
        866 + Math.sin(elapsed * 0.011) * 10,
        112 + Math.cos(elapsed * 0.015) * 7,
      );
      ambientMascot.scale.set(
        ambientMascotBaseScale * (1 + Math.sin(elapsed * 0.013) * 0.035),
      );
      ambientMascot.rotation = Math.sin(elapsed * 0.01) * 0.026;

      reels.forEach((reel, reelIndex) => {
        if (reel.stopped) return;

        const stopStart = SLOT_PREVIEW_REEL_STOP_START_MS[reelIndex];
        const cruiseSpeed = 18 + reelIndex * 1.4;
        if (phaseElapsed < stopStart) {
          const acceleration = Math.min(1, phaseElapsed / 700);
          reel.speed = cruiseSpeed * (1 - Math.pow(1 - acceleration, 3));
          advanceReel(reel, reelIndex, reel.speed * delta);
          return;
        }

        if (reel.stopStartPositions.length === 0) {
          reel.stopStartPositions = reel.tiles.map((tile) => tile.container.y);
          const referenceY = reel.stopStartPositions[0];
          const offset = ((referenceY + TILE_HEIGHT) % TILE_HEIGHT + TILE_HEIGHT) % TILE_HEIGHT;
          const alignmentDistance = offset < 0.01 ? TILE_HEIGHT : TILE_HEIGHT - offset;
          reel.stopDistance = alignmentDistance + TILE_HEIGHT * 2;
        }

        const stopProgress = Math.min(
          1,
          (phaseElapsed - stopStart) / SLOT_PREVIEW_REEL_STOP_DURATION_MS,
        );
        const easedDistance =
          reel.stopDistance * (1 - Math.pow(1 - stopProgress, 3));
        reel.tiles.forEach((tile, tileIndex) => {
          tile.container.y = wrapReelY(
            reel.stopStartPositions[tileIndex] + easedDistance,
          );
        });

        if (stopProgress >= 0.58 && !reel.resultPrepared) {
          prepareReelResult(reelIndex, round + 1);
        }
        if (stopProgress >= 1) {
          snapReelResult(reelIndex, round + 1);
        }
      });
    }

    if (phase === "celebration") {
      const celebrationLift = Math.max(0, Math.sin(phaseElapsed * 0.009));
      if (reducedMotion) {
        mascot.position.set(180, 252);
        mascot.scale.set(mascotBaseScale);
        mascot.rotation = 0;
        ambientMascot.position.set(844, 118);
        ambientMascot.scale.set(ambientMascotBaseScale * 1.18);
        ambientMascot.rotation = 0;
        pulseRing.alpha = 0;
      } else {
        mascot.position.set(180, 252 - celebrationLift * 18);
        mascot.scale.set(mascotBaseScale * (1 + celebrationLift * 0.08));
        mascot.rotation = Math.sin(phaseElapsed * 0.012) * 0.025;
        ambientMascot.position.set(
          844 + Math.sin(phaseElapsed * 0.008) * 7,
          118 - celebrationLift * 24,
        );
        ambientMascot.scale.set(
          ambientMascotBaseScale * (1.18 + celebrationLift * 0.1),
        );
        ambientMascot.rotation = Math.sin(phaseElapsed * 0.011) * 0.035;
        pulseRing.alpha = Math.max(0, 0.68 - phaseElapsed / 980);
        pulseRing.scale.set(0.62 + Math.min(1, phaseElapsed / 700) * 0.66);
      }

      if (!resultLocked && (reducedMotion || phaseElapsed >= 120)) {
        snapResult(round);
        if (!reducedMotion) burst(round + 1);
        resultLocked = true;
      }
    } else {
      pulseRing.alpha = 0;
    }

    if (phase === "idle") {
      if (reducedMotion) {
        mascot.position.set(180, 252);
        mascot.scale.set(mascotBaseScale);
        mascot.rotation = 0;
        ambientMascot.position.set(866, 105);
        ambientMascot.scale.set(ambientMascotBaseScale);
        ambientMascot.rotation = 0;
      } else {
        mascot.position.set(
          180 + Math.sin(elapsed * 0.0013) * 3,
          252 + Math.sin(elapsed * 0.0021) * 6,
        );
        mascot.scale.set(
          mascotBaseScale * (1 + Math.sin(elapsed * 0.0017) * 0.018),
        );
        mascot.rotation = Math.sin(elapsed * 0.0011) * 0.012;
        ambientMascot.position.set(
          866 + Math.sin(elapsed * 0.0011) * 6,
          105 + Math.cos(elapsed * 0.0014) * 5,
        );
        ambientMascot.scale.set(ambientMascotBaseScale);
        ambientMascot.rotation = Math.sin(elapsed * 0.001) * 0.018;
      }
    }

    particles.forEach((particle) => {
      if (!particle.view.visible) return;
      particle.life += deltaMs;
      const progress = particle.life / particle.duration;
      if (progress >= 1) {
        particle.view.visible = false;
        return;
      }
      const distance = particle.distance * Math.sin(progress * Math.PI * 0.82);
      particle.view.position.set(
        640 + Math.cos(particle.angle) * distance,
        297 + Math.sin(particle.angle) * distance + progress * progress * 140,
      );
      particle.view.rotation += 0.08 * delta;
      particle.view.alpha = Math.max(0, 1 - progress);
    });
  });

  snapResult(0);
  return { setPhase };
}

export function SlotPixiStage({ mood, round }: SlotPixiStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const controllerRef = useRef<SceneController | null>(null);
  const propsRef = useRef({ mood, round });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    async function mountStage(stageHost: HTMLDivElement) {
      let initializingApp: Application | null = null;
      try {
        const pixi = await import("pixi.js");
        const app = new pixi.Application();
        initializingApp = app;
        const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
        await app.init({
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          antialias: !coarsePointer,
          autoDensity: true,
          resolution: Math.min(
            window.devicePixelRatio || 1,
            coarsePointer ? 1.35 : 1.6,
          ),
          backgroundAlpha: 0,
          preference: "webgl",
          powerPreference: coarsePointer ? "low-power" : "high-performance",
          autoStart: true,
        });
        app.ticker.maxFPS = 60;
        app.ticker.minFPS = 30;

        if (cancelled) {
          app.destroy({ removeView: false }, { children: true });
          return;
        }

        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        const controller = await buildScene(pixi, app, reducedMotion);
        if (cancelled) {
          app.destroy({ removeView: false }, { children: true });
          return;
        }

        app.canvas.setAttribute("aria-hidden", "true");
        app.canvas.className = "slot-pixi-stage__canvas";
        stageHost.appendChild(app.canvas);
        appRef.current = app;
        initializingApp = null;
        controllerRef.current = controller;
        controller.setPhase(propsRef.current.mood, propsRef.current.round);
        setStatus("ready");
      } catch (error) {
        initializingApp?.destroy({ removeView: false }, { children: true });
        console.error("Falha ao iniciar a prévia visual PixiJS", error);
        if (!cancelled) setStatus("error");
      }
    }

    void mountStage(host);
    return () => {
      cancelled = true;
      controllerRef.current = null;
      if (appRef.current) {
        const canvas = appRef.current.canvas;
        if (canvas.parentNode === host) {
          host.removeChild(canvas);
        }
        appRef.current.destroy({ removeView: false }, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    propsRef.current = { mood, round };
    controllerRef.current?.setPhase(mood, round);
  }, [mood, round]);

  return (
    <div
      className="slot-pixi-stage"
      ref={hostRef}
      data-status={status}
      role="img"
      aria-label="Cabine visual 6DNX com mascote animado, quatro colunas e efeitos cenográficos"
    >
      {status === "loading" ? (
        <span className="slot-pixi-stage__message">Preparando motor visual...</span>
      ) : null}
      {status === "error" ? (
        <span className="slot-pixi-stage__message">
          A prévia avançada não carregou. Nenhuma moeda foi movimentada.
        </span>
      ) : null}
    </div>
  );
}
