# Sift — Backend Plan

**Stack:** FastAPI · MongoDB · Gmail API · LangGraph (agent layer — see `AGENT_PLAN.md`) · deployed on **Alibaba Cloud**.

The backend's job: own the Gmail connection, run ingestion, hand emails to the agent, persist everything, and expose a small clean API to the frontend. Keep it boring and reliable — the cleverness lives in the agent layer.

---

## Responsibilities

1. **Auth** — Gmail OAuth (Testing mode), token storage + refresh.
2. **Ingestion** — pull new mail, normalize it, store metadata.
3. **Orchestration trigger** — kick the agent pipeline on new mail.
4. **Persistence** — profiles, emails, drafts, summaries.
5. **API** — endpoints the frontend calls.
6. **Actions** — send / archive via Gmail, only when the frontend says a human approved.

---

## Gmail API — the real-world notes

**Scopes (request the narrowest set that still works):**

- `gmail.readonly` — read inbox + threads.
- `gmail.send` — send the approved reply.
- `gmail.modify` — archive (remove `INBOX` label). *Covers readonly too; pick `modify` + `send` and you have everything.*

Both are **restricted** scopes, but for a hackathon you stay in **OAuth Testing mode** → no verification, no security assessment. Add yourself (and judges) as test users; click through the "unverified app" screen.

**The gotcha that will bite you:** in Testing mode, refresh tokens **expire after 7 days**. Your background trigger will silently die. Mitigations:

- Store tokens; detect 401/invalid-grant and surface a "Reconnect Gmail" state to the frontend.
- **Re-authorize the morning of the demo.** Put a reminder in the code comments.

**Trigger choice — start simple:**

- **Polling** (recommended for the hackathon): a scheduled job hits `users.messages.list` with `historyId` / a "newer than" query every N minutes. Dead simple, easy to demo, no public webhook endpoint needed.
- *Gmail push (Pub/Sub)* is more elegant but needs a public HTTPS endpoint + Cloud Pub/Sub setup. **Skip it** unless you finish early — it's not worth the week-3 risk.

---

## Data model (MongoDB)

```
profiles
  _id
  user_id
  role: string
  important: [string]
  junk_rules: [string]
  key_senders: [string]
  default_tone: "formal" | "friendly" | "concise"
  updated_at

emails
  _id
  user_id
  gmail_id
  thread_id
  from, subject, snippet, received_at
  body_summary: string        # summarized, NOT full body — token discipline
  bucket: "needs_reply" | "fyi" | "junk"
  classify_reason: string     # short, for the UI + transparency
  priority: int               # optional ordering within a queue
  status: "new" | "drafted" | "sent" | "archived" | "dismissed"
  created_at

drafts
  _id
  email_id
  thread_id
  current_text: string
  version: int                # bumps on each re-draft
  last_instruction: string    # the tweak the user gave, if any
  updated_at

tokens
  _id
  user_id
  refresh_token, access_token, expires_at
```

**Why `body_summary` not full body:** the full context gets passed to the model on drafts. Storing + reusing a summary keeps prompts lean (your ROI instinct, baked into the schema). Keep the raw body only as long as you need it.

---

## API surface (small on purpose)

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/auth/login` | Start Gmail OAuth |
| `GET` | `/auth/callback` | OAuth callback, store tokens |
| `GET` | `/auth/status` | Is the token alive? (drives "Reconnect" UI) |
| `POST` | `/profile` | Create/update the user profile |
| `GET` | `/profile` | Fetch profile (prefill onboarding) |
| `POST` | `/ingest` | Pull + classify new mail (also runs on the schedule) |
| `GET` | `/emails?bucket=` | List emails in a queue |
| `GET` | `/emails/{id}` | Email + its draft |
| `POST` | `/redraft` | `{email_id, instruction}` → new draft in place |
| `POST` | `/emails/{id}/send` | Send the (approved) draft via Gmail |
| `POST` | `/emails/{id}/archive` | Archive via Gmail |

**Human-in-the-loop lives here:** the agent *never* calls `send`. Only the `/send` endpoint sends, and it's only ever hit by a human clicking Send in the UI. That separation is the whole safety story — keep it clean.

---

## Alibaba Cloud deployment (a requirement, not an afterthought)

- **Compute:** an **ECS** instance running FastAPI (uvicorn behind nginx) is the simplest, most demoable option. *Function Compute / Serverless App Engine* also works if you prefer serverless — but ECS is easier to reason about for a solo build.
- **Database:** **ApsaraDB for MongoDB** (managed) or self-hosted Mongo on the same ECS box. Managed is less hassle.
- **The proof artifact:** keep a clearly named file (e.g. `backend/alibaba/deployment.md` + a module that calls an Alibaba SDK/service) so you can link "a code file that demonstrates use of Alibaba Cloud services and APIs" as the submission requires.
- **Do it in week 1.** Deploy a trivial FastAPI "hello" to Alibaba Cloud early so deployment is never a week-3 surprise.

---

## Token & cost discipline (backend's share of it)

- Store **summaries**, not full bodies, for anything that re-enters a prompt.
- Cache classification results — never re-classify the same email.
- The classify step uses a **cheap Qwen model**; only drafting uses the stronger one (orchestrated in the agent layer).
- Re-draft is **one call**, not a conversation — the endpoint takes the current draft + one instruction and returns one new draft.

---

## Build order

1. Gmail auth + read (Week 1, weekdays).
2. Gmail send (Week 1 — clear the maybe-wall).
3. Trivial FastAPI on Alibaba Cloud (Week 1).
4. Mongo schema + ingestion endpoint (Weekend 1).
5. Wire the agent pipeline behind `/ingest` (Weekend 2).
6. `/send`, `/archive`, `/redraft` (Weekend 2–3).
7. `/auth/status` + token-expiry handling (Week 3).
