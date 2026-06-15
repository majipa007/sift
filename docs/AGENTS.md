# Sift — Agent Plan

The agent is the part that's actually judged. Everything else is plumbing. Built on **LangGraph** with **Qwen** models, designed around two principles: **a human approves before anything happens**, and **every token earns its place.**

This doc is also where your LangGraph learning lands — the pipeline below is a clean first real graph: a few nodes, conditional routing, and one genuinely useful advanced feature (interrupt for human-in-the-loop).

---

## Mental model

Sift is **one agent with a multi-step pipeline**, not a swarm. A single email flows through a graph: it gets classified, conditionally drafted, then *pauses* for a human, and only acts after approval. That's the right shape for Track 4 — bounded, production-flavored, no negotiation loops to debug.

---

## The graph

```
                ┌──────────┐
   new email →  │  INGEST  │   normalize, fetch thread, store
                └────┬─────┘
                     ▼
                ┌──────────┐
                │ CLASSIFY │   cheap model + user profile → bucket + reason
                └────┬─────┘
                     ▼
              ┌──────────────┐
              │   ROUTE      │   conditional edge on bucket
              └──┬───────┬───┘
      needs_reply│       │ fyi / junk
                 ▼       ▼
            ┌─────────┐  ┌──────────┐
            │  DRAFT  │  │  STORE   │  (no draft needed)
            └────┬────┘  └────┬─────┘
                 ▼            │
          ┌─────────────┐     │
          │ HUMAN PAUSE │◄────┘   interrupt → wait for UI action
          └──────┬──────┘
        approve  │  tweak       archive/dismiss
          ┌──────┼───────┐
          ▼      ▼       ▼
      ┌──────┐ ┌────────┐ ┌─────────┐
      │ SEND │ │ REDRAFT│ │ ARCHIVE │
      └──────┘ └───┬────┘ └─────────┘
                   └──► back to HUMAN PAUSE
```

---

## Nodes

### 1. Ingest

Pull the email + minimal thread context from Gmail, normalize (strip signatures/quoted noise where easy), write metadata to Mongo. No model call.

### 2. Classify  ← *cheap model* (`qwen-turbo`)

Input: email subject + snippet/short body **+ the user profile** (role, important, junk_rules, key_senders).
Output: **structured** —

```json
{ "bucket": "needs_reply | fyi | junk", "reason": "<one short line>", "priority": 1-5 }
```

- Force JSON-only output (no preamble, no markdown) and parse defensively.
- The profile is what makes this personal — same newsletter is `junk` for one user, `fyi` for another. This is your answer to the rubric's "ambiguous inputs".
- Keep the prompt tight: profile as a few structured fields, not prose.

### 3. Route (conditional edge)

`needs_reply` → Draft. `fyi`/`junk` → Store. Pure logic, no model call.

### 4. Draft  ← *strong model* (`qwen-plus` / `qwen-max`)

**This is the wow feature — spend quality budget here.**
Input: the email, relevant thread history, user profile, default tone.
Output: a reply a human would only lightly edit. Not "Thanks, I'll get back to you" — that canned vibe is an instant demo-killer. It should reference what the email actually asked.

- Store as a `draft` (version 1).
- Use a summary of long threads, not the raw firehose (token discipline).

### 5. Store

For FYI/Junk: persist bucket + reason, set status. Done.

### 6. Human Pause  ← **LangGraph `interrupt` + checkpointer**

The graph *pauses* here and persists its state. Nothing sends automatically. The frontend shows the draft; the human's click resumes the graph with their decision. This single primitive is your entire human-in-the-loop story, and it's a clean showcase of LangGraph doing something a plain loop can't.

### 7. Send / Archive

Resume actions. **Send only ever runs after a human approves** — the agent never sends on its own. Archive removes the `INBOX` label (never hard-delete).

### 8. Redraft  ← *strong model, single focused call*

Input: current draft + the user's one instruction ("more formal", "mention I'm out Friday") + thread context.
Output: one new draft, replaces the old in place, bumps version.

- **One call per click.** No auto-looping, no growing chat history. It's a tool, not a conversation. Then back to Human Pause.

---

## Model tiering (your ROI instinct, made concrete)

| Step | Model | Why |
|---|---|---|
| Classify | `qwen-turbo` (cheap/fast) | Runs on *every* email; must be cheap |
| Draft | `qwen-plus` / `qwen-max` | Quality matters; runs only on Needs-Reply |
| Redraft | same as draft | Single focused call, quality matters |

Classification is the high-volume step, so it gets the cheap model. Drafting is low-volume and high-value, so it gets the good one. This is the single biggest token lever — don't draft what doesn't need a reply, and don't classify with an expensive model.

---

## Token discipline checklist

- [ ] Profile passed as **structured fields**, never a freeform essay.
- [ ] Classify on the **cheap** model; never re-classify a cached email.
- [ ] Draft only for `needs_reply`.
- [ ] Pass **thread summaries**, not full raw threads, into draft prompts.
- [ ] Re-draft is **one** call — current draft + one instruction in, one draft out.
- [ ] Strip quoted/signature noise before anything hits a model.

---

## State (LangGraph state object — rough shape)

```python
class SiftState(TypedDict):
    email_id: str
    raw: dict                  # normalized email
    thread_summary: str
    profile: dict
    bucket: str
    classify_reason: str
    draft: str | None
    draft_version: int
    user_instruction: str | None   # set on redraft
    decision: str | None           # "send" | "archive" | "tweak" | "dismiss"
```

Use a checkpointer so `interrupt` can persist state across the human pause.

---

## How you prove "production-ready over toy demo"

The judges' bar for Track 4 is real-world, not cute. Sift clears it by:

- **Real ambiguous input** — raw email, handled by personalized classification.
- **Real tool use** — actual Gmail read/send/archive, not a mock.
- **Real human-in-the-loop** — a genuine interrupt + approval gate, not a printed "would you like to send? (y/n)".
- **Real restraint** — it drafts and suggests; it never sends or deletes on its own. That trustworthiness *is* the production story.

---

## Stretch (only if you're ahead — don't reach for these)

- Per-sender learning: nudge priority based on which senders you actually reply to.
- "Why this draft" rationale shown in the UI for transparency.
- Confidence score on classification; low-confidence emails get a "not sure" bucket.

These are bonus. The core loop — classify → draft → human approves → send — is the project. Ship that first, polished, and you have a real Track 4 submission.
