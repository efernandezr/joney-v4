// tests/artifact-preview-panel.test.tsx
// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const readClientAppStateMock = vi.fn(async () => ({
  resourceId: "res-1",
  path: "artifacts/test.html",
  threadId: "t-1",
}));

vi.mock("@agent-native/core/client/application-state", () => ({
  readClientAppState: (...args: unknown[]) => readClientAppStateMock(...args),
  setClientAppState: vi.fn(async () => null),
}));

const useResourceMock = vi.fn();
vi.mock("@agent-native/core/client/resources", () => ({
  useResource: (id: string | null) => useResourceMock(id),
  useResources: () => ({ data: [] }),
  resourceDownloadUrl: (id: string) => `/download/${id}`,
}));

const useParamsMock = vi.fn(() => ({ threadId: "t-1" }) as Record<
  string,
  string | undefined
>);
vi.mock("react-router", () => ({ useParams: () => useParamsMock() }));

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

import { ArtifactPreviewPanel } from "../app/components/preview/ArtifactPreviewPanel";
import { useArtifactPreview } from "../app/components/preview/use-artifact-preview";

function renderPanel(scope: "chat" | "page" = "chat") {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <ArtifactPreviewPanel scope={scope} />
    </QueryClientProvider>,
  );
}

// A second, independent useArtifactPreview() consumer — mirrors how
// app/routes/artifacts.tsx holds its own hook instance (for `open`) while
// the mounted ArtifactPreviewPanel holds a separate instance (for
// `collapsed`). Used to prove collapsed/expand state is synchronized across
// instances rather than trapped in one component's local useState.
function ProbeOpen() {
  const { open } = useArtifactPreview();
  return (
    <button
      type="button"
      onClick={() =>
        void open({
          resourceId: "res-1",
          path: "artifacts/test.html",
          threadId: null,
        })
      }
    >
      probe-open
    </button>
  );
}

function renderPanelWithProbe(scope: "chat" | "page" = "page") {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <ArtifactPreviewPanel scope={scope} />
      <ProbeOpen />
    </QueryClientProvider>,
  );
}

describe("ArtifactPreviewPanel", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    // Clear call history (not implementations/return values) so a
    // waitFor(() => expect(mock).toHaveBeenCalledWith(...)) in one test can't
    // pass immediately on leftover calls recorded by a previous test.
    useResourceMock.mockClear();
    readClientAppStateMock.mockClear();
    useParamsMock.mockReset();
    useParamsMock.mockReturnValue({ threadId: "t-1" });
    window.localStorage.removeItem("artifact-preview-collapsed");
    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();
  });

  it("collapses to a reopen chip instead of disappearing", async () => {
    window.localStorage.setItem("artifact-preview-collapsed", "1");
    readClientAppStateMock.mockResolvedValueOnce({
      resourceId: "res-1",
      path: "artifacts/test.html",
      threadId: "t-1",
    });
    useResourceMock.mockReturnValue({
      data: {
        id: "res-1",
        path: "artifacts/test.html",
        content: "<html><body>hello</body></html>",
        mimeType: "text/html",
        size: 30,
      },
      isLoading: false,
      isError: false,
    });
    renderPanel("chat");
    const chip = await screen.findByRole("button", { name: /test\.html/ });
    expect(chip).toBeTruthy();
    expect(screen.queryByTitle("artifacts/test.html")).toBeNull();
  });

  it("expands from the chip on click", async () => {
    window.localStorage.setItem("artifact-preview-collapsed", "1");
    readClientAppStateMock.mockResolvedValueOnce({
      resourceId: "res-1",
      path: "artifacts/test.html",
      threadId: "t-1",
    });
    useResourceMock.mockReturnValue({
      data: {
        id: "res-1",
        path: "artifacts/test.html",
        content: "<html><body>hello</body></html>",
        mimeType: "text/html",
        size: 30,
      },
      isLoading: false,
      isError: false,
    });
    renderPanel("chat");
    const chip = await screen.findByRole("button", { name: /test\.html/ });
    chip.click();
    const iframe = (await screen.findByTitle(
      "artifacts/test.html",
    )) as HTMLIFrameElement;
    expect(iframe.getAttribute("srcdoc")).toContain("hello");
    expect(window.localStorage.getItem("artifact-preview-collapsed")).toBeNull();
  });

  it("expands the panel when a different hook instance calls open() (cross-instance sync)", async () => {
    // Regression: collapsed must not be trapped in one component's local
    // useState. The panel and the probe below each mount their own
    // useArtifactPreview() instance, just like ArtifactPreviewPanel and
    // app/routes/artifacts.tsx do in the real app.
    window.localStorage.setItem("artifact-preview-collapsed", "1");
    readClientAppStateMock.mockResolvedValueOnce({
      resourceId: "res-1",
      path: "artifacts/test.html",
      threadId: null,
    });
    useResourceMock.mockReturnValue({
      data: {
        id: "res-1",
        path: "artifacts/test.html",
        content: "<html><body>hello</body></html>",
        mimeType: "text/html",
        size: 30,
      },
      isLoading: false,
      isError: false,
    });
    renderPanelWithProbe("page");

    const chip = await screen.findByRole("button", { name: /test\.html/ });
    expect(chip).toBeTruthy();
    expect(screen.queryByTitle("artifacts/test.html")).toBeNull();

    screen.getByRole("button", { name: "probe-open" }).click();

    const iframe = (await screen.findByTitle(
      "artifacts/test.html",
    )) as HTMLIFrameElement;
    expect(iframe.getAttribute("srcdoc")).toContain("hello");
    expect(
      window.localStorage.getItem("artifact-preview-collapsed"),
    ).toBeNull();
  });

  it("renders the artifact in a sandboxed iframe without allow-same-origin", async () => {
    useResourceMock.mockReturnValue({
      data: {
        id: "res-1",
        path: "artifacts/test.html",
        content: "<html><body>hello</body></html>",
        mimeType: "text/html",
        size: 30,
      },
      isLoading: false,
      isError: false,
    });
    renderPanel();
    const iframe = (await screen.findByTitle(
      "artifacts/test.html",
    )) as HTMLIFrameElement;
    expect(iframe.getAttribute("sandbox")).toBe("allow-scripts");
    expect(iframe.getAttribute("sandbox")).not.toContain("allow-same-origin");
    expect(iframe.getAttribute("srcdoc")).toContain("hello");
  });

  it("renders an Export link and a Copy link button in the header", async () => {
    useResourceMock.mockReturnValue({
      data: {
        id: "res-1",
        path: "artifacts/test.html",
        content: "<html><body>hello</body></html>",
        mimeType: "text/html",
        size: 30,
      },
      isLoading: false,
      isError: false,
    });
    renderPanel();
    await screen.findByTitle("artifacts/test.html");

    const exportLink = (await screen.findByRole("link", {
      name: /export/i,
    })) as HTMLAnchorElement;
    expect(exportLink.getAttribute("href")).toContain("res-1");
    expect(exportLink.hasAttribute("download")).toBe(true);

    expect(
      await screen.findByRole("button", { name: /copy link/i }),
    ).toBeTruthy();
  });

  it("copies the preview link to the clipboard and toasts success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    useResourceMock.mockReturnValue({
      data: {
        id: "res-1",
        path: "artifacts/test.html",
        content: "<html><body>hello</body></html>",
        mimeType: "text/html",
        size: 30,
      },
      isLoading: false,
      isError: false,
    });
    renderPanel();
    await screen.findByTitle("artifacts/test.html");

    (await screen.findByRole("button", { name: /copy link/i })).click();

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("/artifacts?preview=res-1"),
      );
    });
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalled();
    });
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("toasts an error instead of crashing when the clipboard API is unavailable", async () => {
    Object.assign(navigator, { clipboard: undefined });
    useResourceMock.mockReturnValue({
      data: {
        id: "res-1",
        path: "artifacts/test.html",
        content: "<html><body>hello</body></html>",
        mimeType: "text/html",
        size: 30,
      },
      isLoading: false,
      isError: false,
    });
    renderPanel();
    await screen.findByTitle("artifacts/test.html");

    (await screen.findByRole("button", { name: /copy link/i })).click();

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalled();
    });
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("shows an error state with retry when the resource fails to load", async () => {
    const refetch = vi.fn();
    useResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });
    renderPanel();
    expect(await screen.findByText(/couldn't load/i)).toBeTruthy();
    (await screen.findByRole("button", { name: /retry/i })).click();
    expect(refetch).toHaveBeenCalled();
  });

  it("renders nothing when app state is malformed (empty object)", async () => {
    readClientAppStateMock.mockResolvedValueOnce({} as never);
    useResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    const { container } = renderPanel();
    await waitFor(() => {
      expect(readClientAppStateMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("hides a chat-scoped preview when another conversation is active", async () => {
    readClientAppStateMock.mockResolvedValueOnce({
      resourceId: "res-1",
      path: "artifacts/test.html",
      threadId: "t-2",
    });
    useResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    const { container } = renderPanel("chat");
    // Synchronize on the settled preview state (useResource is called with
    // the resolved resourceId on the same render pass that then evaluates
    // the scoping guards), not just on the app-state fetch having started —
    // otherwise this assertion could pass on the pre-resolution render.
    await waitFor(() => {
      expect(useResourceMock).toHaveBeenCalledWith("res-1");
    });
    expect(container.firstChild).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("hides page-scoped previews in chat scope", async () => {
    readClientAppStateMock.mockResolvedValueOnce({
      resourceId: "res-1",
      path: "artifacts/test.html",
      threadId: null,
    });
    useResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    const { container } = renderPanel("chat");
    await waitFor(() => {
      expect(useResourceMock).toHaveBeenCalledWith("res-1");
    });
    expect(container.firstChild).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("hides a page-scoped preview in chat scope when no conversation is active yet (null/null collision)", async () => {
    // Fresh session / brand-new chat: no route param, nothing in
    // localStorage yet, so activeThreadId is null. A page-scoped preview
    // (threadId: null) must NOT be treated as "matching" a null active
    // thread — otherwise it would leak into the chat panel.
    useParamsMock.mockReturnValue({});
    readClientAppStateMock.mockResolvedValueOnce({
      resourceId: "res-1",
      path: "artifacts/test.html",
      threadId: null,
    });
    useResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    const { container } = renderPanel("chat");
    await waitFor(() => {
      expect(useResourceMock).toHaveBeenCalledWith("res-1");
    });
    expect(container.firstChild).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("hides a legacy preview value that predates thread scoping (valid fields, no threadId key)", async () => {
    readClientAppStateMock.mockResolvedValueOnce({
      resourceId: "res-1",
      path: "artifacts/test.html",
      // no `threadId` key at all — this is the shape written before this
      // feature shipped.
    } as never);
    useResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    const { container } = renderPanel("chat");
    await waitFor(() => {
      expect(useResourceMock).toHaveBeenCalledWith("res-1");
    });
    expect(container.firstChild).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("hides a chat-scoped preview in page scope", async () => {
    readClientAppStateMock.mockResolvedValueOnce({
      resourceId: "res-1",
      path: "artifacts/test.html",
      threadId: "t-1",
    });
    useResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    const { container } = renderPanel("page");
    await waitFor(() => {
      expect(useResourceMock).toHaveBeenCalledWith("res-1");
    });
    expect(container.firstChild).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("shows page-scoped previews in page scope", async () => {
    readClientAppStateMock.mockResolvedValueOnce({
      resourceId: "res-1",
      path: "artifacts/test.html",
      threadId: null,
    });
    useResourceMock.mockReturnValue({
      data: {
        id: "res-1",
        path: "artifacts/test.html",
        content: "<html><body>hello</body></html>",
        mimeType: "text/html",
        size: 30,
      },
      isLoading: false,
      isError: false,
    });
    renderPanel("page");
    const iframe = (await screen.findByTitle(
      "artifacts/test.html",
    )) as HTMLIFrameElement;
    expect(iframe.getAttribute("srcdoc")).toContain("hello");
  });
});
