/**
 * Public SDK subset from console/src/plugins/types/qwenpaw.d.ts and
 * registry/sdk.ts + registry/types.ts at QwenPaw 2.2.2 (5c56644a).
 * Declared globally as directed by the official public SDK. No host-private
 * component or vendor SDK types are imported.
 */
import type * as React from "react";

export interface Disposable {
  dispose(): void;
}

export interface ChatApprovalData {
  requestId: string;
  sessionId: string;
  rootSessionId?: string;
  agentId: string;
  toolName: string;
  severity: string;
  findingsCount: number;
  findingsSummary: string;
  toolParams: Record<string, unknown>;
  createdAt: number;
  timeoutSeconds: number;
  sourceType: string;
}

export interface ChatApprovalRendererProps {
  approval: ChatApprovalData;
  onResolved: () => void;
}

export type ChatRequestPayloadTransform = (ctx: {
  payload: Record<string, unknown>;
  sessionId: string;
  selectedAgent: string;
}) => Record<string, unknown> | void;

export interface QwenPawWindowNamespace {
  host: {
    React: typeof React;
    // The public SDK exposes Ant Design and its icons as shared, opaque values.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    antd: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    antdIcons: any;
    useLocale(): string;
    useTheme(): "light" | "dark";
    getSelectedAgentId(): string;
    getCurrentSessionId(): string | null;
    fetch(path: string, init?: RequestInit): Promise<Response>;
  };
  chat: {
    approval: {
      render(
        pluginId: string,
        sourceType: string,
        render: React.FC<ChatApprovalRendererProps>,
      ): Disposable;
    };
    requestPayload: {
      add(
        pluginId: string,
        fn: ChatRequestPayloadTransform,
        opts?: { id?: string; order?: number },
      ): Disposable;
    };
  };
}

declare global {
  interface Window {
    QwenPaw: QwenPawWindowNamespace;
  }
}
