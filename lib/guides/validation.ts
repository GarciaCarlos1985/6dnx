import { normalizeYouTubeVideoId } from "../media/youtube.ts";
import type { GuideMutation, SolutionGuide } from "./types.ts";

const CONTROL_OR_HTML =
  /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/;

export function parseGuide(
  value: unknown,
): { ok: true; value: SolutionGuide } | { ok: false; errors: string[] } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, errors: ["Guia inválido."] };
  }
  const input = value as Record<string, unknown>;
  const errors: string[] = [];
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 128 * 1024) {
    return {
      ok: false,
      errors: [
        "O guia deve ter no máximo 128 KB. Reduza o texto antes de salvar.",
      ],
    };
  }
  if (
    Object.keys(input).some(
      (key) =>
        !["title", "introduction", "youtubeId", "steps", "questions"].includes(
          key,
        ),
    )
  ) {
    errors.push("O guia contém campos desconhecidos.");
  }
  function text(raw: unknown, label: string, limit: number) {
    if (
      typeof raw !== "string" ||
      raw.length > limit ||
      CONTROL_OR_HTML.test(raw)
    ) {
      errors.push(`${label}: use texto simples de até ${limit} caracteres.`);
      return "";
    }
    return raw.trim();
  }
  const title = text(input.title, "Título", 120);
  const introduction = text(input.introduction, "Introdução", 2000);
  const rawVideo = input.youtubeId;
  const youtubeId =
    rawVideo === null || rawVideo === ""
      ? null
      : normalizeYouTubeVideoId(rawVideo);
  if (rawVideo && !youtubeId)
    errors.push("Use um link HTTPS do YouTube ou ID válido.");
  if (!Array.isArray(input.steps) || input.steps.length > 80)
    errors.push("Use até 80 passos.");
  const steps = (Array.isArray(input.steps) ? input.steps.slice(0, 80) : [])
    .map((step, index) => text(step, `Passo ${index + 1}`, 1000))
    .filter(Boolean);
  if (!Array.isArray(input.questions) || input.questions.length > 15)
    errors.push("Use até 15 perguntas frequentes.");
  const questions = (
    Array.isArray(input.questions) ? input.questions.slice(0, 15) : []
  ).map((entry, index) => {
    const item =
      entry && typeof entry === "object" && !Array.isArray(entry)
        ? (entry as Record<string, unknown>)
        : {};
    const question = text(item.question, `Pergunta ${index + 1}`, 160);
    const answer = text(item.answer, `Resposta ${index + 1}`, 2000);
    if (!question || !answer)
      errors.push("Preencha a pergunta e a resposta ou remova o item.");
    return { question, answer };
  });
  return errors.length
    ? { ok: false, errors }
    : { ok: true, value: { title, introduction, youtubeId, steps, questions } };
}

export function guidePublishErrors(guide: SolutionGuide) {
  return [
    ...(!guide.title ? ["Dê um título ao guia."] : []),
    ...(!guide.steps.length
      ? ["Inclua ao menos um passo antes de publicar."]
      : []),
  ];
}

export function parseGuideMutation(
  value: unknown,
): { ok: true; value: GuideMutation } | { ok: false; errors: string[] } {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return { ok: false, errors: ["Alteração inválida."] };
  const input = value as Record<string, unknown>;
  if (
    !["save", "publish", "unpublish"].includes(String(input.action)) ||
    !Number.isSafeInteger(input.expectedRevision) ||
    Number(input.expectedRevision) < 0 ||
    Object.keys(input).some(
      (key) => !["action", "expectedRevision", "guide"].includes(key),
    )
  ) {
    return { ok: false, errors: ["Ação ou revisão do guia inválida."] };
  }
  const parsed = parseGuide(input.guide);
  if (!parsed.ok) return parsed;
  const errors =
    input.action === "publish" ? guidePublishErrors(parsed.value) : [];
  return errors.length
    ? { ok: false, errors }
    : {
        ok: true,
        value: {
          action: input.action as GuideMutation["action"],
          expectedRevision: Number(input.expectedRevision),
          guide: parsed.value,
        },
      };
}
