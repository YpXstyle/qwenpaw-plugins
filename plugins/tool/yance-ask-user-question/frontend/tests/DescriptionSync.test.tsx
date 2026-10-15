import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DescriptionSync } from "../src/DescriptionSync";
import { messages } from "../src/locale";

const agentId = "currently-selected-agent";
const endpoint = "/yance-ask-user-question/description-sync";
const target = "在同一轮中收集结构化答案。";

function response(current = "Previous English description", id = agentId) {
  return new Response(
    JSON.stringify({
      agent_id: id,
      current_description: current,
      target_description: target,
    }),
    { status: 200 },
  );
}

describe("explicit description settings page", () => {
  it("keeps an already synchronized description read-only until an explicit refresh", async () => {
    vi.mocked(window.QwenPaw.host.fetch).mockResolvedValue(response(target));
    render(<DescriptionSync />);
    expect(await screen.findByRole("status")).toHaveTextContent(
      messages.en.syncAlready,
    );
    expect(
      screen.getByRole("button", { name: messages.en.syncAction }),
    ).toBeDisabled();
    expect(window.QwenPaw.host.fetch).toHaveBeenCalledOnce();
  });

  it.each(Object.keys(messages))(
    "shows selected Agent and description in %s without automatically writing",
    async (locale) => {
      vi.mocked(window.QwenPaw.host.useLocale).mockReturnValue(locale);
      vi.mocked(window.QwenPaw.host.fetch).mockResolvedValue(response());
      render(<DescriptionSync />);
      expect(
        screen.getByRole("heading", { name: messages[locale].syncCurrent }),
      ).toBeVisible();
      expect(
        await screen.findByText("Previous English description"),
      ).toBeVisible();
      expect(screen.getByText(agentId)).toBeVisible();
      expect(screen.getByText(target)).toBeVisible();
      expect(screen.getByRole("note")).toHaveTextContent(
        messages[locale].syncCaution,
      );
      expect(
        screen.getByRole("button", { name: messages[locale].syncAction }),
      ).toBeEnabled();
      expect(window.QwenPaw.host.fetch).toHaveBeenCalledOnce();
      expect(
        vi.mocked(window.QwenPaw.host.fetch).mock.calls[0][1]?.method,
      ).toBeUndefined();
    },
  );

  it("sends one explicit action while a deferred POST is pending and verifies success", async () => {
    let resolvePost!: (value: Response) => void;
    const post = new Promise<Response>((resolve) => {
      resolvePost = resolve;
    });
    vi.mocked(window.QwenPaw.host.fetch)
      .mockResolvedValueOnce(response())
      .mockImplementationOnce(() => post)
      .mockResolvedValueOnce(response(target));
    render(<DescriptionSync />);
    await screen.findByText("Previous English description");
    const sync = screen.getByRole("button", { name: messages.en.syncAction });
    fireEvent.click(sync);
    fireEvent.click(sync);
    expect(sync).toBeDisabled();
    expect(
      screen.getByRole("button", { name: messages.en.syncRefresh }),
    ).toBeDisabled();
    expect(window.QwenPaw.host.fetch).toHaveBeenCalledTimes(2);
    await act(async () => {
      resolvePost(response(target));
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      messages.en.syncSuccess,
    );
    expect(window.QwenPaw.host.fetch).toHaveBeenCalledTimes(3);
    expect(sync).toBeDisabled();
  });

  it("refreshes after a description conflict without retrying the write", async () => {
    const user = userEvent.setup();
    vi.mocked(window.QwenPaw.host.fetch)
      .mockResolvedValueOnce(response())
      .mockResolvedValueOnce(new Response("{}", { status: 409 }))
      .mockResolvedValueOnce(response("A newer description"));
    render(<DescriptionSync />);
    await screen.findByText("Previous English description");
    await user.click(
      screen.getByRole("button", { name: messages.en.syncAction }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      messages.en.syncChanged,
    );
    expect(screen.getByText("A newer description")).toBeVisible();
    expect(
      vi
        .mocked(window.QwenPaw.host.fetch)
        .mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(1);
  });

  it.each([401, 403, 500])(
    "preserves the displayed description after POST failure %s without retry or rollback",
    async (status) => {
      const user = userEvent.setup();
      vi.mocked(window.QwenPaw.host.fetch)
        .mockResolvedValueOnce(response())
        .mockResolvedValueOnce(new Response("{}", { status }));
      render(<DescriptionSync />);
      await screen.findByText("Previous English description");
      await user.click(
        screen.getByRole("button", { name: messages.en.syncAction }),
      );
      expect(await screen.findByRole("alert")).toHaveTextContent(
        status === 500 ? messages.en.syncWriteError : messages.en.syncAuthError,
      );
      expect(screen.getByText("Previous English description")).toBeVisible();
      expect(window.QwenPaw.host.fetch).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    },
  );

  it.each([401, 403, 404, 500])(
    "does not enable writing after a failed initial GET %s",
    async (status) => {
      vi.mocked(window.QwenPaw.host.fetch).mockResolvedValue(
        new Response("{}", { status }),
      );
      render(<DescriptionSync />);
      await screen.findByRole("alert");
      expect(
        screen.getByRole("button", { name: messages.en.syncAction }),
      ).toBeDisabled();
      expect(window.QwenPaw.host.fetch).toHaveBeenCalledOnce();
    },
  );

  it("changes selected Agent without reusing an old description or writing the new Agent", async () => {
    const user = userEvent.setup();
    vi.mocked(window.QwenPaw.host.fetch)
      .mockResolvedValueOnce(response())
      .mockResolvedValueOnce(response("Second Agent description", "second"));
    const result = render(<DescriptionSync />);
    await screen.findByText("Previous English description");
    const originalSignal = vi.mocked(window.QwenPaw.host.fetch).mock.calls[0][1]
      ?.signal;
    vi.mocked(window.QwenPaw.host.useSelectedAgent).mockReturnValue({
      id: "second",
    });
    vi.mocked(window.QwenPaw.host.getSelectedAgentId).mockReturnValue("second");
    result.rerender(<DescriptionSync />);
    await screen.findByText("Second Agent description");
    expect(originalSignal?.aborted).toBe(true);
    expect(
      screen.queryByText("Previous English description"),
    ).not.toBeInTheDocument();
    expect(vi.mocked(window.QwenPaw.host.fetch).mock.calls[1]).toEqual([
      `${endpoint}?agent_id=second`,
      expect.objectContaining({ headers: { "X-Agent-Id": "second" } }),
    ]);
    await user.click(
      screen.getByRole("button", { name: messages.en.syncRefresh }),
    );
    await waitFor(() =>
      expect(window.QwenPaw.host.fetch).toHaveBeenCalledTimes(3),
    );
    expect(
      vi
        .mocked(window.QwenPaw.host.fetch)
        .mock.calls.every(([, init]) => init?.method !== "POST"),
    ).toBe(true);
  });

  it("aborts on unmount and sends no follow-up GET after an in-flight POST resolves", async () => {
    let resolvePost!: (value: Response) => void;
    const post = new Promise<Response>((resolve) => {
      resolvePost = resolve;
    });
    vi.mocked(window.QwenPaw.host.fetch)
      .mockResolvedValueOnce(response())
      .mockImplementationOnce(() => post);
    const result = render(<DescriptionSync />);
    await screen.findByText("Previous English description");
    fireEvent.click(
      screen.getByRole("button", { name: messages.en.syncAction }),
    );
    const signal = vi.mocked(window.QwenPaw.host.fetch).mock.calls[1][1]
      ?.signal;
    result.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      resolvePost(response(target));
    });
    expect(window.QwenPaw.host.fetch).toHaveBeenCalledTimes(2);
  });
});
