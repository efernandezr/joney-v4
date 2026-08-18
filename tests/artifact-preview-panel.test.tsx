// tests/artifact-preview-panel.test.tsx
// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { ArtifactPreviewPanel } from "../app/components/preview/ArtifactPreviewPanel";

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

describe("ArtifactPreviewPanel", () => {
  beforeEach(() => {
    // Clear call history (not implementations/return values) so a
    // waitFor(() => expect(mock).toHaveBeenCalledWith(...)) in one test can't
    // pass immediately on leftover calls recorded by a previous test.
    useResourceMock.mockClear();
    readClientAppStateMock.mockClear();
    useParamsMock.mockReset();
    useParamsMock.mockReturnValue({ threadId: "t-1" });
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
