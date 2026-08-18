// tests/theme-toggle.test.tsx
// @vitest-environment jsdom
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const setThemeMock = vi.fn();
const useThemeMock = vi.fn(() => ({ theme: "dark", setTheme: setThemeMock }));
vi.mock("next-themes", () => ({
  useTheme: () => useThemeMock(),
}));

import { ThemeToggle } from "../app/components/theme/ThemeToggle";

function renderToggle(props?: { collapsed?: boolean }) {
  return render(
    <TooltipProvider>
      <ThemeToggle {...props} />
    </TooltipProvider>,
  );
}

describe("ThemeToggle", () => {
  afterEach(() => {
    cleanup();
    setThemeMock.mockClear();
    useThemeMock.mockClear();
  });

  it("renders three toggle items with accessible names when expanded", async () => {
    renderToggle();

    expect(await screen.findByRole("radio", { name: "Light theme" })).toBeTruthy();
    expect(await screen.findByRole("radio", { name: "Dark theme" })).toBeTruthy();
    expect(
      await screen.findByRole("radio", { name: "System theme" }),
    ).toBeTruthy();
  });

  it("calls setTheme when a different option is clicked while expanded", async () => {
    renderToggle();

    const lightItem = await screen.findByRole("radio", { name: "Light theme" });
    lightItem.click();

    expect(setThemeMock).toHaveBeenCalledWith("light");
  });

  it("renders a single button when collapsed", async () => {
    renderToggle({ collapsed: true });

    const buttons = await screen.findAllByRole("button");
    expect(buttons.length).toBe(1);
  });

  it("cycles dark -> system when collapsed button is clicked", async () => {
    useThemeMock.mockReturnValue({ theme: "dark", setTheme: setThemeMock });
    renderToggle({ collapsed: true });

    const button = await screen.findByRole("button");
    button.click();

    expect(setThemeMock).toHaveBeenCalledWith("system");
  });
});
