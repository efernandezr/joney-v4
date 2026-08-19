import { getOrgContext } from "@agent-native/core/org";
import {
  createAgentChatPlugin,
  loadActionsFromStaticRegistry,
  type AgentChatPluginOptions,
} from "@agent-native/core/server";
import * as workspaceServer from "@joney-ai/shared/server";

import actionsRegistry from "../../.generated/actions-registry.js";

const INITIAL_TOOL_NAMES = ["view-screen", "navigate", "hello"];

const options = {
  // appId keys stored chat threads in the DB — changing it orphans them.
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

For every HTML deliverable the user asks for (a page, dashboard, document, game, or similar), call the save-artifact action with a path under artifacts/ and the complete HTML as content. It saves the artifact and opens the live preview automatically. Never use the resources tool to write artifacts, never deliver an HTML deliverable through inline extensions, and never paste HTML source into your reply. Mention that the preview is open beside the chat; the file card shown with your reply has Open preview and Download buttons, and a collapsed preview reopens from the tab at the right edge. Do not put any preview link or URL in your reply text — the file card is the way to open it. If save-artifact fails, tell the user what failed instead of falling back to another method.

Artifacts are workspace-visible by default (every signed-in user of this app). Use set-artifact-scope when the user asks to make an artifact personal, organization-only, or workspace-visible, and delete-artifact when they ask to delete one (confirm first). Only the artifact's creator can change scope or delete.`,
} satisfies AgentChatPluginOptions;

// The workspace shared package can layer cross-app behavior onto this app's
// options; its default factory is a pass-through to createAgentChatPlugin.
const createWorkspaceAgentChatPlugin = (
  workspaceServer as Record<string, unknown>
).createWorkspaceAgentChatPlugin;

export default typeof createWorkspaceAgentChatPlugin === "function"
  ? (
      createWorkspaceAgentChatPlugin as (
        options: AgentChatPluginOptions,
      ) => ReturnType<typeof createAgentChatPlugin>
    )(options)
  : createAgentChatPlugin(options);
