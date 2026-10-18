export type SolutionGuide = {
  title: string;
  introduction: string;
  youtubeId: string | null;
  steps: string[];
  questions: Array<{ question: string; answer: string }>;
};

export const EMPTY_GUIDE: SolutionGuide = {
  title: "",
  introduction: "",
  youtubeId: null,
  steps: [],
  questions: [],
};

export type GuideRecord = {
  draft: SolutionGuide;
  published: SolutionGuide | null;
  revision: number;
  publishedAt: string | null;
  state: "ready" | "schema-missing" | "unavailable";
};

export type GuideMutation = {
  action: "save" | "publish" | "unpublish";
  expectedRevision: number;
  guide: SolutionGuide;
};

export type GuideSummary = {
  productSourceKey: string;
  revision: number;
  publishedAt: string | null;
};
