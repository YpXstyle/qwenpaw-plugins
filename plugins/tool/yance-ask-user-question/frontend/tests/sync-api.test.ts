import { describe, expect, it, vi } from "vitest";
import {
  readDescription,
  syncChineseDescription,
  type DescriptionSnapshot,
} from "../src/sync-api";

const agentId = "currently-selected-agent";
const endpoint = "/yance-ask-user-question/description-sync";
const snapshot: DescriptionSnapshot = {
  agentId,
  currentDescription: "Previous English description",
  targetDescription: "在同一轮中收集结构化答案。",
};

function body(current = snapshot.currentDescription, id = agentId) {
  return {
    agent_id: id,
    current_description: current,
    target_description: snapshot.targetDescription,
  };
}

function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status });
}

describe("description-only plugin transaction", () => {
  it("posts only captured identity and expected description, then verifies with GET", async () => {
    vi.mocked(window.QwenPaw.host.fetch)
      .mockResolvedValueOnce(response(body(snapshot.targetDescription)))
      .mockResolvedValueOnce(response(body(snapshot.targetDescription)));
    const result = await syncChineseDescription(
      snapshot,
      new AbortController().signal,
    );
    expect(result).toEqual({
      ...snapshot,
      currentDescription: snapshot.targetDescription,
    });
    const calls = vi.mocked(window.QwenPaw.host.fetch).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0][0]).toBe(endpoint);
    expect(calls[0][1]?.method).toBe("POST");
    expect(JSON.parse(String(calls[0][1]?.body))).toEqual({
      agent_id: agentId,
      expected_description: snapshot.currentDescription,
    });
    expect(calls[1][0]).toBe(`${endpoint}?agent_id=${agentId}`);
    expect(calls[1][1]?.method).toBeUndefined();
    for (const [, init] of calls)
      expect(init?.headers).toMatchObject({ "X-Agent-Id": agentId });
  });

  it("uses the public query and an explicit captured Agent header when reading", async () => {
    const id = "special agent/one";
    vi.mocked(window.QwenPaw.host.getSelectedAgentId).mockReturnValue(id);
    vi.mocked(window.QwenPaw.host.fetch).mockResolvedValue(
      response(body(snapshot.currentDescription, id)),
    );
    expect(await readDescription(id, new AbortController().signal)).toEqual({
      ...snapshot,
      agentId: id,
    });
    expect(window.QwenPaw.host.fetch).toHaveBeenCalledExactlyOnceWith(
      `${endpoint}?agent_id=special%20agent%2Fone`,
      expect.objectContaining({ headers: { "X-Agent-Id": id } }),
    );
  });

  it.each([
    [401, "syncAuthError"],
    [403, "syncAuthError"],
    [404, "syncMissingTool"],
    [409, "syncChanged"],
    [422, "syncWriteError"],
    [500, "syncWriteError"],
  ])(
    "does not retry or roll back after HTTP %s",
    async (status, messageKey) => {
      vi.mocked(window.QwenPaw.host.fetch).mockResolvedValue(
        response({}, status as number),
      );
      await expect(
        syncChineseDescription(snapshot, new AbortController().signal),
      ).rejects.toMatchObject({ messageKey });
      expect(window.QwenPaw.host.fetch).toHaveBeenCalledOnce();
    },
  );

  it.each([
    { agent_id: agentId, current_description: "old" },
    { ...body(), agent_id: "other" },
    { ...body(), current_description: false },
    { ...body(), target_description: "" },
    null,
  ])("rejects an unreadable or foreign GET response %j", async (value) => {
    vi.mocked(window.QwenPaw.host.fetch).mockResolvedValue(response(value));
    await expect(
      readDescription(agentId, new AbortController().signal),
    ).rejects.toMatchObject({ messageKey: "syncReadError" });
    expect(
      vi.mocked(window.QwenPaw.host.fetch).mock.calls[0][1]?.method,
    ).toBeUndefined();
  });

  it("never overwrites another description after a post-write verification conflict", async () => {
    vi.mocked(window.QwenPaw.host.fetch)
      .mockResolvedValueOnce(response(body(snapshot.targetDescription)))
      .mockResolvedValueOnce(response(body("Another writer's description")));
    await expect(
      syncChineseDescription(snapshot, new AbortController().signal),
    ).rejects.toMatchObject({ messageKey: "syncVerifyError" });
    expect(
      vi
        .mocked(window.QwenPaw.host.fetch)
        .mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(1);
  });

  it("reports verification uncertainty when the follow-up GET fails", async () => {
    vi.mocked(window.QwenPaw.host.fetch)
      .mockResolvedValueOnce(response(body(snapshot.targetDescription)))
      .mockRejectedValueOnce(new Error("network unavailable"));
    await expect(
      syncChineseDescription(snapshot, new AbortController().signal),
    ).rejects.toMatchObject({ messageKey: "syncVerifyError" });
    expect(window.QwenPaw.host.fetch).toHaveBeenCalledTimes(2);
  });

  it.each(["agent switch", "unmount abort"])(
    "makes no request when %s happened before the action",
    async (reason) => {
      const controller = new AbortController();
      if (reason === "agent switch")
        vi.mocked(window.QwenPaw.host.getSelectedAgentId).mockReturnValue(
          "other",
        );
      else controller.abort();
      await expect(
        syncChineseDescription(snapshot, controller.signal),
      ).rejects.toMatchObject({ messageKey: "syncAgentChanged" });
      expect(window.QwenPaw.host.fetch).not.toHaveBeenCalled();
    },
  );

  it.each(["agent switch", "unmount abort"])(
    "stops subsequent requests when %s happens during POST",
    async (reason) => {
      const controller = new AbortController();
      vi.mocked(window.QwenPaw.host.fetch).mockImplementationOnce(async () => {
        if (reason === "agent switch")
          vi.mocked(window.QwenPaw.host.getSelectedAgentId).mockReturnValue(
            "other",
          );
        else controller.abort();
        return response(body(snapshot.targetDescription));
      });
      await expect(
        syncChineseDescription(snapshot, controller.signal),
      ).rejects.toMatchObject({ messageKey: "syncAgentChanged" });
      expect(window.QwenPaw.host.fetch).toHaveBeenCalledOnce();
    },
  );

  it("rechecks the Agent after asynchronous JSON parsing", async () => {
    vi.mocked(window.QwenPaw.host.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        vi.mocked(window.QwenPaw.host.getSelectedAgentId).mockReturnValue(
          "other",
        );
        return body();
      },
    } as Response);
    await expect(
      readDescription(agentId, new AbortController().signal),
    ).rejects.toMatchObject({ messageKey: "syncAgentChanged" });
  });
});
