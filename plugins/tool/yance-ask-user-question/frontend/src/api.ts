import type { Answer } from "./questions";
import type { ChatApprovalData } from "./qwenpaw-host";

export class SubmissionError extends Error {
  constructor(public readonly status: number) {
    super(`Question submission failed (${status})`);
  }
}

export async function sendDecision(
  approval: ChatApprovalData,
  decision: "answer" | "deny",
  answers: Answer[],
): Promise<void> {
  const response = await window.QwenPaw.host.fetch(
    "/yance-ask-user-question/answer",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Agent-Id": approval.agentId,
      },
      body: JSON.stringify({
        request_id: approval.requestId,
        session_id: approval.rootSessionId || approval.sessionId,
        decision,
        answers,
      }),
    },
  );
  if (!response.ok) throw new SubmissionError(response.status);
  const result: unknown = await response.json();
  if (
    !result ||
    typeof result !== "object" ||
    !("resolved" in result) ||
    result.resolved !== true
  )
    throw new SubmissionError(0);
}
