import React from "react";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import type { QwenPawWindowNamespace } from "../src/qwenpaw-host";

function Button({
  children,
  icon,
  type: _type,
  danger: _danger,
  loading: _loading,
  block: _block,
  size: _size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
  danger?: boolean;
  loading?: boolean;
  block?: boolean;
  size?: string;
}) {
  return (
    <button type="button" data-variant={_type ?? "default"} {...props}>
      {icon}
      {children}
    </button>
  );
}

export const testTokens = {
  colorBgElevated: "#ffffff",
  colorBgContainer: "#fafafa",
  colorBorder: "#dddddd",
  colorBorderSecondary: "#eeeeee",
  colorFillQuaternary: "#f5f5f5",
  colorText: "#111111",
  colorTextSecondary: "#555555",
  colorTextTertiary: "#888888",
  colorTextLightSolid: "#ffffff",
  colorPrimary: "#ff7f16",
  colorPrimaryActive: "#cc6611",
  colorErrorText: "#cf1322",
  colorErrorBg: "#fff1f0",
  colorSuccessBorder: "#b7eb8f",
  colorSuccessBg: "#f6ffed",
  colorSuccess: "#52c41a",
  boxShadowTertiary: "0 2px 8px #00000011",
  boxShadowSecondary: "0 4px 12px #00000022",
};

function installTestHost() {
  window.QwenPaw = {
    host: {
      React,
      antd: {
        Card: ({
          children,
          className,
          bordered: _bordered,
          classNames,
          ...props
        }: React.HTMLAttributes<HTMLElement> & {
          bordered?: boolean;
          classNames?: { body?: string };
        }) => (
          <section className={"qwenpaw-card " + className} {...props}>
            <div className={"qwenpaw-card-body " + (classNames?.body ?? "")}>
              {children}
            </div>
          </section>
        ),
        Button,
        Tag: ({
          children,
          color,
          className,
          icon,
          ...props
        }: React.HTMLAttributes<HTMLSpanElement> & {
          color?: string;
          icon?: React.ReactNode;
        }) => (
          <span
            {...props}
            className={"qwenpaw-tag " + (className ?? "")}
            data-color={color}
          >
            {icon}
            {children}
          </span>
        ),
        Input: ({
          size: _size,
          ...props
        }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
          size?: string;
        }) => <input {...props} />,
        theme: { useToken: vi.fn(() => ({ token: testTokens })) },
      },
      antdIcons: {
        LeftOutlined: () => <span aria-hidden="true">←</span>,
        RightOutlined: () => <span aria-hidden="true">→</span>,
        InfoCircleOutlined: (props: React.HTMLAttributes<HTMLSpanElement>) => (
          <span {...props}>ⓘ</span>
        ),
        ClockCircleOutlined: (props: React.HTMLAttributes<HTMLSpanElement>) => (
          <span {...props}>◷</span>
        ),
        CloseOutlined: () => <span aria-hidden="true">×</span>,
        CheckOutlined: () => <span aria-hidden="true">✓</span>,
        StarFilled: (props: React.HTMLAttributes<HTMLSpanElement>) => (
          <span {...props}>
            <svg viewBox="0 0 16 16" focusable="false">
              <path d="M8 1l2 4 5 .7-3.5 3.4.8 4.9L8 11.7 3.7 14l.8-4.9L1 5.7 6 5z" />
            </svg>
          </span>
        ),
      },
      useLocale: vi.fn(() => "en"),
      useTheme: vi.fn(() => "light" as const),
      getSelectedAgentId: vi.fn(() => "currently-selected-agent"),
      getCurrentSessionId: vi.fn(() => "currently-selected-session"),
      fetch: vi.fn(
        async () =>
          new Response(JSON.stringify({ resolved: true }), { status: 200 }),
      ),
    },
    chat: {
      approval: { render: vi.fn(() => ({ dispose: vi.fn() })) },
      requestPayload: { add: vi.fn(() => ({ dispose: vi.fn() })) },
    },
  } satisfies QwenPawWindowNamespace;
}

installTestHost();
beforeEach(installTestHost);
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
