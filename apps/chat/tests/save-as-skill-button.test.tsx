// tests/save-as-skill-button.test.tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const sendToAgentChatMock = vi.fn();
vi.mock("@agent-native/core/client/agent-chat", () => ({
  sendToAgentChat: (...args: unknown[]) => sendToAgentChatMock(...args),
}));

import { SaveAsSkillButton } from "../app/components/chat/SaveAsSkillButton";

describe("SaveAsSkillButton", () => {
  afterEach(() => {
    cleanup();
    sendToAgentChatMock.mockClear();
  });

  it('renders with the label "Save as skill"', () => {
    render(<SaveAsSkillButton />);

    expect(screen.getByRole("button", { name: "Save as skill" })).toBeTruthy();
  });

  it("clicking calls sendToAgentChat with submit: true and a turn-into-skill message", () => {
    render(<SaveAsSkillButton />);

    const button = screen.getByRole("button", { name: "Save as skill" });
    button.click();

    expect(sendToAgentChatMock).toHaveBeenCalledTimes(1);
    const call = sendToAgentChatMock.mock.calls[0][0] as {
      message: string;
      submit: boolean;
    };
    expect(call.submit).toBe(true);
    expect(call.message).toContain("turn-into-skill");
    expect(call.message.toLowerCase()).toContain("this conversation");
    expect(call.message.toLowerCase()).toContain("reusable");
    expect(call.message.toLowerCase()).toContain("skill");
  });
});
