// tests/brain-page.test.tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const useActionQueryMock = vi.fn();
const useActionMutationMock = vi.fn();
const invalidateQueriesMock = vi.fn();

vi.mock("@agent-native/core/client/hooks", () => ({
  useActionQuery: (...args: unknown[]) => useActionQueryMock(...args),
  useActionMutation: (...args: unknown[]) => useActionMutationMock(...args),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

import BrainRoute from "../app/routes/brain";

type BrainEntry = {
  id: string;
  type: "fact" | "preference" | "lesson" | "note";
  title: string;
  body: string;
  status: "proposed" | "kept";
};

const PROPOSED: BrainEntry[] = [
  { id: "p1", type: "fact", title: "Proposed fact one", body: "Body of proposed fact one", status: "proposed" },
  { id: "p2", type: "note", title: "Proposed note one", body: "Body of proposed note one", status: "proposed" },
];

const KEPT: BrainEntry[] = [
  { id: "k1", type: "preference", title: "Likes concise replies", body: "Keep responses short", status: "kept" },
  { id: "k2", type: "fact", title: "Works on GDM team", body: "Marketing digital team", status: "kept" },
  { id: "k3", type: "lesson", title: "Avoid jargon", body: "Plain language works best", status: "kept" },
];

function mockEntries(entries: BrainEntry[], isLoading = false) {
  useActionQueryMock.mockReturnValue({ data: { entries }, isLoading });
}

type MutationOptions = {
  onSettled?: (...args: unknown[]) => void;
  onSuccess?: (...args: unknown[]) => void;
};

// One mutate implementation per action name is shared across every
// component instance that calls useActionMutation with that name (multiple
// entry cards each call the hook independently, same as in the real app),
// so calls land in a single log keyed by action name instead of being
// clobbered by the last-mounted instance's spy.
function mockMutations() {
  const calls: Array<{ name: string; variables: unknown }> = [];
  useActionMutationMock.mockImplementation(
    (name: string, options?: MutationOptions) => {
      const mutate = vi.fn((variables: unknown) => {
        calls.push({ name, variables });
        options?.onSuccess?.(undefined, variables);
        options?.onSettled?.();
      });
      return { mutate, isPending: false };
    },
  );
  return calls;
}

describe("BrainRoute (My Brain page)", () => {
  afterEach(() => {
    cleanup();
    useActionQueryMock.mockReset();
    useActionMutationMock.mockReset();
    invalidateQueriesMock.mockClear();
  });

  it("renders the page title", () => {
    mockEntries([...PROPOSED, ...KEPT]);
    mockMutations();

    render(<BrainRoute />);

    expect(screen.getByText("My Brain")).toBeTruthy();
  });

  it("renders a proposals inbox with Keep/Dismiss for each proposed entry", () => {
    mockEntries([...PROPOSED, ...KEPT]);
    mockMutations();

    render(<BrainRoute />);

    expect(screen.getByText("Proposed fact one")).toBeTruthy();
    expect(screen.getByText("Proposed note one")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Keep" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Dismiss" })).toHaveLength(2);
  });

  it("groups kept entries under type headings", () => {
    mockEntries([...PROPOSED, ...KEPT]);
    mockMutations();

    render(<BrainRoute />);

    const preferencesHeading = screen.getByRole("heading", { name: "Preferences" });
    const factsHeading = screen.getByRole("heading", { name: "Facts" });
    const lessonsHeading = screen.getByRole("heading", { name: "Lessons" });

    expect(preferencesHeading).toBeTruthy();
    expect(factsHeading).toBeTruthy();
    expect(lessonsHeading).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Notes" })).toBeNull();

    expect(screen.getByText("Likes concise replies")).toBeTruthy();
    expect(screen.getByText("Works on GDM team")).toBeTruthy();
    expect(screen.getByText("Avoid jargon")).toBeTruthy();
  });

  it("shows the verbatim empty state when there are no entries at all", () => {
    mockEntries([]);
    mockMutations();

    render(<BrainRoute />);

    expect(
      screen.getByText(
        "Your brain is empty so far. Chat with your agent — it will propose memories worth keeping.",
      ),
    ).toBeTruthy();
  });

  it("shows a delete confirmation dialog with the verbatim copy, and deletes + invalidates on confirm", () => {
    mockEntries(KEPT);
    const calls = mockMutations();

    render(<BrainRoute />);

    const card = screen.getByText("Likes concise replies").closest("[data-testid='brain-entry-card']");
    expect(card).toBeTruthy();
    const deleteButton = within(card as HTMLElement).getByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(
      screen.getByText("Delete this memory? Your agent will forget it."),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(calls).toContainEqual({
      name: "delete-brain-entry",
      variables: { id: "k1" },
    });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["action", "list-brain-entries"],
    });
  });

  it("edits a kept entry inline via the pencil icon and saves via update-brain-entry", () => {
    mockEntries(KEPT);
    const calls = mockMutations();

    render(<BrainRoute />);

    const card = screen.getByText("Likes concise replies").closest("[data-testid='brain-entry-card']") as HTMLElement;
    fireEvent.click(within(card).getByRole("button", { name: /edit/i }));

    const titleInput = within(card).getByLabelText("Title") as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "Likes very concise replies" } });

    fireEvent.click(within(card).getByRole("button", { name: "Save" }));

    expect(calls).toContainEqual({
      name: "update-brain-entry",
      variables: {
        id: "k1",
        title: "Likes very concise replies",
        body: "Keep responses short",
      },
    });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["action", "list-brain-entries"],
    });
  });

  it("reviews a proposed entry via Keep and invalidates the list", () => {
    mockEntries([...PROPOSED, ...KEPT]);
    const calls = mockMutations();

    render(<BrainRoute />);

    fireEvent.click(screen.getAllByRole("button", { name: "Keep" })[0]);

    expect(calls).toContainEqual({
      name: "review-brain-entry",
      variables: { id: "p1", decision: "keep" },
    });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["action", "list-brain-entries"],
    });
  });

  it("renders skeleton rows while loading", () => {
    useActionQueryMock.mockReturnValue({ data: undefined, isLoading: true });
    mockMutations();

    const { container } = render(<BrainRoute />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("My Brain")).toBeTruthy();
  });
});
