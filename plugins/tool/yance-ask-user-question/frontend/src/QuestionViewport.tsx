import type * as ReactNS from "react";

const React: typeof ReactNS = window.QwenPaw.host.React;
const EDGE_SPACE = 12;

export interface QuestionBounds {
  maxHeight: number;
  offsetY: number;
}

/** Use the rendered anchor, not an assumed host bottom offset. */
export function questionBounds(
  anchorBottom: number,
  viewportTop: number,
  viewportHeight: number,
  scaleY = 1,
): QuestionBounds {
  const scale = Number.isFinite(scaleY) && scaleY > 0 ? scaleY : 1;
  const height = Math.max(0, viewportHeight);
  const edge = Math.min(EDGE_SPACE, height / 2);
  const upper = viewportTop + edge;
  const lower = viewportTop + height - edge;
  const bottom = anchorBottom > upper ? Math.min(anchorBottom, lower) : lower;
  return {
    maxHeight: Math.max(0, Math.floor((bottom - upper) / scale)),
    offsetY: Math.round((bottom - anchorBottom) / scale),
  };
}

/** All measurement, positioning and cleanup belong to this renderer. */
export function QuestionViewport({
  children,
}: {
  children: ReactNS.ReactNode;
}) {
  const frame = React.useRef<HTMLDivElement>(null);
  const anchor = React.useRef<HTMLSpanElement>(null);
  const [bounds, setBounds] = React.useState<QuestionBounds | null>(null);

  React.useLayoutEffect(() => {
    const element = frame.current;
    const point = anchor.current;
    if (!element || !point) return;
    let animationFrame: number | null = null;
    let disposed = false;
    const viewport = window.visualViewport;

    const measure = () => {
      if (disposed) return;
      const anchorRect = point.getBoundingClientRect();
      const next = questionBounds(
        anchorRect.bottom,
        viewport?.offsetTop ?? 0,
        viewport?.height ?? window.innerHeight,
        anchorRect.height,
      );
      setBounds((current) =>
        current?.maxHeight === next.maxHeight &&
        current.offsetY === next.offsetY
          ? current
          : next,
      );
    };
    const schedule = () => {
      if (disposed || animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        measure();
      });
    };

    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(schedule);
    observer?.observe(element);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    return () => {
      disposed = true;
      observer?.disconnect();
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
    };
  }, []);

  const style = {
    visibility: bounds ? "visible" : "hidden",
    "--yance-auq-max-height": bounds ? `${bounds.maxHeight}px` : "100dvh",
    "--yance-auq-offset-y": bounds ? `${bounds.offsetY}px` : "0px",
  } as ReactNS.CSSProperties;

  return (
    <div ref={frame} className="yance-auq-frame" style={style}>
      <div className="yance-auq-surface">{children}</div>
      <span ref={anchor} className="yance-auq-anchor" aria-hidden="true" />
    </div>
  );
}
