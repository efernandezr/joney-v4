// tests/artifact-preview-panel.test.tsx
// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const readClientAppStateMock = vi.fn(async () => ({
  resourceId: "res-1",
  path: "artifacts/test.html",
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

import { ArtifactPreviewPanel } from "../app/components/preview/ArtifactPreviewPanel";

function renderPanel() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <ArtifactPreviewPanel />
    </QueryClientProvider>,
  );
}

describe("ArtifactPreviewPanel", () => {
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
});
