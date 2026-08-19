import { useCallback, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Expanded artifact view: a near-fullscreen dialog whose inner viewport is
 * freely resizable (native CSS resize grip) with device-width presets and a
 * live px readout — a small responsive test bench for generated pages.
 *
 * The viewport box is sized imperatively (element style), never through
 * React state: the browser's native resize drag mutates the element style
 * directly, and a re-rendering style prop would fight it. The px readout is
 * likewise written via ref so drag ticks cause zero re-renders.
 */
const PRESETS: Array<{ label: string; width: number; height?: number }> = [
  { label: "Mobile", width: 390, height: 700 },
  { label: "Tablet", width: 768, height: 1024 },
  { label: "Desktop", width: 1280 },
];

export function ArtifactExpandDialog({
  open,
  onOpenChange,
  path,
  content,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  path: string;
  content: string | null;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  // Callback ref: the dialog portals/animates its content in, so a mount
  // effect can run before the node exists. This attaches whenever the node
  // actually appears and detaches when it goes away.
  const observeBox = useCallback((node: HTMLDivElement | null) => {
    boxRef.current = node;
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && readoutRef.current) {
        readoutRef.current.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
      }
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  function applyPreset(width: number, height?: number) {
    const box = boxRef.current;
    if (!box) return;
    box.style.width = `${width}px`;
    box.style.height = height ? `${height}px` : "100%";
  }

  function applyFill() {
    const box = boxRef.current;
    if (!box) return;
    box.style.width = "100%";
    box.style.height = "100%";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex h-[92vh] w-[94vw] max-w-none flex-col gap-0 p-0"
      >
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border pl-4 pr-12">
          <DialogTitle className="min-w-0 flex-1 truncate text-sm font-medium">
            {path.replace(/^artifacts\//, "")}
          </DialogTitle>
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => applyPreset(p.width, p.height)}
            >
              {p.label}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={applyFill}
          >
            Fill
          </Button>
          <span
            ref={readoutRef}
            className="w-24 text-right text-xs tabular-nums text-muted-foreground"
          />
        </div>
        <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-muted/40 p-4">
          <div
            ref={observeBox}
            // Native resize grip (bottom-right). overflow-auto is required
            // for the grip; the iframe fills the box.
            className="max-w-full resize overflow-auto rounded-lg border border-border bg-white shadow-sm"
            style={{ width: "100%", height: "100%" }}
          >
            {content !== null && (
              <iframe
                // Security invariant: sandbox stays exactly "allow-scripts",
                // matching the preview panel. No allow-same-origin.
                sandbox="allow-scripts"
                srcDoc={content}
                title={path}
                className="h-full w-full border-0 bg-white"
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
