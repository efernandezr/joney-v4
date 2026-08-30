// tests/welcome-create-agent.test.tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const sendToAgentChatMock = vi.fn();
vi.mock("@agent-native/core/client/agent-chat", () => ({
  sendToAgentChat: (...args: unknown[]) => sendToAgentChatMock(...args),
}));

const useActionQueryMock = vi.fn();
vi.mock("@agent-native/core/client/hooks", () => ({
  useActionQuery: (...args: unknown[]) => useActionQueryMock(...args),
}));

import { WelcomeCreateAgent } from "../app/components/chat/WelcomeCreateAgent";

describe("WelcomeCreateAgent", () => {
  afterEach(() => {
    cleanup();
    sendToAgentChatMock.mockClear();
    useActionQueryMock.mockClear();
  });

  it("renders the welcome CTA when get-personal-agent returns exists: false", async () => {
    useActionQueryMock.mockReturnValue({ data: { exists: false }, isLoading: false });

    render(<WelcomeCreateAgent />);

    expect(screen.getByText("Meet your agent")).toBeTruthy();
    expect(
      await screen.findByRole("button", { name: "Create your agent" }),
    ).toBeTruthy();
  });

  it("renders nothing when get-personal-agent returns exists: true", () => {
    useActionQueryMock.mockReturnValue({
      data: { exists: true, name: "Max", createdAt: "2026-01-01" },
      isLoading: false,
    });

    const { container } = render(<WelcomeCreateAgent />);

    expect(container.firstChild).toBeNull();
  });

  it('clicking "Create your agent" calls sendToAgentChat with the ritual marker and submit: true', async () => {
    useActionQueryMock.mockReturnValue({ data: { exists: false }, isLoading: false });

    render(<WelcomeCreateAgent />);

    const button = await screen.findByRole("button", { name: "Create your agent" });
    button.click();

    expect(sendToAgentChatMock).toHaveBeenCalledTimes(1);
    const call = sendToAgentChatMock.mock.calls[0][0] as {
      message: string;
      submit: boolean;
    };
    expect(call.message).toContain("[joney-ritual]");
    expect(call.submit).toBe(true);
  });
});
