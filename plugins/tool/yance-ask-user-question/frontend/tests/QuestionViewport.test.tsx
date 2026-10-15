import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuestionCard } from "../src/QuestionCard";
import { questionBounds } from "../src/QuestionViewport";
import type { ChatApprovalData } from "../src/qwenpaw-host";

describe("bounds from the actual renderer anchor", () => {
  it.each([
    [705, 0, 775, 1, 693, 0],
    [500, 0, 775, 1, 488, 0],
    [705, 100, 400, 1, 376, -217],
    [705, 0, 775, 0.8, 866, 0],
    [50, 100, 400, 1, 376, 438],
  ])(
    "fits anchor %s into viewport top=%s height=%s scale=%s",
    (anchor, top, height, scale, maxHeight, offsetY) => {
      const bounds = questionBounds(anchor, top, height, scale);
      expect(bounds).toEqual({ maxHeight, offsetY });
      expect(anchor + offsetY * scale).toBeLessThanOrEqual(top + height - 12);
      expect(
        anchor + offsetY * scale - maxHeight * scale,
      ).toBeGreaterThanOrEqual(top + 12);
    },
  );
});

const approval: ChatApprovalData = {
  requestId: "viewport-question",
  sessionId: "session",
  rootSessionId: "session",
  agentId: "pending-agent",
  toolName: "yance_ask_user_question",
  sourceType: "yance_ask_user_question",
  severity: "info",
  findingsCount: 0,
  findingsSummary: "Questions",
  timeoutSeconds: 600,
  createdAt: 0,
  toolParams: {
    questions: [
      {
        question: "Which layout should we use?",
        header: "Layout",
        context: "Long context\n".repeat(50),
        options: [
          {
            label: "Compact (Recommended)",
            description: "Fits a smaller window",
          },
          { label: "Wide", description: "Uses more space" },
        ],
      },
    ],
  },
};

describe("renderer viewport lifecycle", () => {
  let anchorBottom: number;
  let scaleY: number;
  let observerCallback: ResizeObserverCallback;
  let observe: ReturnType<typeof vi.fn>;
  let disconnect: ReturnType<typeof vi.fn>;
  let frames: Map<number, FrameRequestCallback>;

  beforeEach(() => {
    anchorBottom = 705;
    scaleY = 1;
    frames = new Map();
    let frameId = 0;
    vi.stubGlobal("innerHeight", 775);
    vi.stubGlobal("visualViewport", null);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.set(++frameId, callback);
      return frameId;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      frames.delete(id);
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        if (this.classList.contains("yance-auq-anchor"))
          return new DOMRect(0, anchorBottom - scaleY, 1, scaleY);
        return new DOMRect();
      },
    );
    observe = vi.fn();
    disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = observe;
        disconnect = disconnect;
        constructor(callback: ResizeObserverCallback) {
          observerCallback = callback;
        }
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function mount() {
    return render(
      <QuestionCard
        approval={{ ...approval, createdAt: Date.now() / 1000 }}
        onResolved={vi.fn()}
      />,
    );
  }

  function flush() {
    act(() => {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(0));
    });
  }

  function frame(): HTMLElement {
    return screen.getByRole("dialog").closest<HTMLElement>(".yance-auq-frame")!;
  }

  it("applies flex and scrolling to a qwenpaw-prefixed shared Card through its own body class", () => {
    mount();
    const card = screen.getByRole("dialog");
    const body = card.querySelector(".qwenpaw-card-body")!;
    expect(body).toHaveClass("yance-auq-body");
    expect(getComputedStyle(body).display).toBe("flex");
    expect(getComputedStyle(body).overflow).toBe("hidden");
    expect(
      getComputedStyle(card.querySelector(".yance-auq-content")!).overflowY,
    ).toBe("auto");
    expect(frame().style.getPropertyValue("--yance-auq-max-height")).toBe(
      "693px",
    );
    expect(frame().style.getPropertyValue("--yance-auq-offset-y")).toBe("0px");
    expect(observe).toHaveBeenCalledWith(frame());
  });

  it("remeasures the real anchor after resize without resetting the input or selection", async () => {
    const user = userEvent.setup();
    mount();
    const input = screen.getByRole("textbox");
    await user.type(input, "Keep my answer");
    anchorBottom = 440;
    act(() => window.dispatchEvent(new Event("resize")));
    flush();
    expect(frame().style.getPropertyValue("--yance-auq-max-height")).toBe(
      "428px",
    );
    expect(screen.getByRole("textbox")).toBe(input);
    expect(input).toHaveValue("Keep my answer");
    await user.click(screen.getByRole("button", { name: /Compact/ }));
    anchorBottom = 705;
    act(() => observerCallback([], {} as ResizeObserver));
    flush();
    expect(screen.getByRole("button", { name: /Compact/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(frame().style.getPropertyValue("--yance-auq-max-height")).toBe(
      "693px",
    );
    expect(window.QwenPaw.host.fetch).not.toHaveBeenCalled();
  });

  it("keeps the footer above a reduced visual viewport and cleans up all owned observers/listeners", () => {
    const viewport = new EventTarget();
    Object.assign(viewport, { height: 400, offsetTop: 100 });
    const remove = vi.spyOn(viewport, "removeEventListener");
    vi.stubGlobal("visualViewport", viewport);
    const result = mount();
    expect(frame().style.getPropertyValue("--yance-auq-offset-y")).toBe(
      "-217px",
    );
    expect(frame().style.getPropertyValue("--yance-auq-max-height")).toBe(
      "376px",
    );
    Object.assign(viewport, { height: 775, offsetTop: 0 });
    act(() => viewport.dispatchEvent(new Event("resize")));
    flush();
    expect(frame().style.getPropertyValue("--yance-auq-offset-y")).toBe("0px");
    act(() => viewport.dispatchEvent(new Event("scroll")));
    expect(frames.size).toBe(1);
    result.unmount();
    expect(frames.size).toBe(0);
    expect(disconnect).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    act(() => {
      window.dispatchEvent(new Event("resize"));
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(frames.size).toBe(0);
    expect(
      document.querySelector("style[data-yance-ask-user-question-styles]"),
    ).toBeNull();
  });

  it("accounts for an ancestor's vertical scale without changing the host wrapper", () => {
    scaleY = 0.8;
    const result = mount();
    expect(frame().style.getPropertyValue("--yance-auq-max-height")).toBe(
      "866px",
    );
    expect(result.container.getAttribute("style")).toBeNull();
  });
});
