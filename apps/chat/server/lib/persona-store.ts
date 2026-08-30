/**
 * The member's personal agent persona, created at the end of the birth
 * ritual. Stored as a personal-scope instructions resource (owner = user
 * email) so the framework's prompt-resource loader picks it up automatically
 * for that member's agent, the same way `AGENTS.md`/brain digest resources
 * are consumed.
 */
import { resourceGetByPath, resourcePut } from "@agent-native/core/resources/store";

export const PERSONA_PATH = "instructions/personal-agent.md";

const MARKER_RE = /<!-- joney-agent name="([^"]*)" created="([^"]*)" -->/;
const PERSONA_LINE_PREFIX = "Always act with this persona:";

function serialize(name: string, createdAt: string, persona: string): string {
  return [
    `<!-- joney-agent name="${name}" created="${createdAt}" -->`,
    `# ${name} — this member's personal agent`,
    "",
    `You are ${name}, this member's personal agent. ${PERSONA_LINE_PREFIX}`,
    "",
    persona,
  ].join("\n");
}

export type PersonaProfile = { name: string; createdAt: string; persona: string };

export async function readPersona(ownerEmail: string): Promise<PersonaProfile | null> {
  const resource = await resourceGetByPath(ownerEmail, PERSONA_PATH);
  if (!resource) return null;
  const match = MARKER_RE.exec(resource.content);
  if (!match) return null;
  const [, name, createdAt] = match;
  const afterPrefix = resource.content.indexOf(PERSONA_LINE_PREFIX);
  if (afterPrefix === -1) return null;
  const persona = resource.content.slice(afterPrefix + PERSONA_LINE_PREFIX.length).trim();
  return { name, createdAt, persona };
}

export async function writePersona(
  ownerEmail: string,
  profile: { name: string; persona: string },
): Promise<PersonaProfile> {
  const createdAt = new Date().toISOString();
  const content = serialize(profile.name, createdAt, profile.persona);
  const saved = await resourcePut(ownerEmail, PERSONA_PATH, content, "text/markdown");
  if (saved.content !== content) {
    throw new Error("persona write could not be verified");
  }
  const verified = await resourceGetByPath(ownerEmail, PERSONA_PATH);
  if (!verified || verified.content !== content) {
    throw new Error("persona write could not be verified");
  }
  return { name: profile.name, createdAt, persona: profile.persona };
}
