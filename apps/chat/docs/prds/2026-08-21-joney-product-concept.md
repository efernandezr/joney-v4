# PRD: Joney — Collaborative AI Workspace for Marketing Teams

**Status:** Draft | **Date:** 2026-08-21 | **Owner:** Enrique Fernandez

## Problem

AI technology evolves faster than companies of any size can absorb it.
Marketing managers are expected to transform how their teams work with AI, but
they don't know how: there is no base process, no framework, and no app that
helps them create new workflows, build and maintain team skills, test them,
and get real value out of AI. That gap between technology evolution and
organizational absorption is the opportunity.

A second, compounding problem (from the owner's interviews with heads of
marketing and marketing team leaders): the AI platforms teams use today serve
individuals, not teams. They do not enable collaboration, and no AI is aware
of the team's projects across everyone's separate conversations and meetings.
Work happens in silos, and the connections between silos are invisible to
everyone.

## Users and context

- **MVP users:** heads of marketing, digital marketing managers, and marketing
  leadership teams, with their teams (~10 people per team, sometimes fewer).
  Future expansion: managers in general — the underlying problem is universal.
- **Joney is an external, standalone product.** It is not related to Syngenta.
  (The production org name "GDM Lab v1" is legacy naming only.)
- **Team segmentation foundation:** the "Four Pillars of Modern Marketing"
  framework (source doc: `~/Desktop/Joney App/Theory/Moder Marketing High
  Level.docx`): Product Marketing (Brain), Brand & Demand (Voice), Marketing
  Operations (Muscles & Nervous System), Customer Marketing (Heart). Digital
  marketing is the baseline medium woven through all four, not a department.
  All four streams share one flow: product strategy → campaign/segment
  strategy → multi-channel execution, with heavy cross-stream handoffs.
- **MVP entry point:** campaign operations — the execution/coordination end of
  the flow (the doc's phases 3–6: staging, launch, post-launch, analysis),
  where handoffs and coordination pain are concentrated.

## The concept

Joney is a **team operating workspace** where marketing teams do their real
work with AI embedded — not a coach that describes a new way of working, but
the place where the new way of working is lived.

**Collaboration is the core differentiator.** The AI is aware of the team's
campaigns, conversations, meetings, and documents, and proactively connects
dots that are invisible to any individual because they live in separate silos.

**The user Joney creates (added 2026-08-30):** Joney targets a new type of
marketer — a builder and creator, not a follower of fixed workflows.
Workflows are dynamic and change constantly; what endures is each person's
ability to build with AI. The owner's 3-person POC ("Connected Learning
Agents" / Hermes pilot, doc on file) validated this: giving individuals their
own personal agent accelerated adoption, engagement, and sharing. Ranked
adoption drivers observed: (1) having a personal agent of their own,
(2) experimenting by building a private brain and using a team one,
(3) reaching the agent conveniently in Telegram, (4) discovering they could
become builders — "something they never thought."

Four architectural pillars:

0. **A personal agent per member ("Joney Jr.").** Every team member gets a
   named, durable personal agent: their own persona, private memory, private
   brain, and personal automations — private by default, reachable via
   Telegram identity linking. Members build and evolve their agent's skills
   over time (the builder identity). Knowledge moves from a member's private
   brain to the team brain only by explicit member-approved promotion with
   review — curated, never automatically pooled, always with provenance.

1. **Campaign spaces inside team workspaces.** Each company/team gets an
   isolated workspace; work is organized in campaign/project spaces holding
   the brief, conversations, files, and handoffs, shared with the campaign
   team by default (a private personal space also exists).
2. **A team second brain** (inspired by Karpathy's LLM-wiki pattern):
   meeting transcripts, documents, and in-app activity are ingested and
   distilled into cited, human-reviewable team knowledge that compounds over
   time. Provenance (every claim cites its source) and human correction
   rights are non-negotiable.
3. **Proactive intelligence.** The AI notices contradictions, stale
   assumptions, and disconnects across the team's silos and surfaces them —
   starting as a manager-facing digest, evolving toward campaign feeds and
   in-conversation interventions as precision is proven.

**AI-native principle (P0, user-stated):** anything the app can do must be
triggerable through the chat interface, and the chat interface must be
reachable from external channels (Telegram first; more later). Actions are
the universal contract across all capabilities.

## Success criteria

User-stated, verbatim where possible:

- By end of 2026: ~10 manager-selected early teams (with their managers)
  using Joney — starting with 2–3 teams and their specific leaders.
- **All of them should say they would pay to have something like this.**
- Most of them should say the tool is helping them to: transform their teams,
  get more out of AI tools, transform how they work, create new processes,
  create new skills and share them, and learn from each other.
- Onboarding is feature-driven, not date-driven: the owner brings teams on
  board as soon as the first selected feature round is built.

## Requirements

### P0 (MVP)

| # | Requirement | Build vs configure |
|---|---|---|
| R1 | Isolated team workspace per company (invite-only org, roles, no cross-company visibility) | Configure — framework multi-tenancy is zero-code |
| R2 | Campaign spaces: shared conversations, files, and briefs around a campaign, visible to the campaign team by default; private personal space preserved | **Build** — no shared-thread/project primitive exists in the framework; sharing plumbing (ownership, grants, roles) is provided |
| R3 | Team second brain: ingestion of uploaded meeting transcripts and documents + in-app activity; distillation with human review queue; cited answers; search | Configure/extend — adopt the **Brain** first-party template (`agent-native add-app brain`), which provides sources → distill → review → cited knowledge, incl. `import-transcript`, generic webhook, hybrid full-text + pgvector retrieval on Postgres, audience ACLs |
| R4 | Proactive manager digest: scheduled cross-silo insights (disconnects, contradictions, invisible topics) delivered to the manager; insight quality/delivery evolves over time | Build on configure — cron automation + destinations + `send-platform-message` exist; the dot-connecting logic on top of Brain is custom |
| R5 | Telegram channel: bidirectional chat with the agent, identity linking (`/link TOKEN`), any app action triggerable; proactive sends supported | Configure — built-in adapter, 2 env vars + one setup call; one shared Joney bot for all pilot teams |
| R6 | Web app as primary surface (existing chat + artifacts foundation) | Exists |
| R7 | Per-team artifact branding: teams define brand/company guidelines (tokens, assets, instructions) applied to artifacts and generated outputs | Configure/extend — `@agent-native/core/brand-kit` (tokens + assets + instructions; URL/GitHub/Figma extraction) |
| R8 | Existing Settings → Integrations surface remains available | Exists — keep |
| R9 | Personal agent per member ("Joney Jr."): named persona, private memory and brain, personal automations, Telegram access via identity linking; private by default; explicit promote-to-team flow (proposal → review → approved team knowledge, with provenance) | Configure/extend — personal-scope agent profiles, memory, skills, and `runAs: creator` automations are framework-native; the persona editor, promotion flow UX, and builder experience are product work. Per-member Telegram *bot identity* (own bot name/avatar) is P1 (custom multi-bot registry); MVP uses the shared bot + linked identity, which still serves each member their own agent |

### P1 (post-MVP, direction set but not scheduled)

- Insight delivery evolution: campaign feed, in-conversation interventions,
  direct notifications to affected people (precision-gated).
- Co-developed transformation framework encoded as skills/playbooks per
  pillar (the methodology is core product IP, co-developed with the owner).
- Additional channels (Teams — currently reply-only in the framework;
  Slack; email).
- Cross-team learning, curated/anonymized by the owner (precursor to a
  marketplace).

## Out of scope (MVP, user-confirmed)

- Marketplace / cross-company sharing of artifacts and skills (future vision;
  manual curation by the owner in the meantime).
- Teams and WhatsApp channels (framework adapters are reply-only; no
  proactive sends).
- New live source integrations into the second brain (auto-sync from MarTech
  tools, calendars, Slack-as-source). Existing Settings → Integrations stays.
- Pillars beyond campaign operations as *designed-for* workflows (other teams
  may still use the app; we don't build for them yet).
- Per-company app chrome theming/skinning (distinct from R7 artifact
  branding, which IS in scope).
- Payment/billing.
- Public/external sharing beyond the org; mobile-native app; games as an
  artifact type; non-marketing audiences.

## Current state (verified)

- Production: https://joney-v4.vercel.app/chat (+ /dispatch), Vercel +
  Neon Postgres, invite-only (`AUTO_CREATE_DEFAULT_ORG=0`), Resend email.
  Framework `@agent-native/core` 0.159.2, workspace repo (`apps/chat`,
  `apps/dispatch`, `packages/shared`).
- Shipped: full HTML-artifact system (save/preview actions, drawer + popup
  previews, gallery with scopes/pins/delete, live refresh), theme toggle,
  37 tests green (memory/plan file, commits through 2647584).
- Framework capability map (docs recon, 2026-08-21; slugs in
  `node_modules/@agent-native/core/docs/content/`):
  - Telegram adapter: full bidirectional + proactive sends (`messaging.mdx`).
    Teams/WhatsApp: reply-only. `send-platform-message` supports
    slack/telegram/email only.
  - Automations: cron + event triggers as `jobs/*.md` resources; digest is
    the canonical example (`automations.mdx`, `recurring-jobs.mdx`).
    ⚠ scheduler is in-process `setInterval` — needs keep-alive or external
    cron on Vercel.
  - Brain template: 6 sources incl. generic webhook + manual import,
    `import-transcript`, review queue, citations, audience ACLs, hybrid
    retrieval w/ automatic pgvector on Postgres (`template-brain-*.mdx`).
    Installable via `agent-native add-app` (verified in CLI picker).
  - Multi-tenancy: orgs, invites, roles, per-org SQL isolation — zero
    config (`multi-tenancy.mdx`).
  - **No shared/multi-user chat thread or project primitive exists**
    (`sharing.mdx` covers resources, not threads) — R2 is genuine build.
  - One Telegram bot token per deployment = one shared bot identity across
    orgs; per-org bots would be custom (`messaging-recipes.mdx`).
  - `@agent-native/core/brand-kit` exports exist (package.json verified).

## Decision log

Round 1 (2026-08-20/21):
- **Q1 users/problem:** Marketing leadership (heads of marketing, digital
  marketing managers, leadership teams) for MVP; future: managers generally.
  Problem: AI evolves faster than orgs absorb; managers must transform teams
  but lack a base process/framework/app. Artifacts are one instrument, not
  the product.
- **Q2 success:** ~10 early teams by EOY 2026 (start 2–3); all would pay;
  most report team/work transformation, new processes/skills, mutual
  learning.
- **Q3 roadmap / Q4 scope:** deferred until concept defined (later resolved
  in rounds 3–4).
- **Q5 framing:** external product; marketing teams as a concept (never
  Syngenta/GDM); Four Pillars doc is the segmentation foundation.

Round 2:
- **Q1 concept:** B — team operating workspace, collaboration as the core
  enabler; AI aware of projects/problems across conversations, proactively
  connecting dots across silos ("very big win").
- **Q2 methodology:** co-develop the framework; enabler is collaboration +
  AI at marketers' service + silo-connection.
- **Q3 entry pillar:** campaign operations ("the last step") — most
  coordination happening there.

Round 3:
- **Q1 unit:** both — team space containing campaign spaces; campaigns are
  the MVP surface.
- **Q2 sources:** base on framework capabilities (esp. Dispatch defaults),
  extend only if needed; in-app + uploads for MVP. AI-native principle:
  every capability triggerable from chat, across channels (Telegram first,
  Teams later).
- **Q3 visibility:** campaign-shared by default; private space exists.
- **Q4 proactivity:** manager digest + campaign feed first; insights evolve
  over time.
- **Q5 tenancy:** isolated workspace per company/team; avg team ~10.
- **Addendum (user):** second brain as part of the collaborative approach,
  inspired by Karpathy's LLM-wiki gist (persistent compounding markdown
  knowledge; ingest/query/lint). Adopted as team memory architecture with
  provenance + human-correction as hard requirements.

Round 4:
- **Q1 P0 set:** confirmed (R1–R6 above).
- **Q2 scope:** per-team artifact branding moved IN (R7 — "artifacts should
  be created enabling different brand/company guidelines for the team");
  existing integrations surface stays (R8); rest of out-of-scope confirmed.
- **Q3 Telegram:** one shared bot for the pilot.
- **Q4 second brain:** adopt Brain template, extend later.
- **Q5 timeline:** feature-driven; owner onboards teams when the first
  feature round ships.

Round 5 (2026-08-30, after the owner's "Connected Learning Agents" POC doc):
- **Personal agents become core (R9):** the owner's 3-person Hermes pilot
  showed personal agents accelerate adoption/engagement/sharing. Ranked
  drivers: own personal agent > private+team brain experimentation >
  Telegram convenience > discovering they can be builders. Product targets
  a "builder/creator" marketer; workflows are treated as dynamic.
- **Trust model (user decision):** campaign spaces STAY shared-by-default as
  in Round 3 ("keep the PRD definition"); the personal agent zone is private
  by default with explicit member-approved promotion to team knowledge. Two
  zones, one rule each. POC principles adopted: curated-not-pooled sharing,
  provenance mandatory, manager oversight reads promoted/shared material
  only — the digest does not read private personal-agent content.
- **Approach:** native personal agents inside Joney (one platform), not a
  separate agent fleet; the POC's per-member runtime stays a lab pattern
  only. Per-member Telegram bot identity deferred to P1; weekly
  reflection/roundtable ritual deferred to P1.
- **Pilot migration:** the 3 POC participants will move onto Joney.

## Assumptions (unconfirmed)

- Per-company **app chrome** theming stays out of scope (user confirmed
  artifact-level branding; chrome skinning was recommended out and not
  explicitly contested).
- Pilot teams are willing to upload meeting transcripts (manual upload is the
  MVP ingestion path; no auto-capture).
- The 2–3 initial pilot leaders are not yet named; "campaign operations"
  teams are assumed reachable through the owner's network.
- OpenAI remains the model provider (current deploy); no per-team model
  choice in MVP.
- English-only product surface for MVP.
- The existing `apps/chat` app evolves into Joney's main surface (rather
  than scaffolding a new workspace app) — architecture to be decided in the
  design phase.

## Risks

- **R2 is the product and the biggest unknown.** Campaign spaces have no
  framework primitive; design must not degrade into "yet another project
  tool" — the AI-awareness is the point.
- **Second-brain trust:** one confidently-wrong uncited claim can destroy
  manager trust ("would pay" hinges on credibility). Mitigation: Brain's
  review queue + citations on by default; human edits outrank inference.
- **Compounding errors** in distilled knowledge (Karpathy pattern risk):
  wrong claims become "facts". Mitigation: provenance, review gates,
  periodic lint (P1).
- **Digest precision:** a noisy or obvious digest teaches managers to ignore
  it. Start manager-only, tune before widening delivery.
- **Serverless scheduling:** in-process scheduler needs keep-alive/external
  cron on Vercel, or digests silently don't fire.
- **Shared Telegram bot identity** may feel unpolished to paying-intent
  pilots; acceptable for 2–3 friendly teams, revisit at scale-up.
- **Scope gravity:** four pillars × transformation framework × marketplace is
  a large vision; MVP discipline is campaign-ops + the P0 list only.
