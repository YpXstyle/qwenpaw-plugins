/** Display/answer shapes from AgentScope 2.0.10 AskUserParams/AskUserMetadata. */
export interface QuestionOption {
  label: string;
  description: string;
  preview?: string | null;
}

export interface Question {
  question: string;
  header: string;
  context?: string | null;
  options: QuestionOption[];
  multi_select?: boolean;
}

export interface AnswerDraft {
  selected: string[];
  other: string;
}

export interface Answer {
  question: string;
  selected: string[];
  other: string | null;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Defensive rendering only; the backend validates the framework schema. */
export function readQuestions(value: unknown): Question[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 4)
    return null;
  const names = new Set<string>();
  for (const item of value) {
    if (
      !record(item) ||
      typeof item.question !== "string" ||
      typeof item.header !== "string" ||
      names.has(item.question) ||
      !Array.isArray(item.options) ||
      item.options.length < 2 ||
      item.options.length > 4 ||
      (item.context != null && typeof item.context !== "string") ||
      (item.multi_select != null && typeof item.multi_select !== "boolean")
    )
      return null;
    names.add(item.question);
    const labels = new Set<string>();
    for (const option of item.options) {
      if (
        !record(option) ||
        typeof option.label !== "string" ||
        typeof option.description !== "string" ||
        labels.has(option.label) ||
        (option.preview != null && typeof option.preview !== "string")
      )
        return null;
      labels.add(option.label);
    }
  }
  return value as Question[];
}

export function hasAnswer(draft: AnswerDraft | undefined): boolean {
  return (
    !!draft && (draft.selected.length > 0 || draft.other.trim().length > 0)
  );
}

export function buildAnswers(
  questions: Question[],
  drafts: AnswerDraft[],
): Answer[] {
  return questions.map((question, index) => ({
    question: question.question,
    selected: [...(drafts[index]?.selected ?? [])],
    other: drafts[index]?.other.trim() || null,
  }));
}

export function optionDisplay(label: string): {
  label: string;
  recommended: boolean;
} {
  const displayLabel = label.trimEnd();
  const marker = /(?:\((?:Recommended|推荐)\)|（(?:Recommended|推荐)）)$/i.exec(
    displayLabel,
  );
  return marker
    ? {
        label: displayLabel.slice(0, marker.index).trimEnd(),
        recommended: true,
      }
    : { label: displayLabel, recommended: false };
}

/** Presentation order only: retain original option objects and answer labels. */
export function displayOptions(
  options: readonly QuestionOption[],
): QuestionOption[] {
  const recommended: QuestionOption[] = [];
  const remaining: QuestionOption[] = [];
  for (const option of options)
    (optionDisplay(option.label).recommended ? recommended : remaining).push(
      option,
    );
  return [...recommended, ...remaining];
}
