import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  markChatRequest,
  PLUGIN_ID,
  registerPlugin,
  SOURCE_TYPE,
  SETTINGS_ID,
  SETTINGS_PATH,
} from "../src/register";
import manifest from "../../plugin.json";
import { DescriptionSync } from "../src/DescriptionSync";
import { messages } from "../src/locale";

describe("public host registrations", () => {
  it("uses the author's manifest identity and namespaced source", () => {
    expect(PLUGIN_ID).toBe("yance-ask-user-question");
    expect(PLUGIN_ID).toBe(manifest.id);
    expect(SOURCE_TYPE).toBe("yance_ask_user_question");
    expect(SOURCE_TYPE).toBe(manifest.meta.tool_name);
  });
  it("registers only the plugin source and disposes every registration once", () => {
    const sdk = window.QwenPaw;
    const rendererDispose = vi.fn();
    const transformDispose = vi.fn();
    const menuDispose = vi.fn();
    const routeDispose = vi.fn();
    vi.mocked(sdk.chat.approval.render).mockReturnValue({
      dispose: rendererDispose,
    });
    vi.mocked(sdk.chat.requestPayload.add).mockReturnValue({
      dispose: transformDispose,
    });
    vi.mocked(sdk.menu.add).mockReturnValue({ dispose: menuDispose });
    vi.mocked(sdk.route.add).mockReturnValue({ dispose: routeDispose });
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
    registration.dispose();
    registration.dispose();
    expect(rendererDispose).toHaveBeenCalledOnce();
    expect(transformDispose).toHaveBeenCalledOnce();
    expect(menuDispose).toHaveBeenCalledOnce();
    expect(routeDispose).toHaveBeenCalledOnce();
  });

  it.each(Object.keys(messages))(
    "registers a namespaced public settings menu and route in %s",
    (locale) => {
      const sdk = window.QwenPaw;
      vi.mocked(sdk.host.useLocale).mockReturnValue(locale);
      registerPlugin(sdk);
      expect(sdk.route.add).toHaveBeenCalledExactlyOnceWith(PLUGIN_ID, {
        id: SETTINGS_ID,
        path: SETTINGS_PATH,
        component: DescriptionSync,
        meta: {
          domain: "settings",
          title: expect.any(Function),
          scope: "agent",
          layout: "standard",
          navigation: "settings",
        },
      });
      const menu = vi.mocked(sdk.menu.add).mock.calls[0][1];
      expect(menu).toEqual({
        id: SETTINGS_ID,
        route: SETTINGS_ID,
        location: "primary.settings",
        label: expect.any(Function),
      });
      expect(SETTINGS_ID).toBe("yance-ask-user-question:settings");
      expect(SETTINGS_PATH).toBe("/plugins/yance-ask-user-question");
      if (typeof menu.label !== "function") throw new Error("Missing label");
      render(menu.label());
      expect(screen.getByText(messages[locale].syncSettings)).toBeVisible();
      const title = vi.mocked(sdk.route.add).mock.calls[0][1].meta!.title;
      expect(typeof title === "function" ? title(locale) : title).toBe(
        messages[locale].syncSettings,
      );
      expect(sdk.host.fetch).not.toHaveBeenCalled();
    },
  );

  it("removes earlier registrations if adding the settings menu fails", () => {
    const disposes = [vi.fn(), vi.fn(), vi.fn()];
    vi.mocked(window.QwenPaw.chat.approval.render).mockReturnValue({
      dispose: disposes[0],
    });
    vi.mocked(window.QwenPaw.chat.requestPayload.add).mockReturnValue({
      dispose: disposes[1],
    });
    vi.mocked(window.QwenPaw.route.add).mockReturnValue({
      dispose: disposes[2],
    });
    vi.mocked(window.QwenPaw.menu.add).mockImplementation(() => {
      throw new Error("menu failed");
    });
    expect(() => registerPlugin(window.QwenPaw)).toThrow("menu failed");
    for (const dispose of disposes) expect(dispose).toHaveBeenCalledOnce();
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
