import { describe, expect, it, vi } from "vitest";
import {
  markChatRequest,
  PLUGIN_ID,
  registerPlugin,
  SOURCE_TYPE,
} from "../src/register";
import manifest from "../../plugin.json";

describe("public host registrations", () => {
  it("uses the author's manifest identity and namespaced source", () => {
    expect(PLUGIN_ID).toBe("yance-ask-user-question");
    expect(PLUGIN_ID).toBe(manifest.id);
    expect(SOURCE_TYPE).toBe("yance_ask_user_question");
    expect(SOURCE_TYPE).toBe(manifest.meta.tool_name);
  });
  it("registers only the plugin source and disposes every registration once", () => {
    const sdk = {
      ...window.QwenPaw,
      menu: { add: vi.fn() },
      route: { add: vi.fn() },
    };
    const rendererDispose = vi.fn();
    const transformDispose = vi.fn();
    vi.mocked(sdk.chat.approval.render).mockReturnValue({
      dispose: rendererDispose,
    });
    vi.mocked(sdk.chat.requestPayload.add).mockReturnValue({
      dispose: transformDispose,
    });
    const registration = registerPlugin(sdk);
    expect(sdk.chat.approval.render).toHaveBeenCalledExactlyOnceWith(
      PLUGIN_ID,
      SOURCE_TYPE,
      expect.any(Function),
    );
    expect(sdk.chat.requestPayload.add).toHaveBeenCalledExactlyOnceWith(
      PLUGIN_ID,
      markChatRequest,
      { id: "yance-ask-user-question:ui-ready" },
    );
    expect(sdk.menu.add).not.toHaveBeenCalled();
    expect(sdk.route.add).not.toHaveBeenCalled();
    expect(sdk.host.fetch).not.toHaveBeenCalled();
    registration.dispose();
    registration.dispose();
    expect(rendererDispose).toHaveBeenCalledOnce();
    expect(transformDispose).toHaveBeenCalledOnce();
  });

  it("works without menu or route APIs and does not read or modify agent configuration", () => {
    expect(window.QwenPaw).not.toHaveProperty("menu");
    expect(window.QwenPaw).not.toHaveProperty("route");
    const registration = registerPlugin(window.QwenPaw);
    expect(window.QwenPaw.chat.approval.render).toHaveBeenCalledOnce();
    expect(window.QwenPaw.chat.requestPayload.add).toHaveBeenCalledOnce();
    expect(window.QwenPaw.host.fetch).not.toHaveBeenCalled();
    registration.dispose();
  });

  it("merges only the request context marker without mutating another plugin's payload", () => {
    const context = Object.freeze({
      source: "console",
      custom: { keep: true },
      yance_ask_user_question_ui: false,
    });
    const payload = Object.freeze({
      query: "hello",
      request_context: context,
      attachments: ["file"],
    });
    expect(
      markChatRequest({
        payload,
        selectedAgent: "agent",
        sessionId: "session",
      }),
    ).toEqual({
      query: "hello",
      attachments: ["file"],
      request_context: {
        source: "console",
        custom: { keep: true },
        yance_ask_user_question_ui: "1",
      },
    });
    expect(context.yance_ask_user_question_ui).toBe(false);
  });

  it.each([undefined, null, "bad context", []])(
    "adds the marker safely when request_context is %s",
    (context) => {
      expect(
        markChatRequest({
          payload: { request_context: context },
          selectedAgent: "agent",
          sessionId: "session",
        }),
      ).toEqual({ request_context: { yance_ask_user_question_ui: "1" } });
    },
  );

  it("rolls back the renderer if request transform registration fails", () => {
    const dispose = vi.fn();
    vi.mocked(window.QwenPaw.chat.approval.render).mockReturnValue({ dispose });
    vi.mocked(window.QwenPaw.chat.requestPayload.add).mockImplementation(() => {
      throw new Error("host failed");
    });
    expect(() => registerPlugin(window.QwenPaw)).toThrow("host failed");
    expect(dispose).toHaveBeenCalledOnce();
  });
});
