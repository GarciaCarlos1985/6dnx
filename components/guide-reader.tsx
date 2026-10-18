import { youtubeNoCookieEmbedUrl, youtubeWatchUrl } from "@/lib/media/youtube";
import type { SolutionGuide } from "@/lib/guides/types";

export function GuideReader({ guide }: { guide: SolutionGuide }) {
  const video = youtubeNoCookieEmbedUrl(guide.youtubeId);
  return (
    <div className="guide-reader">
      <nav className="guide-toc" aria-label="Conteúdo do guia">
        <strong>Neste guia</strong>
        {video ? <a href="#video-guia">Vídeo de orientação</a> : null}
        <a href="#passos-guia">Passo a passo</a>
        {guide.questions.length ? (
          <a href="#duvidas-guia">Dúvidas frequentes</a>
        ) : null}
        <a href="/api/redirect" target="_blank" rel="noreferrer">
          Falar com o suporte
        </a>
      </nav>
      <div className="solution-prose">
        {guide.introduction ? (
          <p className="guide-introduction">{guide.introduction}</p>
        ) : null}
        {video ? (
          <section id="video-guia">
            <h2>Vídeo de orientação</h2>
            <iframe
              className="solution-video"
              src={video}
              title={`Orientação: ${guide.title}`}
              loading="lazy"
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <a
              href={youtubeWatchUrl(guide.youtubeId) ?? undefined}
              target="_blank"
              rel="noreferrer"
            >
              Abrir no YouTube
            </a>
            <p className="guide-media-note">
              O vídeo é hospedado no YouTube. O acesso ao guia é verificado pela
              6DNX; o vídeo segue as configurações do provedor.
            </p>
          </section>
        ) : null}
        <section id="passos-guia">
          <h2>Passo a passo</h2>
          <ol className="guide-steps">
            {guide.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </section>
        {guide.questions.length ? (
          <section id="duvidas-guia">
            <h2>Dúvidas frequentes</h2>
            {guide.questions.map((item, index) => (
              <details className="guide-question" key={index}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </section>
        ) : null}
        <div className="guide-support">
          <h2>Precisa de ajuda em uma etapa?</h2>
          <p>
            Informe ao suporte o produto, o plano e a etapa em que você parou.
          </p>
          <a
            className="solution-secondary"
            href="/api/redirect"
            target="_blank"
            rel="noreferrer"
          >
            Abrir suporte no Discord
          </a>
        </div>
      </div>
    </div>
  );
}
