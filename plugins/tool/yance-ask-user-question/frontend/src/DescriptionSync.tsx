import type * as ReactNS from "react";
import manifest from "../../plugin.json";
import { translate, type MessageKey } from "./locale";
import {
  DescriptionSyncError,
  readDescription,
  syncChineseDescription,
  type DescriptionSnapshot,
} from "./sync-api";

const React: typeof ReactNS = window.QwenPaw.host.React;

export function DescriptionSync() {
  const agent = window.QwenPaw.host.useSelectedAgent();
  return <AgentDescriptionSync key={agent.id} agentId={agent.id} />;
}

function AgentDescriptionSync({ agentId }: { agentId: string }) {
  const host = window.QwenPaw.host;
  const { Button, theme } = host.antd;
  const { token } = theme.useToken();
  const locale = host.useLocale();
  const t = (key: MessageKey) => translate(locale, key);
  const [snapshot, setSnapshot] = React.useState<DescriptionSnapshot | null>(
    null,
  );
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [notice, setNotice] = React.useState<MessageKey | null>(null);
  const [failed, setFailed] = React.useState(false);
  const flight = React.useRef(false);
  const controller = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    void load(abort.signal);
    return () => abort.abort();
  }, [agentId]);

  function showError(error: unknown) {
    setFailed(true);
    setNotice(
      error instanceof DescriptionSyncError
        ? error.messageKey
        : "syncReadError",
    );
  }

  async function load(signal: AbortSignal) {
    setLoading(true);
    setNotice(null);
    try {
      const result = await readDescription(agentId, signal);
      if (!signal.aborted) setSnapshot(result);
    } catch (error) {
      if (!signal.aborted) {
        setSnapshot(null);
        showError(error);
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }

  async function synchronize() {
    const signal = controller.current?.signal;
    if (!snapshot || !signal || signal.aborted || flight.current) return;
    flight.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const result = await syncChineseDescription(snapshot, signal);
      if (!signal.aborted) {
        setSnapshot(result);
        setFailed(false);
        setNotice("syncSuccess");
      }
    } catch (error) {
      if (
        !signal.aborted &&
        error instanceof DescriptionSyncError &&
        error.messageKey === "syncChanged"
      ) {
        try {
          const current = await readDescription(agentId, signal);
          if (!signal.aborted) setSnapshot(current);
        } catch {
          if (!signal.aborted) setSnapshot(null);
        }
      }
      if (!signal.aborted) showError(error);
    } finally {
      flight.current = false;
      if (!signal.aborted) setBusy(false);
    }
  }

  const description = snapshot?.currentDescription ?? "";
  const same = !!snapshot && description === snapshot.targetDescription;
  const panel: ReactNS.CSSProperties = {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    margin: "8px 0 20px",
    padding: 16,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: 8,
    background: token.colorBgContainer,
    maxHeight: 240,
    overflow: "auto",
  };

  return (
    <section
      aria-busy={loading || busy}
      style={{
        maxWidth: 800,
        padding: 24,
        margin: "0 auto",
        color: token.colorText,
      }}
    >
      <p>{manifest.name}</p>
      <p role="note">{t("syncCaution")}</p>
      <p>
        <strong>{t("agent")}: </strong>
        {agentId}
      </p>
      <h2>{t("syncCurrent")}</h2>
      <pre style={panel}>{loading ? t("syncLoading") : description}</pre>
      <h2>{t("syncTarget")}</h2>
      <pre style={panel}>{snapshot?.targetDescription ?? ""}</pre>
      {same && !notice ? <p role="status">{t("syncAlready")}</p> : null}
      {notice ? <p role={failed ? "alert" : "status"}>{t(notice)}</p> : null}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Button
          type="primary"
          disabled={loading || busy || !snapshot || same}
          loading={busy}
          onClick={() => void synchronize()}
        >
          {t("syncAction")}
        </Button>
        <Button
          disabled={loading || busy}
          onClick={() => {
            const signal = controller.current?.signal;
            if (signal && !signal.aborted) void load(signal);
          }}
        >
          {t("syncRefresh")}
        </Button>
      </div>
    </section>
  );
}
