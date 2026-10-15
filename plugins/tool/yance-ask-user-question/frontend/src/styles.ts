/** Scoped CSS travels in the single JS entry; React removes it on unmount. */
export const CARD_STYLES = `
.yance-auq-frame { position: relative; width: 100%; max-width: 480px; min-width: 0; }
.yance-auq-surface { transform: translateY(var(--yance-auq-offset-y, 0px)); }
.yance-auq-anchor { position: absolute; bottom: 0; right: 0; width: 1px; height: 1px; visibility: hidden; pointer-events: none; }
.yance-auq-card {
  width: 100%;
  max-width: 480px;
  box-sizing: border-box;
  max-height: var(--yance-auq-max-height, 100dvh);
  overflow: hidden;
  background: var(--app-surface-raised, var(--yance-auq-surface-raised));
  color: var(--app-text, var(--yance-auq-text));
  border: 1px solid var(--app-border, var(--yance-auq-border));
  border-radius: 12px;
  box-shadow: var(--app-shadow-sm, var(--yance-auq-shadow));
  transition: background-color .3s, color .3s, border-color .3s, box-shadow .3s;
  animation: yance-auq-fade-in .4s cubic-bezier(.16, 1, .3, 1);
}
.yance-auq-card:hover { box-shadow: var(--app-shadow-md, var(--yance-auq-shadow-hover)); }
.yance-auq-card > .yance-auq-body {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 16px 20px;
  max-height: max(0px, calc(var(--yance-auq-max-height, 100dvh) - 2px));
  min-height: 0;
  overflow: hidden;
}
.yance-auq-card .yance-auq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--app-border-subtle, var(--yance-auq-border-subtle));
}
.yance-auq-card .yance-auq-title-row { display: flex; flex: 1; min-width: 0; gap: 8px; align-items: center; flex-wrap: wrap; }
.yance-auq-card .yance-auq-icon { color: var(--app-accent, var(--yance-auq-accent)); font-size: 16px; }
.yance-auq-card .yance-auq-title { font-size: 14px; font-weight: 600; color: var(--app-text, var(--yance-auq-text)); }
.yance-auq-card .yance-auq-progress { font-size: 12px; color: var(--app-text-secondary, var(--yance-auq-text-secondary)); white-space: nowrap; }
.yance-auq-card .yance-auq-timer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  border-radius: 14px;
  padding: 2px 10px;
  background: var(--app-fill-subtle, var(--yance-auq-fill));
  color: var(--app-text-secondary, var(--yance-auq-text-secondary));
  font: 500 12px "SF Mono", Monaco, Consolas, monospace;
}
.yance-auq-card .yance-auq-timer-icon { font-size: 14px; color: var(--app-text-tertiary, var(--yance-auq-text-tertiary)); }
.yance-auq-card .yance-auq-content { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow-y: auto; gap: 8px; margin-bottom: 14px; }
.yance-auq-card .yance-auq-content > * { flex-shrink: 0; }
.yance-auq-card .yance-auq-question { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.yance-auq-card .yance-auq-question-head { display: flex; align-items: flex-start; gap: 6px; min-width: 0; }
.yance-auq-card .yance-auq-header-tag { flex-shrink: 0; }
.yance-auq-card .yance-auq-question-title { min-width: 0; overflow-wrap: anywhere; white-space: pre-wrap; font-weight: 600; line-height: 1.5; outline-offset: 3px; }
.yance-auq-card .yance-auq-panel {
  margin: 0;
  padding: 10px 12px;
  background: var(--app-surface, var(--yance-auq-surface));
  border: 1px solid var(--app-border-subtle, var(--yance-auq-border-subtle));
  border-radius: 4px;
  color: var(--app-text-secondary, var(--yance-auq-text-secondary));
  font: 11px/1.6 "SF Mono", Monaco, Consolas, monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 200px;
  overflow: auto;
}
.yance-auq-card .yance-auq-options { display: flex; flex-direction: column; gap: 6px; max-width: 420px; }
.yance-auq-card .yance-auq-option { display: flex; flex-direction: column; align-items: flex-start; height: auto; padding: 6px 10px; white-space: normal; text-align: left; }
.yance-auq-card .yance-auq-option-recommended[aria-pressed="false"]:not(:disabled) {
  border-color: var(--app-success-border, var(--yance-auq-success-border)) !important;
  background-color: var(--app-success-bg, var(--yance-auq-success-bg)) !important;
}
.yance-auq-card .yance-auq-option-recommended[aria-pressed="false"]:hover:not(:disabled) {
  border-color: var(--app-success, var(--yance-auq-success)) !important;
}
.yance-auq-card .yance-auq-option-label { max-width: 100%; overflow-wrap: anywhere; font-weight: 600; line-height: 1.4; }
.yance-auq-card .yance-auq-recommended { margin-inline-start: 6px; margin-inline-end: 0; font-size: 11px; font-weight: 500; line-height: 18px; }
.yance-auq-card .yance-auq-recommended-icon { font-size: 10px; }
.yance-auq-card .yance-auq-option-description { max-width: 100%; overflow-wrap: anywhere; font-size: 11px; line-height: 1.4; opacity: .75; }
.yance-auq-card .yance-auq-other { max-width: 420px; }
.yance-auq-card .yance-auq-info-row { display: flex; align-items: center; gap: 8px; }
.yance-auq-card .yance-auq-label { min-width: 56px; flex-shrink: 0; font-size: 12px; font-weight: 400; color: var(--app-text-tertiary, var(--yance-auq-text-tertiary)); }
.yance-auq-card .yance-auq-value { min-width: 0; font-size: 13px; font-weight: 500; color: var(--app-text, var(--yance-auq-text)); overflow-wrap: anywhere; }
.yance-auq-card .yance-auq-code { background: var(--app-surface-subtle, var(--yance-auq-fill)); border: 1px solid var(--app-border, var(--yance-auq-border)); border-radius: 4px; padding: 1px 8px; font: 12px "SF Mono", Monaco, Consolas, monospace; overflow-wrap: anywhere; }
.yance-auq-card .yance-auq-details { margin-top: 4px; padding: 10px 14px; border: 1px solid var(--app-border-subtle, var(--yance-auq-border-subtle)); border-radius: 6px; background: var(--app-surface-subtle, var(--yance-auq-fill)); }
.yance-auq-card .yance-auq-details > summary { cursor: pointer; font-size: 12px; font-weight: 500; color: var(--app-text-secondary, var(--yance-auq-text-secondary)); overflow-wrap: anywhere; }
.yance-auq-card .yance-auq-details[open] > summary { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--app-border-subtle, var(--yance-auq-border-subtle)); }
.yance-auq-card .yance-auq-details-text { margin: 8px 0; color: var(--app-text-secondary, var(--yance-auq-text-secondary)); font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.yance-auq-card .yance-auq-details a { color: var(--app-accent, var(--yance-auq-accent)); }
.yance-auq-card .yance-auq-error { margin: 0; font-size: 12px; color: var(--app-error-text, var(--yance-auq-error)); }
.yance-auq-card .yance-auq-actions { display: flex; flex-shrink: 0; justify-content: flex-end; align-items: center; gap: 8px; padding-top: 8px; border-top: 1px solid var(--app-border-subtle, var(--yance-auq-border-subtle)); }
.yance-auq-card .yance-auq-actions button { display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-width: 88px; height: 36px; padding: 0 20px; border-radius: 8px; font-size: 13px; font-weight: 500; }
.yance-auq-card .yance-auq-actions .yance-auq-deny { margin-right: auto; background: transparent; border: 1.5px solid var(--app-border-strong, var(--yance-auq-border)); color: var(--app-text-secondary, var(--yance-auq-text-secondary)); box-shadow: none; }
.yance-auq-card .yance-auq-actions .yance-auq-deny:hover:not(:disabled) { border-color: var(--app-error-border, var(--yance-auq-error)); color: var(--app-error-text, var(--yance-auq-error)); background: var(--app-error-bg, var(--yance-auq-error-bg)); }
.yance-auq-card .yance-auq-submit:not(:disabled) { background: linear-gradient(135deg, var(--app-accent, var(--yance-auq-accent)), var(--app-accent-active, var(--yance-auq-accent-active))); border: none; color: var(--app-text-inverse, var(--yance-auq-text-inverse)); }
.yance-auq-card .yance-auq-navigation { display: flex; align-items: center; gap: 8px; }
@keyframes yance-auq-fade-in { from { opacity: 0; } to { opacity: 1; } }
@media (max-width: 768px) {
  .yance-auq-card { border-radius: 10px; }
  .yance-auq-card > .yance-auq-body { padding: 14px 16px; }
  .yance-auq-card .yance-auq-header { margin-bottom: 12px; padding-bottom: 10px; }
  .yance-auq-card .yance-auq-content { gap: 6px; margin-bottom: 12px; }
  .yance-auq-card .yance-auq-label { min-width: 48px; }
  .yance-auq-card .yance-auq-actions { flex-direction: column; align-items: stretch; }
  .yance-auq-card .yance-auq-actions .yance-auq-deny { margin-right: 0; order: 3; width: 100%; min-height: 44px; }
  .yance-auq-card .yance-auq-navigation { width: 100%; order: 1; }
  .yance-auq-card .yance-auq-navigation button { flex: 1; width: auto; min-width: 0; height: auto; min-height: 44px; white-space: normal; overflow-wrap: anywhere; }
}
@media (prefers-reduced-motion: reduce) { .yance-auq-card { animation: none; transition: none; } }
`;
