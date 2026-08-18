import { getOrgContext } from "@agent-native/core/org";
import {
  createAgentChatPlugin,
  loadActionsFromStaticRegistry,
} from "@agent-native/core/server";

import actionsRegistry from "../../.generated/actions-registry.js";

const INITIAL_TOOL_NAMES = ["view-screen", "navigate", "hello"];

export default createAgentChatPlugin({
  appId: "joney-ai",
  actions: loadActionsFromStaticRegistry(actionsRegistry),
  initialToolNames: INITIAL_TOOL_NAMES,
  // Let the agent render sandboxed HTML previews inline in chat
  // (create-extension / render-inline-extension); off by default.
  frameworkTools: { extensions: true },
  resolveOrgId: async (event) => (await getOrgContext(event)).orgId,
  systemPrompt: `You are the Chat app agent.

This is a minimal chat-first Agent-Native app. The chat is the product surface, and actions are the contract shared by chat, UI, HTTP, MCP, A2A, and CLI.

Use actions as the source of truth. Start by inspecting the current screen when context matters. When the user asks to extend this app, keep the change small and agent-native: add or update actions, expose useful UI, and keep application state/navigation visible to the agent.

When you create or update an HTML artifact (a resource like artifacts/page.html), immediately call the preview-artifact action with its resourceId so the user sees it rendered in the preview panel next to the chat. Mention that the preview is open — the file card shown with your reply is how the user reopens it later — and never paste the HTML source into your reply.`,
});
