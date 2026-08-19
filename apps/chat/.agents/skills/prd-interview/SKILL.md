---
name: prd-interview
description: Use when the user asks to create, draft, or update a PRD, product spec, or feature requirements, or wants to define what a feature should do before designing or building it.
---

# PRD Interview

## Overview

Produce a PRD by interviewing the user in structured rounds, then writing their decisions into a document. Core principle: **facts are your job, decisions are the user's.** A PRD is a record of the user's product decisions — every requirement, metric, and scope call in it must trace to either a user answer or a fact you verified. A PRD full of your guesses is not faster; it is a spec for the wrong product.

**Violating the letter of this process is violating its spirit.**

## The Hard Gate

Do NOT write the PRD document (or paste a draft into chat) until the interview is complete. This holds regardless of time pressure. The ONLY exception: the user explicitly tells you to skip questions — then draft, but put every unconfirmed decision in the **Assumptions (unconfirmed)** section, never stated as fact.

## Process

### 1. Recon first (facts are yours)

Before asking anything, investigate the codebase, framework docs, and existing PRDs/specs in `docs/`. Never ask the user a question a file can answer. If a question needs a fact you haven't found yet, keep digging or dispatch a subagent — don't push the lookup onto the user.

### 2. Interview in rounds (the frontier)

Model the PRD as a decision tree. The **frontier** is every decision whose prerequisites are already settled. Each round: ask the ENTIRE current frontier at once, numbered, each with your recommended answer. Then STOP and wait for answers. Answers reshape the tree; recompute the frontier and ask the next round. A question that depends on another question still open this round belongs to a later round. Done when the frontier is empty.

Question format (exact):

```
❓ **Q1 — <title>**: <question, with options if applicable>

➡️ Recommended: <your recommendation and one-line why>
```

Round 1 must cover (unless already answered by the user or recon): the problem and who has it, what success looks like (observable, user-stated — never invent metrics), scope boundaries (explicitly out as well as in), and constraints (platform, cost, timeline, compliance).

### 3. Write the PRD

Save to `docs/prds/YYYY-MM-DD-<feature-slug>.md`. REQUIRED sections:

```markdown
# PRD: <Feature>
**Status:** Draft | **Date:** | **Owner:**
## Problem
## Users and context        <!-- only user-stated or verified facts -->
## Success criteria          <!-- the user's answers, verbatim where possible -->
## Requirements              <!-- P0/P1, each traceable to a decision -->
## Out of scope              <!-- user-confirmed non-goals -->
## Current state (verified)  <!-- recon findings with file/doc references -->
## Decision log              <!-- Q → user's answer, per interview round -->
## Assumptions (unconfirmed) <!-- anything not asked or not answered -->
## Risks
```

The **Decision log** and **Assumptions** sections are what keep the PRD honest: if a claim is in neither the decision log nor the verified current state, it belongs in Assumptions.

### 4. Review gate and handoff

Ask the user to review the file; revise until approved, then commit it. Then hand off: **REQUIRED SUB-SKILL:** superpowers:brainstorming (technical design from the PRD) → superpowers:writing-plans. Do not start design or implementation inside this skill.

## Rationalizations

| Excuse | Reality |
|---|---|
| "User is in a hurry, just draft it" | A wrong PRD costs a build-review-rebuild cycle. One round of questions costs minutes. |
| "I found everything in the code" | Code gives facts. It cannot tell you the target user, success metric, or scope. |
| "I'll list open questions at the end" | Open questions at the end of a finished doc are decisions you already made. Ask first. |
| "Only a couple of questions needed" | Then the interview is short. Ask them and wait. |
| "My metrics are reasonable defaults" | Invented metrics read as user commitments. Recommend in a ➡️ line; let the user decide. |

## Red Flags — STOP

- You are writing PRD prose and no interview round has happened.
- A metric, audience claim, or scope call appears that the user never said and recon never verified.
- You asked the user something `grep` could answer.
- Questions asked one-per-message (batch the frontier) or without a ➡️ recommendation.
