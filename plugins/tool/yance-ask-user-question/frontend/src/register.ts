import { QuestionCard } from "./QuestionCard";
import { DescriptionSync } from "./DescriptionSync";
import { translate } from "./locale";
import type {
  ChatRequestPayloadTransform,
  Disposable,
  QwenPawWindowNamespace,
} from "./qwenpaw-host";

export const PLUGIN_ID = "yance-ask-user-question";
export const SOURCE_TYPE = "yance_ask_user_question";
export const UI_MARKER_KEY = "yance_ask_user_question_ui";
export const SETTINGS_ID = `${PLUGIN_ID}:settings`;
export const SETTINGS_PATH = `/plugins/${PLUGIN_ID}`;

function SettingsLabel() {
  return translate(window.QwenPaw.host.useLocale(), "syncSettings");
}

export const markChatRequest: ChatRequestPayloadTransform = ({ payload }) => {
  const context = payload.request_context;
  return {
    ...payload,
    request_context: {
      ...(context && typeof context === "object" && !Array.isArray(context)
        ? context
        : {}),
      [UI_MARKER_KEY]: "1",
    },
  };
};

export function registerPlugin(sdk: QwenPawWindowNamespace): Disposable {
  const disposables: Disposable[] = [];
  let disposed = false;
  const registration = {
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const item of disposables.reverse()) item.dispose();
    },
  };
  try {
    disposables.push(
      sdk.chat.approval.render(PLUGIN_ID, SOURCE_TYPE, QuestionCard),
    );
    disposables.push(
      sdk.chat.requestPayload.add(PLUGIN_ID, markChatRequest, {
        id: `${PLUGIN_ID}:ui-ready`,
      }),
    );
    disposables.push(
      sdk.route.add(PLUGIN_ID, {
        id: SETTINGS_ID,
        path: SETTINGS_PATH,
        component: DescriptionSync,
        meta: {
          domain: "settings",
          title: (locale) => translate(locale, "syncSettings"),
          scope: "agent",
          layout: "standard",
          navigation: "settings",
        },
      }),
    );
    disposables.push(
      sdk.menu.add(PLUGIN_ID, {
        id: SETTINGS_ID,
        location: "primary.settings",
        label: () => sdk.host.React.createElement(SettingsLabel),
        route: SETTINGS_ID,
      }),
    );
  } catch (error) {
    registration.dispose();
    throw error;
  }
  return registration;
}
