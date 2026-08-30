import { runWithRequestContext } from "@agent-native/core/server";
import { describe, expect, it } from "vitest";

import createPersonalAgent from "../actions/create-personal-agent";
import getPersonalAgent from "../actions/get-personal-agent";
import listBrainEntries from "../actions/list-brain-entries";

const asUser = (email: string, fn: () => Promise<void>) =>
  runWithRequestContext({ userEmail: email }, fn);

// vitest.db is a persistent SQLite file (not reset between runs — see the
// `carol` comment in tests/brain-store.test.ts), and create-personal-agent
// now refuses to overwrite an existing persona. Any test that calls
// create-personal-agent must use a fresh, unique email per run so repeated
// local runs don't find a leftover persona from a previous run and fail the
// "already exists" guard.
const uniqueEmail = (label: string) => `${label}-${crypto.randomUUID()}@example.com`;

describe("personal agent", () => {
  it("does not exist before the ritual", async () => {
    await asUser(uniqueEmail("fresh"), async () => {
      const res = (await getPersonalAgent.run({}, {} as never)) as { exists: boolean };
      expect(res.exists).toBe(false);
    });
  });

  it("create writes persona; get returns it; role facts land as proposals", async () => {
    await asUser(uniqueEmail("gina"), async () => {
      await createPersonalAgent.run(
        {
          name: "Max",
          persona: "Direct and warm. Gina runs customer marketing for LATAM.",
          roleFacts: [{ title: "Role", body: "Head of customer marketing, LATAM" }],
        },
        {} as never,
      );
      const res = (await getPersonalAgent.run({}, {} as never)) as {
        exists: boolean;
        name?: string;
      };
      expect(res).toMatchObject({ exists: true, name: "Max" });

      const proposals = (await listBrainEntries.run({ status: "proposed" }, {} as never)) as {
        entries: { title: string }[];
      };
      expect(proposals.entries.some((e) => e.title === "Role")).toBe(true);
    });
  });

  it("personas are per-user", async () => {
    await asUser(uniqueEmail("hank"), async () => {
      const res = (await getPersonalAgent.run({}, {} as never)) as { exists: boolean };
      expect(res.exists).toBe(false);
    });
  });

  it("refuses to overwrite an existing persona without replace: true", async () => {
    await asUser(uniqueEmail("jill"), async () => {
      await createPersonalAgent.run(
        { name: "Jill's Agent", persona: "Warm and concise." },
        {} as never,
      );
      await expect(
        createPersonalAgent.run(
          { name: "New Name", persona: "Something else entirely." },
          {} as never,
        ),
      ).rejects.toThrow("Personal agent already exists");

      const res = (await getPersonalAgent.run({}, {} as never)) as {
        exists: boolean;
        name?: string;
      };
      expect(res).toMatchObject({ exists: true, name: "Jill's Agent" });
    });
  });

  it("redoes the ritual when replace: true is passed", async () => {
    await asUser(uniqueEmail("kai"), async () => {
      await createPersonalAgent.run(
        { name: "Old Name", persona: "First persona." },
        {} as never,
      );
      await createPersonalAgent.run(
        { name: "New Name", persona: "Second persona.", replace: true },
        {} as never,
      );

      const res = (await getPersonalAgent.run({}, {} as never)) as {
        exists: boolean;
        name?: string;
      };
      expect(res).toMatchObject({ exists: true, name: "New Name" });
    });
  });

  it("a name containing marker-breaking characters round-trips exactly", async () => {
    await asUser(uniqueEmail("ivy"), async () => {
      const trickyName = 'He said "hi" -->';
      await createPersonalAgent.run(
        { name: trickyName, persona: "Playful and a little chaotic." },
        {} as never,
      );
      const res = (await getPersonalAgent.run({}, {} as never)) as {
        exists: boolean;
        name?: string;
      };
      expect(res).toMatchObject({ exists: true, name: trickyName });
    });
  });
});
