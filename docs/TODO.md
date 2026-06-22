# Sift — Build TODO

**The one rule:** build the spine in the order an email actually flows. Top to bottom. Don't skip, don't jump ahead to the fun parts. Each step is useless without the one before it — that's *why* there's only one correct order, and why you don't have to decide anything.

When stuck on "what now?" → it's the next unchecked box. That's the whole system.

---

## The spine (mandatory, in order)

### Step 1 — Gmail handler module (`gmail.py`)
Not an endpoint yet — just clean functions you'll call everywhere. You already proved read+send work; wrap them.
- [o] `fetch_recent(since)` — pull new messages --- Not doing this one cuz I dont think we need it
- [ ] `get_thread(thread_id)` — older messages for context
- [x] `send_reply(thread_id, text)` — reply in-thread
- [ ] `archive(message_id)` — remove INBOX label (NOT delete)

### Step 2 — DB connection + models
Boring, foundational. ~30 min.
- [ ] Cosmos/Mongo client connects
- [ ] Pydantic models: `Profile`, `Email`, `Draft` (+ the `Classification` / `EmailStatus` / `Tone` enums)
- [ ] Sanity check: write one doc, read it back

### Step 3 — `POST /ingest` with classification STUBBED
Get real emails landing in the DB with the right shape. `classify()` returns hardcoded `IMP` for now — do NOT touch the model yet.
- [ ] Fetch from Gmail → loop new messages
- [ ] Idempotency: skip messages already stored (by `message_id`)
- [ ] Store each as an `Email` (`status=NEW`, stubbed classification)
- [ ] Return counts ingested

### Step 4 — Read endpoints (no model calls)
Now you can *see* your data — makes everything after easier to debug.
- [ ] `GET /counts` → `{IMP, FYI, JNK}` of `status=NEW`
- [ ] `GET /emails?bucket=&status=` → list (no draft text)

> ### ✅ CHECKPOINT: spine alive
> A real email flows inbox → DB → you can list it. Everything before here was mandatory plumbing. Everything after enhances it. **If you only get this far, you still have something real.**

---

### Step 5 — Real classification
Swap the stub. First real Qwen call. You have data flowing, so you can see immediately if buckets make sense.
- [ ] `classify()` → one call returning `{classification, classify_reason, body_summary, priority}` (classify + summarize together)
- [ ] Force JSON-only output, parse defensively
- [ ] Wire the user profile into the prompt (this is what makes it personal)
- [ ] Tune on your real inbox until buckets feel right

### Step 6 — `GET /emails/{id}` with lazy drafting
The heart. Take your time here.
- [ ] Return email + draft (draft `null` for FYI/JNK)
- [ ] If `IMP` and no draft: fetch thread → draft call (strong model, uses profile + tone) → store draft `v1` → set `status=DRAFTED`

### Step 7 — Close the loop: send + archive
**The "it works end to end" moment. Target: end of Weekend 2.**
- [ ] `POST /emails/{id}/send` — body `{text}`, send via Gmail, `status=SENT` (this is the human-in-the-loop gate — only a human click hits it)
- [ ] `POST /emails/{id}/archive` — `status=ARCHIVED`

> ### ✅ CHECKPOINT: end to end
> One email goes inbox → classified → drafted → you click send → it actually sends. This is the project. Ship this polished and you have a real Track 4 submission.

---

### Step 8 — `/redraft` (the wow feature)
Meaningless until 1-7 work. Now it shines.
- [ ] `POST /emails/{id}/redraft` — body `{instruction}`, one focused call, overwrite `current_text`, bump `version`
- [ ] Keep thread context server-side; one call per click, no looping

---

## Mop-up (quick, non-blocking — do whenever)
- [ ] `POST /emails/{id}/dismiss` — `status=DISMISSED`
- [ ] `POST /emails/dismiss-bulk` — body `{ids}`
- [ ] `GET` / `POST /profile`
- [ ] `POST /emails/{id}/reply` — FYI escape-hatch (force a draft on a misclassified FYI)
- [ ] `GET /auth/status` + the "Reconnect Gmail" handling (7-day token expiry)

## Optional polish (only if ahead — week 3)
- [ ] Pre-draft top 2-3 Important emails in the background so opens feel instant
- [ ] Confidence score on classification
- [ ] "Why this draft" rationale in the UI

---

## Tonight's move
Open `gmail.py`. Write `fetch_recent()`. That's the whole decision. Walk the spine.

## Don't forget (the demo-killers)
- [ ] Stub aggressively — never block on building the "perfect" version of a thing
- [ ] Deploy a trivial version to **Alibaba Cloud** in week 1, not week 3
- [ ] **Re-auth Gmail the morning of the demo** (7-day Testing-mode token expiry)
- [ ] LICENSE file committed + visible in repo About

