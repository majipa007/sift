# Sift — Frontend Plan

**Stack:** React (lightweight — Vite + plain React is plenty). No heavy state library needed.

**Golden rule:** This is **not an email client.** It's a triage cockpit with exactly three actions. Resist every urge to add threading views, compose-from-scratch, folders, or search. Each one steals time from the agent, which is what's judged.

---

## Screens

### 1. Onboarding (one-time, editable later)

A short **structured** form — *not* a freeform essay box (a wall of text bloats every classification prompt and blurs the signal).

Fields:

- **Your role** (short text, e.g. "freelance product designer")
- **What's important to you** (a few chips/lines — "client inquiries", "invoices", "anything from my manager")
- **What's always junk** (chips — "cold sales outreach", "promotional newsletters")
- **Key senders** (emails/domains that always matter)
- **Reply tone default** (formal / friendly / concise — feeds the drafter)

This screen *is* a demo beat. Keep it clean and quick to fill on camera.

### 2. Triage cockpit (the main screen)

```
┌─────────────┬──────────────────────────────────────┐
│  SIDEBAR    │   DETAIL PANE                         │
│             │                                       │
│ Needs Reply │   [Original email]                    │
│   • (5)     │   ─────────────────────               │
│ FYI         │   [Agent's draft]  (Needs-Reply only) │
│   • (12)    │   ─────────────────────               │
│ Junk        │   [tweak box] [Edit] [Send] [Archive] │
│   • (8)     │                                       │
└─────────────┴──────────────────────────────────────┘
```

**Sidebar:** three queues with counts — Needs Reply / FYI / Junk. Click a queue → list of emails → click an email → it opens in the detail pane.

**Detail pane behaves per bucket:**

- **Needs Reply:** a short **"Why Sift surfaced this"** annotation first, then the original email, then a prominent re-draft instruction input, then the agent draft. Keep a **sticky bottom action bar** so Send / Archive never fall below the fold.
- **FYI:** original email only, read-only. Maybe a one-line "why this is FYI" from the classifier. No actions except "mark done / dismiss".
- **Junk:** original email, plus a single **Archive** suggestion. (Archive, not delete — destructive actions are a demo risk and "is this spam" is a boring solved problem. Don't make deletion your headline.)

**List density:** keep queue rows compact enough to scan at 10-20 items. Default row = sender + subject + single-line snippet. `classify_reason` is secondary metadata, not the primary preview.

---

## The three actions (and only three)

| Action | Where | What it does |
|---|---|---|
| **Send** | Needs Reply | Sends the current draft (edited or not) via Gmail API. |
| **Edit-then-send** | Needs Reply | Inline-editable draft textarea; Send uses the edited text. |
| **Archive** | Junk (and FYI dismiss) | Archives in Gmail. Never hard-delete. |

---

## The "ask AI to tweak" loop — your best feature

On a Needs-Reply draft, a prominent text box near the draft: *"Tell Sift how to change this"*.

- User types e.g. "make it more formal" / "mention I'm out Friday" / "shorter".
- Frontend sends `{ draft, instruction, email_id }` to a `/redraft` endpoint.
- The new draft replaces the old one **in place** (don't append a chat log — keep it a tool, not a conversation).
- Show a subtle spinner; this call is fast because it's a single focused request.

Demo-wise this is the moment that proves the agent takes correction like a real assistant. Make the re-draft feel snappy and obviously *in place*.

**Guardrails:**

- One re-draft per click — no auto-looping.
- Keep the original thread context server-side so the tweak doesn't lose the plot.
- Optional: a tiny "revert to original draft" link.

**Versioning note:** the backend may keep an integer `version` for overwrite bookkeeping, but until the UI can navigate history, do **not** imply browsable draft history with visible "Version 1 / 2 / 3" chrome.

---

## State (keep it simple)

- Plain React state / context. No Redux.
- Fetch queues on load + after any action (send/archive moves an item out of its queue).
- Optimistic UI on send/archive is a nice-to-have, not week-1.

---

## States you must not forget (these win or lose the demo)

- **Loading** — ingestion + classification take a moment; show it, don't freeze.
- **Empty** — "No emails need a reply right now." Looks intentional, not broken.
- **Error** — Gmail token expired → a clear "Reconnect Gmail" prompt (this *will* happen after 7 days in Testing mode).
- **Draft generating** — spinner on the draft area while Qwen works.
- **Primary actions always visible** — the Send / Archive controls stay on-screen in the detail pane via a sticky bottom bar.

---

## Build order (matches the project plan)

1. Skeleton: sidebar + three empty queues + empty detail pane (Weekend 1).
2. Wire queues to real classified data (Weekend 1–2).
3. Draft rendering + Send/Archive (Weekend 2).
4. The tweak/re-draft loop (Week 3).
5. Loading/empty/error polish + onboarding form finish (Week 3).

---

## What NOT to build (write this on a sticky note)

- ❌ Threaded conversation view
- ❌ Compose a new email from scratch
- ❌ Labels / folders management
- ❌ Search
- ❌ Settings beyond the profile
- ❌ Multi-account

If it's not one of the three actions or the tweak loop, it's out of scope.
