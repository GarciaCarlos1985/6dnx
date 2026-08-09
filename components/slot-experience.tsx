"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DiscordMark } from "@/components/discord-mark";
import {
  SLOT_PREVIEW_DURATION_MS,
  SLOT_PREVIEW_REDUCED_DURATION_MS,
  SLOT_PREVIEW_REEL_STOP_COMPLETION_MS,
} from "@/lib/slot/preview-contract";

const SlotPixiStage = dynamic(
  () =>
    import("@/components/slot-pixi-stage").then(
      (module) => module.SlotPixiStage,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="slot-pixi-stage slot-pixi-stage--loading">
        <span className="slot-pixi-stage__message">Preparando motor visual...</span>
      </div>
    ),
  },
);

type AccountSnapshot = {
  user: { name: string };
  balance: number | null;
};

type AccountState =
  | { status: "checking" }
  | { status: "anonymous" }
  | { status: "ready"; account: AccountSnapshot }
  | { status: "unavailable" };

type ExperiencePanel = "machine" | "rules" | null;
type MascotMood = "idle" | "anticipation" | "celebration";

const RULES = [
  {
    title: "Moedas fechadas",
    copy: "As moedas pertencem ao ecossistema 6DNX. Não representam reais, não têm saque e não podem ser compradas diretamente.",
  },
  {
    title: "Resultado no servidor",
    copy: "Quando a experiência real existir, saldo, limite, giro e histórico serão decididos no servidor — nunca pelo navegador.",
  },
  {
    title: "Uso com identidade",
    copy: "A demonstração é pública. A experiência real exigirá uma conta conectada para proteger saldo, limites e histórico.",
  },
  {
    title: "Prêmios homologados",
    copy: "Nenhum prêmio ou benefício está ativo nesta prévia. ×2 e +1 são apenas conceitos visuais até existirem regras auditadas e publicadas.",
  },
] as const;

const SLOT_PREVIEW_SOUNDS = {
  spin: "/slot/sons/spin-button.mp3",
  reelStop: "/slot/sons/reel-stop.mp3",
  celebration: "/slot/sons/celebration-chime.mp3",
} as const;

export function SlotExperience() {
  const [accountState, setAccountState] = useState<AccountState>({
    status: "checking",
  });
  const [activePanel, setActivePanel] = useState<ExperiencePanel>(null);
  const [mascotMood, setMascotMood] = useState<MascotMood>("idle");
  const [previewRound, setPreviewRound] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundTimersRef = useRef<number[]>([]);
  const activeSoundsRef = useRef<Set<HTMLAudioElement>>(new Set());

  const clearPreviewSounds = useCallback(() => {
    soundTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    soundTimersRef.current = [];
    activeSoundsRef.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    activeSoundsRef.current.clear();
  }, []);

  const playPreviewSound = useCallback((src: string, volume: number) => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = volume;
    activeSoundsRef.current.add(audio);

    const release = () => activeSoundsRef.current.delete(audio);
    audio.addEventListener("ended", release, { once: true });
    audio.addEventListener("error", release, { once: true });
    void audio.play().catch(release);
  }, []);

  const schedulePreviewSounds = useCallback(
    (reducedMotion: boolean) => {
      clearPreviewSounds();
      if (!soundEnabled) return;

      playPreviewSound(SLOT_PREVIEW_SOUNDS.spin, 0.3);
      const stopTimes = reducedMotion
        ? [250]
        : [...SLOT_PREVIEW_REEL_STOP_COMPLETION_MS];
      stopTimes.forEach((delay) => {
        soundTimersRef.current.push(
          window.setTimeout(
            () => playPreviewSound(SLOT_PREVIEW_SOUNDS.reelStop, 0.32),
            delay,
          ),
        );
      });
      soundTimersRef.current.push(
        window.setTimeout(
          () => playPreviewSound(SLOT_PREVIEW_SOUNDS.celebration, 0.24),
          reducedMotion
            ? SLOT_PREVIEW_REDUCED_DURATION_MS
            : SLOT_PREVIEW_DURATION_MS,
        ),
      );
    },
    [clearPreviewSounds, playPreviewSound, soundEnabled],
  );

  useEffect(() => {
    const controller = new AbortController();
    async function loadAccount() {
      try {
        const response = await fetch("/api/account", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401) {
          setAccountState({ status: "anonymous" });
          return;
        }
        if (!response.ok) {
          setAccountState({ status: "unavailable" });
          return;
        }
        const account = (await response.json()) as AccountSnapshot;
        setAccountState({ status: "ready", account });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setAccountState({ status: "unavailable" });
      }
    }
    void loadAccount();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (activePanel === null) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePanel(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activePanel]);

  useEffect(() => {
    if (activePanel !== "machine") clearPreviewSounds();
  }, [activePanel, clearPreviewSounds]);

  useEffect(() => clearPreviewSounds, [clearPreviewSounds]);

  useEffect(() => {
    if (mascotMood === "anticipation") {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const timer = window.setTimeout(() => {
        setPreviewRound((current) => current + 1);
        setMascotMood("celebration");
      },
      reducedMotion
        ? SLOT_PREVIEW_REDUCED_DURATION_MS
        : SLOT_PREVIEW_DURATION_MS,
      );
      return () => window.clearTimeout(timer);
    }
    if (mascotMood === "celebration") {
      const timer = window.setTimeout(() => setMascotMood("idle"), 1800);
      return () => window.clearTimeout(timer);
    }
  }, [mascotMood]);

  const accountLabel = useMemo(() => {
    if (accountState.status === "checking") return "Verificando conta";
    if (accountState.status === "anonymous") return "Entre para participar no futuro";
    if (accountState.status === "unavailable") return "Conta temporariamente indisponível";
    if (accountState.account.balance === null) return "Moedas em preparação";
    return `${accountState.account.balance.toLocaleString("pt-BR")} moedas`;
  }, [accountState]);

  const openPanel = useCallback((panel: Exclude<ExperiencePanel, null>) => {
    setMascotMood("idle");
    setActivePanel(panel);
  }, []);

  const closePanel = useCallback(() => {
    clearPreviewSounds();
    setMascotMood("idle");
    setActivePanel(null);
  }, [clearPreviewSounds]);

  const startPreview = useCallback(() => {
    if (mascotMood !== "idle") return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    schedulePreviewSounds(reducedMotion);
    setMascotMood("anticipation");
  }, [mascotMood, schedulePreviewSounds]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((current) => {
      if (current) clearPreviewSounds();
      return !current;
    });
  }, [clearPreviewSounds]);

  const firstName =
    accountState.status === "ready"
      ? accountState.account.user.name.split(/\s+/)[0] || "Jogador"
      : null;

  return (
    <main className="slot-page">
      <div className="slot-page__noise" aria-hidden />
      <div className="slot-page__flare slot-page__flare--one" aria-hidden />
      <div className="slot-page__flare slot-page__flare--two" aria-hidden />

      <header className="slot-header">
        <Link href="/" className="slot-header__brand" aria-label="6DNX — voltar ao site">
          <span>6</span>
          <strong>6DNX</strong>
          <small>Experiências</small>
        </Link>
        <nav aria-label="Navegação da Slot">
          <button type="button" onClick={() => openPanel("machine")}>
            Cabine
          </button>
          <button type="button" onClick={() => openPanel("rules")}>
            Regras claras
          </button>
          <Link href="/conta">Minha conta</Link>
          <Link className="slot-header__back" href="/">
            Loja
          </Link>
          <a
            className="slot-header__support"
            href="/api/redirect"
            target="_blank"
            rel="noreferrer"
          >
            <DiscordMark className="slot-header__support-icon" />
            Suporte
          </a>
        </nav>
      </header>

      <section className="slot-hero" aria-labelledby="slot-title">
        <div className="slot-hero__copy">
          <span className="slot-kicker">A próxima experiência 6DNX</span>
          <h1 id="slot-title">
            Slot da Sorte
            <em>6DNX</em>
          </h1>
          <p>
            Uma experiência cinematográfica de fidelidade. Conheça a cabine,
            veja o mascote reagir e entenda as regras — sem gastar moedas e sem
            ativar um prêmio real nesta demonstração.
          </p>
          <div className="slot-hero__chips" aria-label="Características planejadas">
            <span>Resultado no servidor</span>
            <span>Histórico verificável</span>
            <span>Limites de uso</span>
          </div>
          <div className="slot-hero__actions">
            <button
              className="slot-primary-button"
              type="button"
              onClick={() => openPanel("machine")}
            >
              Conhecer a experiência
            </button>
            <button
              className="slot-secondary-button"
              type="button"
              onClick={() => openPanel("rules")}
            >
              Ver regras claras
            </button>
          </div>
          <p className="slot-hero__account-status">
            <span aria-hidden />
            {accountLabel}
          </p>
        </div>

        <div className="slot-hero__mascot" aria-hidden>
          <span className="slot-hero__halo" />
          <Image
            src="/slot/dragon-excited-v2.png"
            alt=""
            width={768}
            height={768}
            preload
            sizes="(max-width: 820px) 92vw, 560px"
          />
          <span className="slot-hero__mascot-label">O guardião da cabine</span>
        </div>

        <p className="slot-hero__legal">
          Prévia visual. Nenhuma moeda, giro ou recompensa real está ativa.
        </p>
      </section>

      {activePanel === "machine" ? (
        <div className="slot-overlay" role="presentation" onMouseDown={closePanel}>
          <section
            className="slot-dialog slot-dialog--machine"
            role="dialog"
            aria-modal="true"
            aria-labelledby="slot-machine-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="slot-dialog__close"
              type="button"
              onClick={closePanel}
              aria-label="Fechar cabine"
              autoFocus
            >
              ×
            </button>

            <div className="slot-dialog__heading">
              <span className="slot-kicker">Cabine visual 6DNX</span>
              <h2 id="slot-machine-title">Conheça a experiência.</h2>
              <p>
                Esta animação é determinística: não consome moedas, não escolhe
                prêmio e não chama uma rota de giro.
              </p>
            </div>

            <article className="slot-machine" data-mood={mascotMood}>
              <div className="slot-machine__topline">
                <span>PRÉVIA VISUAL</span>
                <div>
                  <strong>SEM PRÊMIO</strong>
                  <button
                    className="slot-sound-toggle"
                    type="button"
                    aria-pressed={soundEnabled}
                    onClick={toggleSound}
                  >
                    <span aria-hidden>{soundEnabled ? "♪" : "×"}</span>
                    {soundEnabled ? "Som ligado" : "Som desligado"}
                  </button>
                </div>
              </div>

              <div className="slot-machine__brand">
                <span>6</span>
                <div>
                  <strong>SLOT DA SORTE</strong>
                  <small>6DNX EXPERIENCE LAB</small>
                </div>
              </div>

              <div className="slot-machine__experience">
                <SlotPixiStage mood={mascotMood} round={previewRound} />
              </div>

              <div className="slot-machine__status">
                <span className="slot-machine__status-light" aria-hidden />
                <div>
                  <small>STATUS DA EXPERIÊNCIA</small>
                  <strong>{accountLabel}</strong>
                </div>
              </div>

              <button
                className="slot-spin-preview"
                type="button"
                onClick={startPreview}
                disabled={mascotMood !== "idle"}
              >
                <span>
                  {mascotMood === "anticipation"
                    ? "ANIMANDO"
                    : mascotMood === "celebration"
                      ? "CELEBRANDO"
                      : "VER ANIMAÇÃO"}
                </span>
                <small>prévia • sem custo • sem resultado real</small>
              </button>
              <p className="slot-machine__live-copy" aria-live="polite">
                {mascotMood === "anticipation"
                  ? "As quatro colunas desaceleram e param uma por vez."
                  : mascotMood === "celebration"
                    ? "Combinação cenográfica concluída; ×2 e +1 não têm efeito nesta prévia."
                    : "Motor visual pronto para uma nova demonstração."}
              </p>
            </article>

            <aside className="slot-dialog__account">
              <span>{firstName ? `Olá, ${firstName}` : "Seu acesso"}</span>
              <strong>{accountLabel}</strong>
              <p>
                A futura experiência real continuará bloqueada até ledger,
                idempotência, limites e auditoria estarem homologados no servidor.
              </p>
              <div>
                <Link href={accountState.status === "anonymous" ? "/#inicio" : "/conta"}>
                  {accountState.status === "anonymous" ? "Entrar na 6DNX" : "Abrir minha conta"}
                </Link>
                <button type="button" onClick={() => openPanel("rules")}>
                  Ler regras
                </button>
              </div>
            </aside>
          </section>
        </div>
      ) : null}

      {activePanel === "rules" ? (
        <div className="slot-overlay" role="presentation" onMouseDown={closePanel}>
          <section
            className="slot-dialog slot-dialog--rules"
            role="dialog"
            aria-modal="true"
            aria-labelledby="slot-rules-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="slot-dialog__close"
              type="button"
              onClick={closePanel}
              aria-label="Fechar regras"
              autoFocus
            >
              ×
            </button>
            <div className="slot-dialog__heading">
              <span className="slot-kicker">Diversão responsável</span>
              <h2 id="slot-rules-title">Regras claras, antes de jogar.</h2>
              <p>
                O visual pode ser intenso. A lógica precisa ser limitada,
                explicável e auditável.
              </p>
            </div>
            <div className="slot-rules-grid">
              {RULES.map((rule, index) => (
                <article key={rule.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{rule.title}</h3>
                  <p>{rule.copy}</p>
                </article>
              ))}
            </div>
            <div className="slot-rules-footer">
              <p>
                Status atual: <strong>{accountLabel}</strong>
              </p>
              <button
                className="slot-primary-button"
                type="button"
                onClick={() => openPanel("machine")}
              >
                Abrir a cabine
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
