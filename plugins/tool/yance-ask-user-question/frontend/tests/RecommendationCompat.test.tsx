import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "../src/QuestionCard";
import type { ChatApprovalData } from "../src/qwenpaw-host";
import type { Question } from "../src/questions";

function show(questions: Question[]) {
  const approval: ChatApprovalData = {
    requestId: "compat-proof",
    sessionId: "session",
    rootSessionId: "session",
    agentId: "pending-agent",
    toolName: "yance_ask_user_question",
    sourceType: "yance_ask_user_question",
    severity: "low",
    findingsCount: 0,
    findingsSummary: "Questions",
    toolParams: { questions },
    createdAt: Date.now() / 1000,
    timeoutSeconds: 600,
  };
  const onResolved = vi.fn();
  render(<QuestionCard approval={approval} onResolved={onResolved} />);
  return onResolved;
}

function sentAnswers() {
  return JSON.parse(
    String(vi.mocked(window.QwenPaw.host.fetch).mock.calls[0][1]?.body),
  ).answers;
}

describe("recommendation display compatibility", () => {
  it.each(
    [0, 1, 2, 3].flatMap((position) =>
      [false, true].map((multi) => [position, multi] as const),
    ),
  )(
    "places the explicit recommendation from source index %i first in multi_select=%s",
    async (position, multi) => {
      const user = userEvent.setup();
      const options = ["A", "B", "C", "D"].map((name, index) => ({
        label: "Plan " + name + (index === position ? "（推荐）  " : ""),
        description: "Reason " + name,
      }));
      const rawLabels = options.map((entry) => entry.label);
      const question: Question = {
        question: "Which plan?",
        header: "Plan",
        options,
        multi_select: multi,
      };
      const onResolved = show([question]);
      const buttons = screen.getAllByRole("button", { pressed: false });
      const marked = buttons[0];
      expect(marked).toHaveClass("yance-auq-option-recommended");
      expect(marked.querySelector("svg")).not.toBeNull();
      expect(marked).toHaveAccessibleName(
        "Plan " +
          ["A", "B", "C", "D"][position] +
          " Recommended Reason " +
          ["A", "B", "C", "D"][position],
      );
      expect(
        buttons.slice(1).map((button) => button.textContent?.slice(0, 6)),
      ).toEqual(
        options
          .filter((_, index) => index !== position)
          .map((entry) => entry.label.slice(0, 6)),
      );
      expect(screen.queryByRole("button", { pressed: true })).toBeNull();
      expect(
        screen.getByRole("button", { name: "Submit answer" }),
      ).toBeDisabled();
      await user.click(marked);
      expect(marked.querySelector("svg")).not.toBeNull();
      await user.click(screen.getByRole("button", { name: "Submit answer" }));
      await waitFor(() => expect(onResolved).toHaveBeenCalledOnce());
      expect(sentAnswers()).toEqual([
        {
          question: question.question,
          selected: [rawLabels[position]],
          other: null,
        },
      ]);
      expect(options.map((entry) => entry.label)).toEqual(rawLabels);
    },
  );

  it("supports the reported Chinese labels, preserves navigation and maps previews using raw labels", async () => {
    const user = userEvent.setup();
    vi.mocked(window.QwenPaw.host.useLocale).mockReturnValue("zh");
    const route: Question = {
      question: "如何安排行程？",
      header: "行程",
      options: [
        {
          label: "只约沈园（推荐）",
          description: "行程更紧凑",
          preview: "沈园路线预览",
        },
        {
          label: "增加其他景点",
          description: "安排更多时间",
          preview: "其他景点预览",
        },
      ],
    };
    const photo: Question = {
      question: "拍摄偏好是什么？",
      header: "拍摄",
      multi_select: true,
      options: [
        { label: "要出片（推荐）", description: "重视照片效果" },
        { label: "也要记录过程", description: "保留过程素材" },
      ],
    };
    const onResolved = show([route, photo]);
    const first = screen.getByRole("button", {
      name: "只约沈园 推荐 行程更紧凑",
    });
    expect(within(first).getByText("推荐")).toBeVisible();
    expect(first.querySelector("svg")).not.toBeNull();
    expect(screen.queryByText("沈园路线预览")).toBeNull();
    await user.click(first);
    expect(screen.getByText("沈园路线预览")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "下一题" }));
    await user.click(
      screen.getByRole("button", { name: "要出片 推荐 重视照片效果" }),
    );
    await user.click(
      screen.getByRole("button", { name: "也要记录过程 保留过程素材" }),
    );
    await user.click(screen.getByRole("button", { name: "上一题" }));
    expect(
      screen.getByRole("button", { name: "只约沈园 推荐 行程更紧凑" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("沈园路线预览")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "下一题" }));
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "提交答案" }));
    await waitFor(() => expect(onResolved).toHaveBeenCalledOnce());
    expect(sentAnswers()).toEqual([
      { question: route.question, selected: ["只约沈园（推荐）"], other: null },
      {
        question: photo.question,
        selected: ["要出片（推荐）", "也要记录过程"],
        other: null,
      },
    ]);
  });

  it("keeps multiple recommendations in source order and changes preview after selecting a different raw label", async () => {
    const user = userEvent.setup();
    const question: Question = {
      question: "Which preview?",
      header: "Preview",
      options: [
        { label: "Plain A", description: "Unmarked", preview: "Preview A" },
        {
          label: "Marked B（推荐）",
          description: "First marked",
          preview: "Preview B",
        },
        { label: "Plain C", description: "Unmarked", preview: "Preview C" },
        {
          label: "Marked D (recommended)",
          description: "Second marked",
          preview: "Preview D",
        },
      ],
    };
    const onResolved = show([question]);
    const buttons = screen.getAllByRole("button", { pressed: false });
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Marked B Recommended First marked",
      "Marked D Recommended Second marked",
      "Plain A Unmarked",
      "Plain C Unmarked",
    ]);
    await user.click(buttons[1]);
    expect(screen.getByText("Preview D")).toBeVisible();
    await user.click(buttons[0]);
    expect(screen.queryByText("Preview D")).toBeNull();
    expect(screen.getByText("Preview B")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Submit answer" }));
    await waitFor(() => expect(onResolved).toHaveBeenCalledOnce());
    expect(sentAnswers()[0].selected).toEqual(["Marked B（推荐）"]);
  });
});
