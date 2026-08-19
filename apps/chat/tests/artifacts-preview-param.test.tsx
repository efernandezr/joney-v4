// tests/artifacts-preview-param.test.tsx
// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const readClientAppStateMock = vi.fn(async () => null);
const setClientAppStateMock = vi.fn(async () => null);
vi.mock("@agent-native/core/client/application-state", () => ({
  readClientAppState: (...args: unknown[]) =>
    readClientAppStateMock(...args),
  setClientAppState: (...args: unknown[]) => setClientAppStateMock(...args),
}));

interface ResourcesState {
  data: Array<{
    id: string;
    path: string;
    mimeType: string;
    updatedAt: number;
    size: number;
    owner: string;
    metadata: string | null;
  }>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

let resourcesState: ResourcesState = {
  data: [],
  isLoading: false,
  isFetching: false,
  isError: false,
};
const useResourcesMock = vi.fn(() => resourcesState);
vi.mock("@agent-native/core/client/resources", () => ({
  useResources: (...args: unknown[]) => useResourcesMock(...args),
  useResource: () => ({ data: undefined, isLoading: false, isError: false }),
  resourceDownloadUrl: (id: string) => `/download/${id}`,
}));

const actionMutationMock = vi.fn();
vi.mock("@agent-native/core/client/hooks", () => ({
  useSession: () => ({
    session: { email: "viewer@example.com" },
    isLoading: false,
    status: "authenticated",
    error: null,
    retry: () => {},
  }),
  useActionQuery: () => ({ data: { paths: [] }, refetch: vi.fn() }),
  useActionMutation: () => ({ mutate: actionMutationMock }),
  useChangeVersion: () => 0,
}));

let currentSearchParams = new URLSearchParams();
const setSearchParamsMock = vi.fn();
vi.mock("react-router", () => ({
  Link: ({
    to,
    children,
    ...rest
  }: React.PropsWithChildren<{ to: string }>) => (
    <a href={String(to)} {...rest}>
      {children}
    </a>
  ),
  useParams: () => ({}) as Record<string, string | undefined>,
  useSearchParams: () =>
    [currentSearchParams, setSearchParamsMock] as [
      URLSearchParams,
      typeof setSearchParamsMock,
    ],
  useLocation: () => ({ pathname: "/artifacts" }),
}));

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

// eslint-disable-next-line import/first
import ArtifactsRoute from "../app/routes/artifacts";

function renderRoute(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <ArtifactsRoute />
    </QueryClientProvider>,
  );
}

describe("Artifacts page preview param", () => {
  beforeEach(() => {
    useResourcesMock.mockClear();
    readClientAppStateMock.mockClear();
    setClientAppStateMock.mockClear();
    setSearchParamsMock.mockClear();
    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();
    currentSearchParams = new URLSearchParams();
    resourcesState = {
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
    };
  });

  afterEach(() => {
    cleanup();
  });

  it("does not act while the list is still fetching a stale cache, then opens the match once settled", async () => {
    currentSearchParams = new URLSearchParams({ preview: "res-1" });
    // Stale cached list served while a background refetch is in flight:
    // isLoading is false but isFetching is true.
    resourcesState = {
      data: [],
      isLoading: false,
      isFetching: true,
      isError: false,
    };
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { rerender } = renderRoute(client);

    expect(setClientAppStateMock).not.toHaveBeenCalled();
    expect(setSearchParamsMock).not.toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();

    resourcesState = {
      data: [
        {
          id: "res-1",
          path: "artifacts/test.html",
          mimeType: "text/html",
          updatedAt: 1,
          size: 10,
          owner: "__shared__",
          metadata: null,
        },
      ],
      isLoading: false,
      isFetching: false,
      isError: false,
    };
    rerender(
      <QueryClientProvider client={client}>
        <ArtifactsRoute />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(setClientAppStateMock).toHaveBeenCalledWith(
        "artifact-preview",
        expect.objectContaining({
          resourceId: "res-1",
          path: "artifacts/test.html",
          threadId: null,
        }),
        expect.anything(),
      );
    });
    await waitFor(() => {
      expect(setSearchParamsMock).toHaveBeenCalledWith(
        expect.any(Function),
        { replace: true },
      );
    });
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("toasts 'Artifact not found' and strips the param when the list is loaded but has no match", async () => {
    currentSearchParams = new URLSearchParams({ preview: "does-not-exist" });
    resourcesState = {
      data: [
        {
          id: "res-1",
          path: "artifacts/test.html",
          mimeType: "text/html",
          updatedAt: 1,
          size: 10,
          owner: "__shared__",
          metadata: null,
        },
      ],
      isLoading: false,
      isFetching: false,
      isError: false,
    };
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    renderRoute(client);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("Artifact not found");
    });
    expect(setClientAppStateMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(setSearchParamsMock).toHaveBeenCalledWith(
        expect.any(Function),
        { replace: true },
      );
    });
  });

  it("toasts 'Couldn't load artifacts' when the list settles with an error", async () => {
    currentSearchParams = new URLSearchParams({ preview: "res-1" });
    resourcesState = {
      data: [],
      isLoading: false,
      isFetching: false,
      isError: true,
    };
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    renderRoute(client);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("Couldn't load artifacts");
    });
    expect(setClientAppStateMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(setSearchParamsMock).toHaveBeenCalledWith(
        expect.any(Function),
        { replace: true },
      );
    });
  });
});
