import { runWithRequestContext } from "@agent-native/core/server";
import { describe, expect, it } from "vitest";

import createPersonalAgent from "../actions/create-personal-agent";
import getPersonalAgent from "../actions/get-personal-agent";
import listBrainEntries from "../actions/list-brain-entries";

const asUser = (email: string, fn: () => Promise<void>) =>
  runWithRequestContext({ userEmail: email }, fn);

describe("personal agent", () => {
  it("does not exist before the ritual", async () => {
    await asUser("fresh@example.com", async () => {
      const res = (await getPersonalAgent.run({}, {} as never)) as { exists: boolean };
      expect(res.exists).toBe(false);
    });
  });

  it("create writes persona; get returns it; role facts land as proposals", async () => {
    await asUser("gina@example.com", async () => {
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
    await asUser("hank@example.com", async () => {
      const res = (await getPersonalAgent.run({}, {} as never)) as { exists: boolean };
      expect(res.exists).toBe(false);
    });
  });
});
