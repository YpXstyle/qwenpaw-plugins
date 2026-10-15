import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "../src/QuestionCard";
import { messages, resolveLocale } from "../src/locale";
import manifest from "../../plugin.json";
import { testTokens } from "./setup";
import type { Question } from "../src/questions";
import type { ChatApprovalData } from "../src/qwenpaw-host";

const first: Question = {
  question: "Which storage should we use?",
  header: "Storage",
  context: "Review the storage proposal\nfor this deployment.",
  options: [
    {
      label: "SQLite (Recommended)",
      description: "Keeps setup simple",
      preview: "A single local database file",
    },
    {
      label: "PostgreSQL",
      description: "Supports multiple writers",
      preview: "A dedicated database server",
    },
  ],
  multi_select: false,
};

const second: Question = {
  question: "Which features do you need?",
  header: "Features",
  options: [
    { label: "Search", description: "Find entries" },
    { label: "Export", description: "Download entries" },
  ],
  multi_select: true,
};

function pending(questions: Question[] = [first]): ChatApprovalData {
  return {
    requestId: "request-1",
    sessionId: "child-session",
    rootSessionId: "root-session",
    agentId: "pending-agent",
    toolName: "yance_ask_user_question",
    severity: "info",
    findingsCount: 0,
    findingsSummary: "Questions",
    toolParams: { questions },
    createdAt: Date.now() / 1000,
    timeoutSeconds: 600,
    sourceType: "yance_ask_user_question",
  };
}

function renderQuestion(
  questions: Question[] = [first],
  approval = pending(questions),
) {
  const onResolved = vi.fn();
  return {
    ...render(<QuestionCard approval={approval} onResolved={onResolved} />),
    onResolved,
    approval,
  };
}

function sentBody() {
  return JSON.parse(
    String(vi.mocked(window.QwenPaw.host.fetch).mock.calls[0][1]?.body),
  );
}

// JSDOM does not resolve CSS custom-property colors. Check the real rendered
// stylesheet's selector behavior here; actual colors are a browser acceptance.
function recommendationAppearance(element: Element): Record<string, string> {
  const sheet = document.querySelector<HTMLStyleElement>(
    "style[data-yance-ask-user-question-styles]",
  )!.sheet!;
  const result: Record<string, string> = {};
  for (const entry of sheet.cssRules) {
    if (!("selectorText" in entry)) continue;
    const rule = entry as CSSStyleRule;
    if (!element.matches(rule.selectorText)) continue;
    for (const property of ["background-color", "border-color"]) {
      const value = rule.style.getPropertyValue(property);
      if (value) result[property] = value;
    }
  }
  return result;
}

describe("question wizard", () => {
  it.each([
    ["SQLite", "SQLite (Recommended)"],
    ["PostgreSQL", "PostgreSQL"],
  ])(
    "shows recommendation without preselection and submits the original %s label",
    async (display, original) => {
      const user = userEvent.setup();
      const { onResolved } = renderQuestion();
      expect(screen.getByText("Recommended")).toBeVisible();
      const star = screen.getByText("Recommended").querySelector("svg");
      expect(star).not.toBeNull();
      expect(star?.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(screen.getByText("Keeps setup simple")).toBeVisible();
      expect(
        screen.queryByText("SQLite (Recommended)"),
      ).not.toBeInTheDocument();
      const options = screen.getAllByRole("button", { pressed: false });
      expect(options.map((button) => button.textContent)).toEqual([
        "SQLiteRecommendedKeeps setup simple",
        "PostgreSQLSupports multiple writers",
      ]);
      expect(
        screen.queryByRole("button", { pressed: true }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Submit answer" }),
      ).toBeDisabled();
      expect(
        screen.queryByRole("button", { name: "Next question" }),
      ).not.toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: new RegExp(display) }),
      );
      await user.click(screen.getByRole("button", { name: "Submit answer" }));
      await waitFor(() => expect(onResolved).toHaveBeenCalledOnce());
      expect(sentBody().answers).toEqual([
        { question: first.question, selected: [original], other: null },
      ]);
    },
  );

  it("does not infer a badge from order, a custom flag, or a nonterminal suffix", () => {
    const options = [
      { label: "First", description: "First option", recommended: true },
      { label: "Second (Recommended) later", description: "A literal label" },
    ];
    renderQuestion([{ ...first, options }]);
    expect(screen.queryByText("Recommended")).not.toBeInTheDocument();
    expect(document.querySelector(".yance-auq-recommended-icon")).toBeNull();
    expect(
      screen.getByRole("button", { name: "First First option" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Second (Recommended) later")).toBeVisible();
  });

  it("preserves choices and free text while navigating, then submits the entire batch once", async () => {
    const user = userEvent.setup();
    const { onResolved } = renderQuestion([first, second]);
    const next = screen.getByRole("button", { name: "Next question" });
    expect(next).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Submit answer" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /SQLite/ }));
    await user.type(screen.getByRole("textbox"), "Keep it local");
    await user.click(next);
    expect(screen.getByText("2 / 2")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: second.question }),
    ).toHaveFocus();
    expect(screen.queryByText(first.question)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit answer" }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Search Find entries" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Export Download entries" }),
    );
    await user.click(screen.getByRole("button", { name: "Previous question" }));
    expect(screen.getByRole("button", { name: /SQLite/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("textbox")).toHaveValue("Keep it local");
    expect(window.QwenPaw.host.fetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Next question" }));
    expect(
      screen.getByRole("button", { name: "Search Find entries" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Export Download entries" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("textbox")).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Submit answer" }));
    await waitFor(() => expect(onResolved).toHaveBeenCalledOnce());
    expect(sentBody().answers).toEqual([
      {
        question: first.question,
        selected: [],
        other: "Keep it local",
      },
      {
        question: second.question,
        selected: ["Search", "Export"],
        other: null,
      },
    ]);
  });

  it("requires an answer on every page of a four-question batch and supports free text alone", async () => {
    const user = userEvent.setup();
    const questions = Array.from({ length: 4 }, (_, index) => ({
      ...first,
      question: `Question ${index + 1}?`,
    }));
    renderQuestion(questions);
    for (let index = 0; index < 4; index++) {
      expect(screen.getByText(`${index + 1} / 4`)).toBeVisible();
      const action = screen.getByRole("button", {
        name: index === 3 ? "Submit answer" : "Next question",
      });
      expect(action).toBeDisabled();
      await user.type(screen.getByRole("textbox"), `Custom ${index + 1}`);
      await user.click(action);
    }
    await waitFor(() =>
      expect(window.QwenPaw.host.fetch).toHaveBeenCalledOnce(),
    );
    expect(sentBody().answers).toEqual(
      questions.map((question, index) => ({
        question: question.question,
        selected: [],
        other: `Custom ${index + 1}`,
      })),
    );
  });

  it("retains only one single-select option, permits deselection, and ignores whitespace-only Other", async () => {
    const user = userEvent.setup();
    renderQuestion();
    await user.type(screen.getByRole("textbox"), "   ");
    expect(
      screen.getByRole("button", { name: "Submit answer" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /SQLite/ }));
    await user.click(screen.getByRole("button", { name: /PostgreSQL/ }));
    expect(screen.getByRole("button", { name: /SQLite/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await user.click(screen.getByRole("button", { name: /PostgreSQL/ }));
    expect(
      screen.getByRole("button", { name: "Submit answer" }),
    ).toBeDisabled();
  });

  it.each(["custom", "option"])(
    "replaces the previous single-select answer with %s",
    async (choice) => {
      const user = userEvent.setup();
      const { onResolved } = renderQuestion();
      if (choice === "custom") {
        await user.click(screen.getByRole("button", { name: /SQLite/ }));
        await user.type(screen.getByRole("textbox"), "A custom strategy");
        expect(
          screen.queryByRole("button", { pressed: true }),
        ).not.toBeInTheDocument();
      } else {
        await user.type(screen.getByRole("textbox"), "A custom strategy");
        await user.click(screen.getByRole("button", { name: /PostgreSQL/ }));
        expect(screen.getByRole("textbox")).toHaveValue("");
      }
      await user.click(screen.getByRole("button", { name: "Submit answer" }));
      await waitFor(() => expect(onResolved).toHaveBeenCalledOnce());
      expect(sentBody().answers).toEqual([
        {
          question: first.question,
          selected: choice === "custom" ? [] : ["PostgreSQL"],
          other: choice === "custom" ? "A custom strategy" : null,
        },
      ]);
    },
  );

  it("shows literal context and preview only after selection, not focus or hover", async () => {
    const user = userEvent.setup();
    renderQuestion([{ ...first, context: "<script>not executable</script>" }]);
    expect(screen.getByText("<script>not executable</script>")).toBeVisible();
    fireEvent.focus(screen.getByRole("button", { name: /PostgreSQL/ }));
    fireEvent.mouseEnter(screen.getByRole("button", { name: /PostgreSQL/ }));
    expect(screen.queryByLabelText("Option preview")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit answer" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /PostgreSQL/ }));
    expect(screen.getByLabelText("Option preview")).toHaveTextContent(
      "A dedicated database server",
    );
    expect(screen.getByRole("button", { name: "Submit answer" })).toBeEnabled();
  });

  it("does not steal focus at mount, restores page focus/scroll, and resets a replaced request", async () => {
    const user = userEvent.setup();
    const result = renderQuestion([first, second]);
    expect(
      screen.getByRole("heading", { name: first.question }),
    ).not.toHaveFocus();
    await user.click(screen.getByRole("button", { name: /SQLite/ }));
    const pane = screen
      .getByRole("heading", { name: first.question })
      .closest<HTMLDivElement>(".yance-auq-content")!;
    pane.scrollTop = 300;
    await user.click(screen.getByRole("button", { name: "Next question" }));
    expect(pane.scrollTop).toBe(0);
    expect(
      screen.getByRole("heading", { name: second.question }),
    ).toHaveFocus();
    result.rerender(
      <QuestionCard
        approval={{ ...pending(), requestId: "replacement" }}
        onResolved={result.onResolved}
      />,
    );
    expect(
      screen.queryByRole("button", { pressed: true }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "Submit answer" }),
    ).toBeDisabled();
  });

  it("submits the pending agent/root identity even when the host selection changes", async () => {
    const user = userEvent.setup();
    const { onResolved } = renderQuestion();
    vi.mocked(window.QwenPaw.host.getSelectedAgentId).mockReturnValue(
      "another-agent",
    );
    vi.mocked(window.QwenPaw.host.getCurrentSessionId).mockReturnValue(
      "another-session",
    );
    await user.click(screen.getByRole("button", { name: /SQLite/ }));
    await user.click(screen.getByRole("button", { name: "Submit answer" }));
    await waitFor(() => expect(onResolved).toHaveBeenCalledOnce());
    expect(window.QwenPaw.host.fetch).toHaveBeenCalledWith(
      "/yance-ask-user-question/answer",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Id": "pending-agent",
        },
      }),
    );
    expect(sentBody()).toMatchObject({
      request_id: "request-1",
      session_id: "root-session",
      decision: "answer",
    });
    expect(window.QwenPaw.host.getSelectedAgentId).not.toHaveBeenCalled();
  });

  it.each([401, 403, 409, 422, 500])(
    "keeps the answer and card after HTTP %s instead of reporting resolution",
    async (status) => {
      const user = userEvent.setup();
      vi.mocked(window.QwenPaw.host.fetch).mockResolvedValue(
        new Response("{}", { status }),
      );
      const { onResolved } = renderQuestion();
      await user.click(screen.getByRole("button", { name: /SQLite/ }));
      await user.type(screen.getByRole("textbox"), "Please preserve this");
      await user.click(screen.getByRole("button", { name: "Submit answer" }));
      expect(await screen.findByRole("alert")).toBeVisible();
      expect(onResolved).not.toHaveBeenCalled();
      expect(screen.getByRole("textbox")).toHaveValue("Please preserve this");
      expect(screen.getByRole("button", { name: /SQLite/ })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      expect(
        screen.getByRole("button", { name: "Submit answer" }),
      ).toBeEnabled();
      if (status === 401 || status === 403)
        expect(screen.getByRole("alert")).toHaveTextContent("not allowed");
    },
  );

  it.each(["network", "unresolved", "invalid-json"])(
    "does not dismiss on a %s response",
    async (kind) => {
      const user = userEvent.setup();
      if (kind === "network")
        vi.mocked(window.QwenPaw.host.fetch).mockRejectedValue(
          new TypeError("offline"),
        );
      else
        vi.mocked(window.QwenPaw.host.fetch).mockResolvedValue(
          new Response(
            kind === "unresolved" ? '{"resolved":false}' : "not json",
            { status: 200 },
          ),
        );
      const { onResolved } = renderQuestion();
      await user.click(screen.getByRole("button", { name: /SQLite/ }));
      await user.click(screen.getByRole("button", { name: "Submit answer" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Could not submit",
      );
      expect(onResolved).not.toHaveBeenCalled();
    },
  );

  it("disables every editable control during the submission snapshot", async () => {
    const user = userEvent.setup();
    let resolve!: (response: Response) => void;
    vi.mocked(window.QwenPaw.host.fetch).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const { onResolved } = renderQuestion([first, second]);
    await user.click(screen.getByRole("button", { name: /SQLite/ }));
    await user.click(screen.getByRole("button", { name: "Next question" }));
    await user.click(
      screen.getByRole("button", { name: "Search Find entries" }),
    );
    await user.click(screen.getByRole("button", { name: "Submit answer" }));
    for (const button of screen.getAllByRole("button"))
      expect(button).toBeDisabled();
    expect(screen.getByRole("textbox")).toBeDisabled();
    await act(async () =>
      resolve(new Response('{"resolved":true}', { status: 200 })),
    );
    expect(onResolved).toHaveBeenCalledOnce();
    expect(window.QwenPaw.host.fetch).toHaveBeenCalledOnce();
  });

  it("allows refusing without any answer and falls back to the pending session identity", async () => {
    const user = userEvent.setup();
    const { onResolved } = renderQuestion([first], {
      ...pending(),
      rootSessionId: undefined,
    });
    await user.click(screen.getByRole("button", { name: "Deny" }));
    await waitFor(() => expect(onResolved).toHaveBeenCalledOnce());
    expect(sentBody()).toEqual({
      request_id: "request-1",
      session_id: "child-session",
      decision: "deny",
      answers: [],
    });
  });

  it("disables expired questions and advances to expiry without making a request", () => {
    vi.useFakeTimers();
    renderQuestion([first], { ...pending(), timeoutSeconds: 1 });
    act(() => vi.advanceTimersByTime(1001));
    expect(screen.getByRole("alert")).toHaveTextContent("expired");
    for (const button of screen.getAllByRole("button"))
      expect(button).toBeDisabled();
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(window.QwenPaw.host.fetch).not.toHaveBeenCalled();
  });

  it("does not throw on invalid data or allow an answer to it", () => {
    const approval = {
      ...pending(),
      toolParams: { questions: [{ question: "Broken" }] },
    };
    renderQuestion([], approval);
    expect(screen.getByRole("alert")).toHaveTextContent("cannot be displayed");
    expect(
      screen.getByRole("button", { name: "Submit answer" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Deny" })).toBeEnabled();
  });

  it.each(Object.keys(messages))(
    "provides a complete localized card for %s",
    (locale) => {
      vi.mocked(window.QwenPaw.host.useLocale).mockReturnValue(locale);
      renderQuestion();
      expect(screen.getByRole("dialog")).toHaveAccessibleName(
        messages[locale].title,
      );
      expect(screen.getByText(messages[locale].recommended)).toBeVisible();
      expect(Object.keys(messages[locale]).sort()).toEqual(
        Object.keys(messages.en).sort(),
      );
    },
  );

  it("makes Other an alternative to all multi-select choices in both directions", async () => {
    const user = userEvent.setup();
    const { onResolved } = renderQuestion([second]);
    await user.click(
      screen.getByRole("button", { name: "Search Find entries" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Export Download entries" }),
    );
    await user.type(screen.getByRole("textbox"), "Custom features");
    expect(
      screen.queryByRole("button", { pressed: true }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Search Find entries" }),
    );
    expect(screen.getByRole("textbox")).toHaveValue("");
    await user.click(
      screen.getByRole("button", { name: "Export Download entries" }),
    );
    await user.click(screen.getByRole("button", { name: "Submit answer" }));
    await waitFor(() => expect(onResolved).toHaveBeenCalledOnce());
    expect(sentBody().answers).toEqual([
      {
        question: second.question,
        selected: ["Search", "Export"],
        other: null,
      },
    ]);
  });

  it("uses the shared theme fallback, bounded content panels, and scoped styles cleaned on unmount", () => {
    const otherCard = document.createElement("div");
    otherCard.className = "ant-card-body";
    document.body.append(otherCard);
    const result = renderQuestion([first, second]);
    const card = screen.getByRole("dialog");
    expect(card.style.getPropertyValue("--yance-auq-accent")).toBe(
      testTokens.colorPrimary,
    );
    const context =
      result.container.querySelector<HTMLPreElement>(".yance-auq-panel")!;
    expect(getComputedStyle(context).maxHeight).toBe("200px");
    expect(getComputedStyle(context).overflow).toBe("auto");
    expect(
      getComputedStyle(card.querySelector(".yance-auq-content")!).overflowY,
    ).toBe("auto");
    expect(getComputedStyle(otherCard).maxHeight).not.toContain("100dvh");
    const changedTokens = {
      ...testTokens,
      colorPrimary: "#abcdef",
      colorBgElevated: "#222222",
    };
    vi.mocked(window.QwenPaw.host.antd.theme.useToken).mockReturnValue({
      token: changedTokens,
    });
    result.rerender(
      <QuestionCard
        approval={result.approval}
        onResolved={result.onResolved}
      />,
    );
    expect(card.style.getPropertyValue("--yance-auq-accent")).toBe("#abcdef");
    expect(card.style.getPropertyValue("--yance-auq-surface-raised")).toBe(
      "#222222",
    );
    expect(
      document.querySelectorAll("style[data-yance-ask-user-question-styles]"),
    ).toHaveLength(1);
    result.unmount();
    expect(
      document.querySelector("style[data-yance-ask-user-question-styles]"),
    ).toBeNull();
    otherCard.remove();
  });

  it("places title, mm:ss and progress together, with single-line Other and separate footer navigation", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T05:00:00Z"));
    const result = renderQuestion([first, second]);
    const title = screen.getByText(messages.en.title);
    const header = title.closest("header")!;
    expect(within(header).getByText("10:00")).toBeVisible();
    expect(within(header).getByText("1 / 2")).toBeVisible();
    expect(screen.getByRole("textbox").tagName).toBe("INPUT");
    expect(screen.getByText("Recommended")).toHaveAttribute(
      "data-color",
      "success",
    );
    const footer = result.container.querySelector("footer")!;
    const deny = within(footer).getByRole("button", { name: "Deny" });
    expect(getComputedStyle(deny).marginRight).toBe("auto");
    expect(
      within(footer).getByRole("button", { name: "Next question" })
        .parentElement,
    ).not.toBe(deny.parentElement);
  });

  it("shows pending identities and plain metadata without fabricating an owner or rendering HTML", async () => {
    const user = userEvent.setup();
    const approval = {
      ...pending(),
      findingsCount: 2,
      severity: "high",
      findingsSummary: "<img src=x onerror=alert(1)>",
    };
    const result = renderQuestion([first], approval);
    expect(screen.getByText("pending-agent")).toBeVisible();
    expect(
      screen.queryByText("currently-selected-agent"),
    ).not.toBeInTheDocument();
    const sourceRow = screen.getByText("Source:").parentElement!;
    expect(sourceRow).toHaveTextContent("Plugin");
    expect(sourceRow).toHaveTextContent("yance_ask_user_question");
    expect(screen.getByText("HIGH")).toHaveAttribute("data-color", "error");
    await user.click(screen.getByText("Parameters", { selector: "summary" }));
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "PRE" &&
          element.textContent === JSON.stringify(approval.toolParams, null, 2),
      ),
    ).toBeVisible();
    await user.click(screen.getByText("Details", { selector: "summary" }));
    expect(screen.getByText(approval.findingsSummary)).toBeVisible();
    expect(result.container.querySelector("img")).toBeNull();
    expect(screen.getByText(manifest.name)).toBeVisible();
    expect(screen.getByText(manifest.version)).toBeVisible();
    expect(screen.getByText("Yance")).toBeVisible();
    expect(screen.getByRole("link", { name: "xstyle@qq.com" })).toHaveAttribute(
      "href",
      "mailto:xstyle@qq.com",
    );
  });

  it.each([
    ["zh-CN", "zh"],
    ["zh_CN", "zh"],
    ["en-US", "en"],
    ["id-ID", "id"],
    ["ja-JP", "ja"],
    ["pt", "pt-BR"],
    ["PT_br", "pt-BR"],
    ["ru-RU", "ru"],
    ["vi-VN", "vi"],
    ["fr-FR", "en"],
    ["constructor", "en"],
  ])(
    "resolves host locale %s to %s with a localized introduction",
    async (alias, locale) => {
      const user = userEvent.setup();
      vi.mocked(window.QwenPaw.host.useLocale).mockReturnValue(alias);
      renderQuestion();
      expect(resolveLocale(alias)).toBe(locale);
      expect(screen.getByRole("dialog")).toHaveAccessibleName(
        messages[locale].title,
      );
      expect(
        screen.getByRole("heading", { name: first.question }),
      ).toBeVisible();
      await user.click(
        screen.getByText(messages[locale].details, { selector: "summary" }),
      );
      expect(
        screen.getByText(
          manifest.description_i18n[
            locale as keyof typeof manifest.description_i18n
          ],
        ),
      ).toBeVisible();
      expect(screen.getByText("Yance")).toBeVisible();
    },
  );
});

describe("recommendation emphasis", () => {
  it.each(["light", "dark"])(
    "distinguishes recommendation from primary selection in the %s theme",
    async (mode) => {
      const user = userEvent.setup();
      const tokens =
        mode === "dark"
          ? {
              ...testTokens,
              colorBgElevated: "#1f1f1f",
              colorText: "#f0f0f0",
              colorSuccessBg: "#162312",
              colorSuccessBorder: "#274916",
              colorSuccess: "#49aa19",
            }
          : testTokens;
      vi.mocked(window.QwenPaw.host.antd.theme.useToken).mockReturnValue({
        token: tokens,
      });
      renderQuestion();
      const recommended = screen.getByRole("button", {
        name: "SQLite Recommended Keeps setup simple",
      });
      const alternative = screen.getByRole("button", {
        name: "PostgreSQL Supports multiple writers",
      });
      expect(
        screen
          .getByRole("dialog")
          .style.getPropertyValue("--yance-auq-success-bg"),
      ).toBe(tokens.colorSuccessBg);
      expect(
        screen
          .getByRole("dialog")
          .style.getPropertyValue("--yance-auq-success-border"),
      ).toBe(tokens.colorSuccessBorder);
      expect(recommended).toHaveAttribute("aria-pressed", "false");
      expect(recommended).toHaveAttribute("data-variant", "default");
      const emphasized = recommendationAppearance(recommended);
      expect(emphasized["background-color"]).toBeTruthy();
      expect(emphasized["border-color"]).toBeTruthy();
      expect(recommendationAppearance(alternative)).toEqual({});
      expect(
        screen.getByRole("button", { name: "Submit answer" }),
      ).toBeDisabled();
      await user.click(recommended);
      expect(recommended).toHaveAttribute("aria-pressed", "true");
      expect(recommended).toHaveAttribute("data-variant", "primary");
      const selectedAppearance = recommendationAppearance(recommended);
      expect(selectedAppearance).toEqual({});
      expect(within(recommended).getByText("Recommended")).toBeVisible();
      expect(recommended.querySelector("svg")).not.toBeNull();
      await user.click(alternative);
      expect(alternative).toHaveAttribute("data-variant", "primary");
      expect(recommendationAppearance(alternative)).toEqual(selectedAppearance);
      expect(recommended).toHaveAttribute("aria-pressed", "false");
      expect(recommendationAppearance(recommended)["background-color"]).toBe(
        emphasized["background-color"],
      );
    },
  );

  it("keeps recommendation priority above host dark defaults without overriding selected or disabled options", async () => {
    const user = userEvent.setup();
    const { rerender, onResolved } = renderQuestion();
    const recommended = screen.getByRole("button", {
      name: "SQLite Recommended Keeps setup simple",
    });
    const alternative = screen.getByRole("button", {
      name: "PostgreSQL Supports multiple writers",
    });
    const hostStyle = document.createElement("style");
    hostStyle.textContent = `html.dark-mode .qwenpaw-btn-default {
      background-color: #141414 !important;
      border: 1px solid #434343 !important;
    }`;
    const priorityStyle = document.createElement("style");
    // JSDOM loses !important while parsing var() declarations. Resolve only
    // fallback values in a test copy, retaining the rendered selectors/priority.
    priorityStyle.textContent = document
      .querySelector<HTMLStyleElement>(
        "style[data-yance-ask-user-question-styles]",
      )!
      .textContent!.replace(/var\(--[^,()]+,\s*var\(--[^()]+\)\)/g, "#162312");
    document.head.append(hostStyle);
    document.head.append(priorityStyle);
    document.documentElement.classList.add("dark-mode");
    recommended.classList.add("qwenpaw-btn-default");
    alternative.classList.add("qwenpaw-btn-default");
    try {
      const hostRule = hostStyle.sheet!.cssRules[0] as CSSStyleRule;
      expect(recommended.matches(hostRule.selectorText)).toBe(true);
      expect(alternative.matches(hostRule.selectorText)).toBe(true);
      expect(hostRule.style.getPropertyPriority("background-color")).toBe(
        "important",
      );
      expect(hostRule.style.getPropertyPriority("border")).toBe("important");
      const sheet = priorityStyle.sheet!;
      const recommendationRules = Array.from(sheet.cssRules).filter(
        (rule): rule is CSSStyleRule =>
          "selectorText" in rule &&
          (rule as CSSStyleRule).selectorText.includes(
            ".yance-auq-option-recommended",
          ),
      );
      expect(recommendationRules).toHaveLength(2);
      for (const rule of recommendationRules) {
        const enabledSelector = rule.selectorText.replace(":hover", "");
        expect(recommended.matches(enabledSelector)).toBe(true);
        expect(alternative.matches(enabledSelector)).toBe(false);
        expect(rule.style.getPropertyPriority("border-color")).toBe(
          "important",
        );
      }
      expect(
        recommendationRules[0].style.getPropertyPriority("background-color"),
      ).toBe("important");
      await user.click(recommended);
      for (const rule of recommendationRules) {
        expect(
          recommended.matches(rule.selectorText.replace(":hover", "")),
        ).toBe(false);
      }
      const expired = {
        ...pending(),
        requestId: "expired-request",
        createdAt: Date.now() / 1000 - 10,
        timeoutSeconds: 1,
      };
      rerender(<QuestionCard approval={expired} onResolved={onResolved} />);
      const disabledRecommendation = screen.getByRole("button", {
        name: "SQLite Recommended Keeps setup simple",
      });
      expect(disabledRecommendation).toBeDisabled();
      expect(disabledRecommendation).toHaveAttribute("aria-pressed", "false");
      for (const rule of recommendationRules) {
        expect(
          disabledRecommendation.matches(
            rule.selectorText.replace(":hover", ""),
          ),
        ).toBe(false);
      }
    } finally {
      document.documentElement.classList.remove("dark-mode");
      hostStyle.remove();
      priorityStyle.remove();
    }
  });

  it("keeps the model's option order when the recommendation is second", () => {
    renderQuestion([{ ...first, options: [...first.options].reverse() }]);
    const options = screen.getAllByRole("button", { pressed: false });
    expect(options[0]).toHaveAccessibleName(
      "PostgreSQL Supports multiple writers",
    );
    expect(options[1]).toHaveAccessibleName(
      "SQLite Recommended Keeps setup simple",
    );
    expect(options[0].querySelector("svg")).toBeNull();
    expect(options[1].querySelector("svg")).not.toBeNull();
    expect(
      screen.queryByRole("button", { pressed: true }),
    ).not.toBeInTheDocument();
  });

  it("retains full recommended labels alongside other multi-select choices", async () => {
    const user = userEvent.setup();
    const { onResolved } = renderQuestion([{ ...first, multi_select: true }]);
    await user.click(
      screen.getByRole("button", {
        name: "SQLite Recommended Keeps setup simple",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "PostgreSQL Supports multiple writers",
      }),
    );
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Submit answer" }));
    await waitFor(() => expect(onResolved).toHaveBeenCalledOnce());
    expect(sentBody().answers).toEqual([
      {
        question: first.question,
        selected: ["SQLite (Recommended)", "PostgreSQL"],
        other: null,
      },
    ]);
  });
});
