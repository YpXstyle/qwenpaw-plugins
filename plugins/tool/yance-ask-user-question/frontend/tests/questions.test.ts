import { describe, expect, it } from "vitest";
import {
  buildAnswers,
  displayOptions,
  optionDisplay,
  type Question,
} from "../src/questions";

describe("explicit recommendation display markers", () => {
  it.each([
    ["Plan (Recommended)", "Plan"],
    ["Plan (recommended)", "Plan"],
    ["Plan (RECOMMENDED)", "Plan"],
    ["Plan（Recommended）", "Plan"],
    ["Plan（recommended）", "Plan"],
    ["只约沈园（推荐）", "只约沈园"],
    ["要出片(推荐)", "要出片"],
    ["只约沈园（推荐） \n\u00a0", "只约沈园"],
    ["Plan(Recommended)", "Plan"],
  ])("recognizes only the ending marker in %j", (raw, label) => {
    expect(optionDisplay(raw)).toEqual({ label, recommended: true });
  });

  it.each([
    "Plan (Recommended) later",
    "(Recommended) Plan",
    "推荐方案",
    "方案推荐",
    "推荐",
    "方案（不推荐）",
    "方案(不推荐)",
    "Plan [Recommended]",
    "Plan ( Recommended)",
    "Plan (Recommended )",
    "Plan (Recommended）",
    "Plan（Recommended)",
    "Plan (Recommended)\u200b",
    "只约沈园（推荐）\u200b",
    "Plan (Rec\u200bommended)",
  ])("does not infer recommendation from %j", (label) => {
    expect(optionDisplay(label).recommended).toBe(false);
    expect(optionDisplay(label).label).toBe(label);
  });

  it("only trims display whitespace and leaves invisible non-whitespace characters intact", () => {
    expect(optionDisplay("Plan \n\u00a0")).toEqual({
      label: "Plan",
      recommended: false,
    });
    expect(optionDisplay("Plan\u200b \n")).toEqual({
      label: "Plan\u200b",
      recommended: false,
    });
  });

  it("stably partitions marked options without mutating or copying their payload objects", () => {
    const source = Object.freeze([
      Object.freeze({ label: "A", description: "Recommended in prose" }),
      Object.freeze({ label: "B（推荐）", description: "First marker" }),
      Object.freeze({ label: "C", description: "Ordinary", recommended: true }),
      Object.freeze({ label: "D (recommended)", description: "Second marker" }),
    ]);
    const displayed = displayOptions(source);
    expect(displayed.map((entry) => entry.label)).toEqual([
      "B（推荐）",
      "D (recommended)",
      "A",
      "C",
    ]);
    expect(source.map((entry) => entry.label)).toEqual([
      "A",
      "B（推荐）",
      "C",
      "D (recommended)",
    ]);
    expect(displayed[0]).toBe(source[1]);
    expect(displayed[1]).toBe(source[3]);
    expect(displayOptions(source)).not.toBe(source);
  });

  it("returns the untouched question and selected labels in the framework answer shape", () => {
    const raw = "只约沈园（推荐） \n\u00a0";
    const question: Question = {
      question: "Which route?",
      header: "Route",
      options: [
        { label: "Other route", description: "Alternative" },
        { label: raw, description: "Explicit marker" },
      ],
    };
    displayOptions(question.options);
    expect(buildAnswers([question], [{ selected: [raw], other: "" }])).toEqual([
      { question: question.question, selected: [raw], other: null },
    ]);
    expect(question.options[1].label).toBe(raw);
  });
});
