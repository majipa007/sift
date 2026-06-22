# Sift — API Design

> For the concrete frontend-facing request/response shapes, see `API_CONTRACT.md`.

FastAPI backend. Reflects the locked decisions:
- **Classify-now, draft-later** — the trigger never drafts; drafts are made lazily when an Important email is opened.
- **The trigger never waits for a human** — it classifies, routes, stores, and ends. Approval is a separate request later.
- **Send is one endpoint** — approve-and-send and edit-and-send are the same call; the UI always shows an editable box.
- **Archive, never hard-delete.**
- **FYI is read-only by default**, with an escape-hatch reply path for misclassification.

---

## 1. Ingestion / trigger

### `POST /ingest`
The "an email arrived" handler. Called by your polling job (and manually for testing).

1. Pull new messages from Gmail (since last `historyId` / newer-than query).
2. For each new message, **one model call** → `{ classification, classify_reason, body_summary, priority }` (classify + summarize together — saves tokens).
3. Route:
   - `JNK` → store with `classification=JNK`, `status=NEW`.
   - `FYI` → store with `classification=FYI`, `status=NEW`.
   - `IMP` → store with `classification=IMP`, `status=NEW`. **No draft yet.**
4. Return a small summary (counts ingested per bucket).

> Trigger ends here. No drafting, no waiting. That's the whole point of classify-now-draft-later.

**On the trigger mechanism:** for the hackathon this is a **scheduled poll** (cron/APScheduler hitting this endpoint every N minutes), not a webhook. Gmail push (Pub/Sub) needs a public HTTPS endpoint — skip unless you finish early.

---

## 2. Counters

### `GET /counts`
Powers the sidebar badges `Important (12) | FYI (30) | Junk (20)`.

Returns per-bucket count of `status = NEW` items:
```json
{ "IMP": 12, "FYI": 30, "JNK": 20 }
```
One query per bucket (or one aggregate). Cheap — no model calls.

---

## 3. Category listing

### `GET /emails?bucket=IMP&status=NEW`
When the user clicks a category, list its emails.

- Query: `user_id = ? AND classification = bucket AND status = ?` (default `status=NEW`).
- Returns list items: `id, sender, subject, snippet, classify_reason, priority, received_at, status`.
- UI note: `classify_reason` is for a secondary hint or detail annotation, not for the main list row body. The main list should stay dense.
- **Does NOT return draft text** — lists are cheap; drafts load on open.

**Optional pre-draft optimization (Important only):** when this returns the Important list, kick off background drafting for the **top 2-3** by priority so the likely clicks feel instant. Fire-and-forget; don't block the list response. Skip if you're tight on time — lazy-on-open works fine.

---

## 4. Open one email (where lazy drafting happens)

### `GET /emails/{id}`
Returns the full email + its draft. **This is where a draft gets created if it doesn't exist yet.**

Logic:
1. Fetch the email item.
2. If `classification = IMP` and no draft exists:
   - Fetch thread context (older messages, same `thread_id`) from Gmail.
   - **Draft call** (strong model) using email + thread summary + profile + `default_tone`.
   - Store draft (`version=1`), set email `status=DRAFTED`.
3. Return `{ email, draft }` (draft may be `null` for FYI/JNK).

> Synchronous draft = a ~2-3s spinner on open. The pre-draft optimization in §3 hides this for the top items. Decide per your time budget.

---

## 5. Actions on a draft (Important, and FYI escape-hatch)

### `POST /emails/{id}/send`  ← approve-and-send AND edit-and-send, merged
Body: `{ "text": "<final reply text>" }`

1. Send reply via Gmail handler (in-reply-to the thread).
2. Set email `status = SENT`.
3. Return success.

> The UI always shows an editable textbox. If the user didn't touch it, `text` == the draft (an "approve"). If they edited, `text` is their version. Backend doesn't care — **this is the human-in-the-loop gate.** The agent never calls this; only a human click does.

### `POST /emails/{id}/redraft`
Body: `{ "instruction": "make it more formal, mention I'm out Friday" }`

1. Load current draft + thread context.
2. **One focused model call** — current draft + instruction + context → new draft.
3. Overwrite `current_text`, bump `version`, store `last_instruction`.
4. Return the new draft.

> One call per click. No looping, no growing chat history. It's a tool, not a conversation. Keep thread context server-side so the tweak doesn't lose the plot.

> `version` is an internal overwrite counter in v1, not a promise of user-visible version browsing. Do not build prev/next draft-history controls unless you also add a history API.

### `POST /emails/{id}/reply`  *(FYI escape-hatch only)*
For when classification was wrong and an FYI actually needs a response. Generates a first draft on demand (same logic as the IMP open path), sets `status=DRAFTED`. After this, the email behaves like an Important one (send / redraft available). Keeps FYI lean by default but never traps the user.

---

## 6. Common actions

### `POST /emails/{id}/archive`
Archive in Gmail (remove `INBOX` label — **not** delete). Set `status = ARCHIVED`. Used by Junk, and available everywhere.

### `POST /emails/{id}/dismiss`  (a.k.a. "ignore")
Set `status = DISMISSED`. No Gmail action — just clears it from the NEW queue. This is your "ignore" / "mark reviewed".

### `POST /emails/dismiss-bulk`
Body: `{ "ids": ["...", "..."] }` — set `status = DISMISSED` for each.

> Covers "ignore selected" and "ignore all" with one endpoint. If the UI has a select-all checkbox, you don't need separate ignore-all vs ignore-selected routes — select-all just fills `ids`.

---

## 7. Profile

### `GET /profile` — fetch (prefill onboarding).
### `POST /profile` — create/update. Body = the profile fields. Validated against the `Tone` enum.

---

## 8. Auth (Gmail OAuth)

### `GET /auth/login` — start OAuth, redirect to Google consent.
### `GET /auth/callback` — receive code, exchange for tokens, store in `tokens` container.
### `GET /auth/status` — is the token alive? Drives the "Reconnect Gmail" UI.
```json
{ "connected": true, "expires_at": "..." }
```

> **The 7-day Testing-mode expiry lives here.** When `/auth/status` reports dead/expired, the frontend shows "Reconnect Gmail." Re-auth the morning of the demo.

---

## Endpoint summary

| Method | Route | Model call? | Purpose |
|---|---|---|---|
| `POST` | `/ingest` | yes (classify+summarize) | Trigger: classify & route new mail |
| `GET` | `/counts` | no | Sidebar badges |
| `GET` | `/emails?bucket=&status=` | no | List a queue |
| `GET` | `/emails/{id}` | maybe (lazy draft) | Open email; draft if IMP & none |
| `POST` | `/emails/{id}/send` | no | Send approved/edited reply |
| `POST` | `/emails/{id}/redraft` | yes (1 focused) | Rewrite from instruction |
| `POST` | `/emails/{id}/reply` | yes | FYI escape-hatch: force a draft |
| `POST` | `/emails/{id}/archive` | no | Archive (not delete) |
| `POST` | `/emails/{id}/dismiss` | no | Mark reviewed |
| `POST` | `/emails/dismiss-bulk` | no | Bulk dismiss |
| `GET`/`POST` | `/profile` | no | Read/write profile |
| `GET` | `/auth/login` `/auth/callback` `/auth/status` | no | Gmail OAuth |

**Model calls happen in exactly three places:** `/ingest` (cheap model, every email), `/emails/{id}` lazy draft (strong model, only Important on open), and `/redraft` (strong model, one call). That's the whole token surface — keep it that tight.
