// tests/connect-telegram-card.test.tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ConnectTelegramCard } from "../app/components/chat/ConnectTelegramCard";

const DISMISSED_KEY = "joney.telegram-card.dismissed";

describe("ConnectTelegramCard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('renders the heading with a "Connect Telegram" link to /dispatch/identities', () => {
    render(<ConnectTelegramCard />);

    expect(screen.getByText("Talk to your agent in Telegram")).toBeTruthy();
    const link = screen.getByRole("link", { name: "Connect Telegram" });
    expect(link.getAttribute("href")).toBe("/dispatch/identities");
  });

  it("dismissing the card hides it and persists the dismissal in localStorage", () => {
    render(<ConnectTelegramCard />);

    expect(screen.getByText("Talk to your agent in Telegram")).toBeTruthy();

    const dismissButton = screen.getByRole("button", { name: /dismiss/i });
    fireEvent.click(dismissButton);

    expect(screen.queryByText("Talk to your agent in Telegram")).toBeNull();
    expect(window.localStorage.getItem(DISMISSED_KEY)).toBe("true");
  });

  it("does not render when the dismissal key is already set", () => {
    window.localStorage.setItem(DISMISSED_KEY, "true");

    const { container } = render(<ConnectTelegramCard />);

    expect(container.firstChild).toBeNull();
  });
});
