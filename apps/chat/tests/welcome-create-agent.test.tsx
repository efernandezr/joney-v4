// tests/welcome-create-agent.test.tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const sendToAgentChatMock = vi.fn();
vi.mock("@agent-native/core/client/agent-chat", () => ({
  sendToAgentChat: (...args: unknown[]) => sendToAgentChatMock(...args),
}));

import { WelcomeCreateAgent } from "../app/components/chat/WelcomeCreateAgent";

describe("WelcomeCreateAgent", () => {
  afterEach(() => {
    cleanup();
    sendToAgentChatMock.mockClear();
  });

  it("renders the welcome CTA when get-personal-agent returns exists: false", async () => {
    render(<WelcomeCreateAgent data={{ exists: false }} isLoading={false} />);

    expect(screen.getByText("Meet your agent")).toBeTruthy();
    expect(
      await screen.findByRole("button", { name: "Create your agent" }),
    ).toBeTruthy();
  });

  it("renders nothing when get-personal-agent returns exists: true", () => {
    const { container } = render(
      <WelcomeCreateAgent
        data={{ exists: true, name: "Max", createdAt: "2026-01-01" }}
        isLoading={false}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders skeleton placeholders while loading, with no CTA and no sendToAgentChat call", () => {
    const { container } = render(<WelcomeCreateAgent data={undefined} isLoading={true} />);

    expect(screen.queryByText("Meet your agent")).toBeNull();
    expect(screen.queryByRole("button", { name: "Create your agent" })).toBeNull();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(sendToAgentChatMock).not.toHaveBeenCalled();
  });

  it('clicking "Create your agent" calls sendToAgentChat with the ritual marker and submit: true', async () => {
    render(<WelcomeCreateAgent data={{ exists: false }} isLoading={false} />);

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
