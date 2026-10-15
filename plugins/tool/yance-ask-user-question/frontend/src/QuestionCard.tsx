import type * as ReactNS from "react";
import pluginManifest from "../../plugin.json";
import { author as npmAuthor } from "../package.json";
import { sendDecision, SubmissionError } from "./api";
import { resolveLocale, translate, type MessageKey } from "./locale";
import {
  buildAnswers,
  displayOptions,
  hasAnswer,
  optionDisplay,
  readQuestions,
  type AnswerDraft,
} from "./questions";
import type { ChatApprovalRendererProps } from "./qwenpaw-host";
import { CARD_STYLES } from "./styles";
import { QuestionViewport } from "./QuestionViewport";

const React: typeof ReactNS = window.QwenPaw.host.React;

/** The host positions this renderer; its body bounds scrolling and actions. */
export function QuestionCard(props: ChatApprovalRendererProps) {
  return (
    <QuestionViewport>
      <QuestionForm key={props.approval.requestId} {...props} />
    </QuestionViewport>
  );
}

function QuestionForm({ approval, onResolved }: ChatApprovalRendererProps) {
  const host = window.QwenPaw.host;
  const { Card, Button, Input, Tag, theme } = host.antd;
  const {
    InfoCircleOutlined,
    ClockCircleOutlined,
    CloseOutlined,
    CheckOutlined,
    LeftOutlined,
    RightOutlined,
    StarFilled,
  } = host.antdIcons;
  const { token } = theme.useToken();
  const locale = host.useLocale();
  const t = (key: MessageKey, values?: Record<string, string | number>) =>
    translate(locale, key, values);
  const questions = React.useMemo(
    () => readQuestions(approval.toolParams.questions),
    [approval.toolParams],
  );
  const [drafts, setDrafts] = React.useState<AnswerDraft[]>(() =>
    (questions ?? []).map(() => ({ selected: [], other: "" })),
  );
  const [page, setPage] = React.useState(0);
  const [loading, setLoading] = React.useState<"answer" | "deny" | null>(null);
  const [error, setError] = React.useState<MessageKey | null>(null);
  const remainingTime = () =>
    Math.max(
      0,
      Math.floor(
        approval.createdAt + approval.timeoutSeconds - Date.now() / 1000,
      ),
    );
  const [remaining, setRemaining] = React.useState(remainingTime);
  const expired = !Number.isFinite(remaining) || remaining <= 0;
  const disabled = loading !== null || expired;
  const submitting = React.useRef(false);
  const mounted = React.useRef(true);
  const content = React.useRef<HTMLDivElement>(null);
  const heading = React.useRef<HTMLSpanElement>(null);
  const previousPage = React.useRef(page);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    const update = () => setRemaining(remainingTime());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [approval.createdAt, approval.timeoutSeconds]);

  React.useEffect(() => {
    if (previousPage.current !== page) {
      if (content.current) content.current.scrollTop = 0;
      heading.current?.focus({ preventScroll: true });
    }
    previousPage.current = page;
  }, [page]);

  const question = questions?.[page];
  const draft = drafts[page] ?? { selected: [], other: "" };
  const complete =
    !!questions && questions.every((_, index) => hasAnswer(drafts[index]));
  const last = !questions || page === questions.length - 1;
  const preview = question?.multi_select
    ? undefined
    : question?.options.find((option) => draft.selected.includes(option.label))
        ?.preview;
  const description =
    pluginManifest.description_i18n[
      resolveLocale(locale) as keyof typeof pluginManifest.description_i18n
    ] || pluginManifest.description;
  const severity = approval.severity.toLowerCase();
  const severityColor =
    severity === "critical" || severity === "high"
      ? "error"
      : severity === "medium"
      ? "warning"
      : "default";
  const fallbackTokens = {
    "--yance-auq-surface-raised": token.colorBgElevated,
    "--yance-auq-surface": token.colorBgContainer,
    "--yance-auq-border": token.colorBorder,
    "--yance-auq-border-subtle": token.colorBorderSecondary,
    "--yance-auq-fill": token.colorFillQuaternary,
    "--yance-auq-text": token.colorText,
    "--yance-auq-text-secondary": token.colorTextSecondary,
    "--yance-auq-text-tertiary": token.colorTextTertiary,
    "--yance-auq-text-inverse": token.colorTextLightSolid,
    "--yance-auq-accent": token.colorPrimary,
    "--yance-auq-accent-active": token.colorPrimaryActive,
    "--yance-auq-error": token.colorErrorText,
    "--yance-auq-error-bg": token.colorErrorBg,
    "--yance-auq-success-border": token.colorSuccessBorder,
    "--yance-auq-success-bg": token.colorSuccessBg,
    "--yance-auq-success": token.colorSuccess,
    "--yance-auq-shadow": token.boxShadowTertiary ?? token.boxShadowSecondary,
    "--yance-auq-shadow-hover": token.boxShadowSecondary,
  } as ReactNS.CSSProperties;

  function updateDraft(update: (previous: AnswerDraft) => AnswerDraft) {
    if (disabled) return;
    setDrafts((previous) => {
      const next = [...previous];
      next[page] = update(previous[page] ?? { selected: [], other: "" });
      return next;
    });
  }

  function toggle(label: string) {
    updateDraft((previous) => ({
      selected: previous.selected.includes(label)
        ? previous.selected.filter((item) => item !== label)
        : question?.multi_select
        ? [...previous.selected, label]
        : [label],
      other: "",
    }));
  }

  async function submit(decision: "answer" | "deny") {
    if (
      disabled ||
      submitting.current ||
      (decision === "answer" && (!last || !complete))
    )
      return;
    submitting.current = true;
    setLoading(decision);
    setError(null);
    try {
      await sendDecision(
        approval,
        decision,
        decision === "answer" && questions
          ? buildAnswers(questions, drafts)
          : [],
      );
      if (mounted.current) onResolved();
    } catch (cause) {
      let message: MessageKey = "submitError";
      if (cause instanceof SubmissionError) {
        if (cause.status === 401 || cause.status === 403) message = "authError";
        else if (cause.status === 404 || cause.status === 409)
          message = "staleError";
        else if (cause.status === 422) message = "invalidAnswer";
      }
      if (mounted.current) setError(message);
    } finally {
      submitting.current = false;
      if (mounted.current) setLoading(null);
    }
  }

  return (
    <Card
      className="yance-auq-card"
      classNames={{ body: "yance-auq-body" }}
      bordered={false}
      role="dialog"
      aria-label={t("title")}
      aria-busy={loading !== null}
      style={fallbackTokens}
    >
      <style data-yance-ask-user-question-styles>{CARD_STYLES}</style>
      <header className="yance-auq-header">
        <div className="yance-auq-title-row">
          <InfoCircleOutlined className="yance-auq-icon" aria-hidden="true" />
          <span className="yance-auq-title">{t("title")}</span>
          {questions && questions.length > 1 ? (
            <span className="yance-auq-progress" aria-live="polite">
              {t("progress", { current: page + 1, total: questions.length })}
            </span>
          ) : null}
        </div>
        <div
          className="yance-auq-timer"
          aria-label={t("remaining", { seconds: remaining })}
        >
          <ClockCircleOutlined
            className="yance-auq-timer-icon"
            aria-hidden="true"
          />
          <span>
            {Math.floor(remaining / 60)}:
            {String(remaining % 60).padStart(2, "0")}
          </span>
        </div>
      </header>
      <div className="yance-auq-content" ref={content}>
        {question ? (
          <div className="yance-auq-question">
            <div className="yance-auq-question-head">
              {question.header ? (
                <Tag className="yance-auq-header-tag">{question.header}</Tag>
              ) : null}
              <span
                className="yance-auq-question-title"
                ref={heading}
                role="heading"
                aria-level={3}
                tabIndex={-1}
              >
                {question.question}
              </span>
            </div>
            {question.context ? (
              <pre className="yance-auq-panel">{question.context}</pre>
            ) : null}
            <div className="yance-auq-options">
              {displayOptions(question.options).map((option) => {
                const display = optionDisplay(option.label);
                return (
                  <Button
                    key={option.label}
                    size="small"
                    block
                    className={
                      display.recommended
                        ? "yance-auq-option yance-auq-option-recommended"
                        : "yance-auq-option"
                    }
                    type={
                      draft.selected.includes(option.label)
                        ? "primary"
                        : "default"
                    }
                    aria-pressed={draft.selected.includes(option.label)}
                    aria-label={[
                      display.label,
                      display.recommended ? t("recommended") : "",
                      option.description,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={disabled}
                    onClick={() => toggle(option.label)}
                  >
                    <span className="yance-auq-option-label">
                      {display.label}
                      {display.recommended ? (
                        <Tag
                          color="success"
                          className="yance-auq-recommended"
                          icon={
                            <StarFilled
                              className="yance-auq-recommended-icon"
                              aria-hidden="true"
                            />
                          }
                        >
                          {t("recommended")}
                        </Tag>
                      ) : null}
                    </span>
                    {option.description ? (
                      <span className="yance-auq-option-description">
                        {option.description}
                      </span>
                    ) : null}
                  </Button>
                );
              })}
            </div>
            {preview ? (
              <pre className="yance-auq-panel" aria-label={t("preview")}>
                {preview}
              </pre>
            ) : null}
            <Input
              size="small"
              className="yance-auq-other"
              aria-label={t("other")}
              value={draft.other}
              disabled={disabled}
              placeholder={t("other")}
              onChange={(event: ReactNS.ChangeEvent<HTMLInputElement>) => {
                const value = event.target.value;
                updateDraft(() => ({ selected: [], other: value }));
              }}
            />
          </div>
        ) : (
          <p className="yance-auq-error" role="alert">
            {t("invalid")}
          </p>
        )}
        <div className="yance-auq-info-row">
          <span className="yance-auq-label">{t("agent")}:</span>
          <Tag color="success" className="yance-auq-value">
            {approval.agentId}
          </Tag>
        </div>
        <div className="yance-auq-info-row">
          <span className="yance-auq-label">{t("tool")}:</span>
          <code className="yance-auq-code yance-auq-value">
            {approval.toolName}
          </code>
        </div>
        <div className="yance-auq-info-row">
          <span className="yance-auq-label">{t("source")}:</span>
          <span className="yance-auq-value">
            {t("pluginSource")}{" "}
            <code className="yance-auq-code">{approval.sourceType}</code>
          </span>
        </div>
        <div className="yance-auq-info-row">
          <span className="yance-auq-label">{t("severity")}:</span>
          <Tag color={severityColor}>{approval.severity.toUpperCase()}</Tag>
        </div>
        <div className="yance-auq-info-row">
          <span className="yance-auq-label">{t("findings")}:</span>
          <span className="yance-auq-value">{approval.findingsCount}</span>
        </div>
        <details className="yance-auq-details">
          <summary>{t("parameters")}</summary>
          <pre className="yance-auq-panel">
            {JSON.stringify(approval.toolParams, null, 2)}
          </pre>
        </details>
        <details className="yance-auq-details">
          <summary>{t("details")}</summary>
          {approval.findingsSummary ? (
            <pre className="yance-auq-panel">{approval.findingsSummary}</pre>
          ) : null}
          <p className="yance-auq-details-text">
            <strong>{pluginManifest.name}</strong>
            <br />
            {description}
          </p>
          <div className="yance-auq-info-row">
            <span className="yance-auq-label">{t("version")}:</span>
            <span className="yance-auq-value">{pluginManifest.version}</span>
          </div>
          <div className="yance-auq-info-row">
            <span className="yance-auq-label">{t("author")}:</span>
            <span className="yance-auq-value">{pluginManifest.author}</span>
          </div>
          <div className="yance-auq-info-row">
            <span className="yance-auq-label">{t("contact")}:</span>
            <a href={"mailto:" + npmAuthor.email}>{npmAuthor.email}</a>
          </div>
        </details>
        {error ? (
          <p className="yance-auq-error" role="alert">
            {t(error)}
          </p>
        ) : null}
      </div>
      <footer className="yance-auq-actions">
        {expired ? (
          <span className="yance-auq-error" role="alert">
            {t("timedOut")}
          </span>
        ) : (
          <>
            <Button
              danger
              className="yance-auq-deny"
              disabled={disabled}
              loading={loading === "deny"}
              icon={<CloseOutlined />}
              onClick={() => void submit("deny")}
            >
              {t("deny")}
            </Button>
            <div className="yance-auq-navigation">
              {questions && questions.length > 1 ? (
                <Button
                  disabled={disabled || page === 0}
                  icon={<LeftOutlined />}
                  onClick={() => setPage((current) => current - 1)}
                >
                  {t("previous")}
                </Button>
              ) : null}
              {!last ? (
                <Button
                  type="primary"
                  disabled={disabled || !hasAnswer(draft)}
                  icon={<RightOutlined />}
                  onClick={() => setPage((current) => current + 1)}
                >
                  {t("next")}
                </Button>
              ) : (
                <Button
                  type="primary"
                  className="yance-auq-submit"
                  disabled={disabled || !complete}
                  loading={loading === "answer"}
                  icon={<CheckOutlined />}
                  onClick={() => void submit("answer")}
                >
                  {t("submit")}
                </Button>
              )}
            </div>
          </>
        )}
      </footer>
    </Card>
  );
}
