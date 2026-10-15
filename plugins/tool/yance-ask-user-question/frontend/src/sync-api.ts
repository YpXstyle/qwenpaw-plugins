import type { MessageKey } from "./locale";

const SYNC_PATH = "/yance-ask-user-question/description-sync";

export interface DescriptionSnapshot {
  agentId: string;
  currentDescription: string;
  targetDescription: string;
}

export class DescriptionSyncError extends Error {
  constructor(public readonly messageKey: MessageKey) {
    super(messageKey);
  }
}

function ensureCurrent(agentId: string, signal: AbortSignal): void {
  if (signal.aborted || window.QwenPaw.host.getSelectedAgentId() !== agentId)
    throw new DescriptionSyncError("syncAgentChanged");
}

async function requestDescription(
  agentId: string,
  signal: AbortSignal,
  expectedDescription?: string,
): Promise<DescriptionSnapshot> {
  const writing = expectedDescription !== undefined;
  ensureCurrent(agentId, signal);
  try {
    const response = await window.QwenPaw.host.fetch(
      writing
        ? SYNC_PATH
        : `${SYNC_PATH}?agent_id=${encodeURIComponent(agentId)}`,
      {
        signal,
        ...(writing
          ? {
              method: "POST",
              body: JSON.stringify({
                agent_id: agentId,
                expected_description: expectedDescription,
              }),
            }
          : {}),
        headers: {
          "X-Agent-Id": agentId,
          ...(writing ? { "Content-Type": "application/json" } : {}),
        },
      },
    );
    ensureCurrent(agentId, signal);
    if (response.status === 401 || response.status === 403)
      throw new DescriptionSyncError("syncAuthError");
    if (response.status === 404)
      throw new DescriptionSyncError("syncMissingTool");
    if (response.status === 409) throw new DescriptionSyncError("syncChanged");
    if (!response.ok)
      throw new DescriptionSyncError(
        writing ? "syncWriteError" : "syncReadError",
      );
    const result: unknown = await response.json();
    ensureCurrent(agentId, signal);
    if (
      !result ||
      typeof result !== "object" ||
      !("agent_id" in result) ||
      result.agent_id !== agentId ||
      !("current_description" in result) ||
      typeof result.current_description !== "string" ||
      !("target_description" in result) ||
      typeof result.target_description !== "string" ||
      !result.target_description.trim()
    )
      throw new DescriptionSyncError(
        writing ? "syncVerifyError" : "syncReadError",
      );
    return {
      agentId,
      currentDescription: result.current_description,
      targetDescription: result.target_description,
    };
  } catch (error) {
    ensureCurrent(agentId, signal);
    if (error instanceof DescriptionSyncError) throw error;
    throw new DescriptionSyncError(
      writing ? "syncWriteError" : "syncReadError",
    );
  }
}

export function readDescription(
  agentId: string,
  signal: AbortSignal,
): Promise<DescriptionSnapshot> {
  return requestDescription(agentId, signal);
}

/** Explicit action through the plugin's description-only transaction route. */
export async function syncChineseDescription(
  snapshot: DescriptionSnapshot,
  signal: AbortSignal,
): Promise<DescriptionSnapshot> {
  const agentId = snapshot.agentId;
  ensureCurrent(agentId, signal);
  const saved = await requestDescription(
    agentId,
    signal,
    snapshot.currentDescription,
  );
  ensureCurrent(agentId, signal);
  try {
    const verified = await readDescription(agentId, signal);
    ensureCurrent(agentId, signal);
    if (
      verified.currentDescription !== saved.targetDescription ||
      verified.targetDescription !== saved.targetDescription
    )
      throw new DescriptionSyncError("syncVerifyError");
    return verified;
  } catch (error) {
    ensureCurrent(agentId, signal);
    if (
      error instanceof DescriptionSyncError &&
      error.messageKey === "syncAuthError"
    )
      throw error;
    throw new DescriptionSyncError("syncVerifyError");
  }
}
