# Sift — Frontend API Contract

This doc is the **frontend-facing contract** for Sift.

`API_DESIGN.md` explains the product and backend behavior.
This file explains the actual request/response shapes the UI should build against.

Keep the payloads boring and stable. The frontend should not need to infer meaning from loosely shaped JSON.

---

## Conventions

### Base assumptions

- All responses are JSON.
- Timestamps are ISO-8601 strings.
- Enum values are uppercase in the API.
- `id` is the app/database id.
- `message_id` is the Gmail message id.
- `thread_id` is the Gmail thread id.

### Enums

```ts
type Classification = 'IMP' | 'FYI' | 'JNK'
type EmailStatus = 'NEW' | 'DRAFTED' | 'SENT' | 'ARCHIVED' | 'DISMISSED'
type Tone = 'FORMAL' | 'FRIENDLY' | 'CONCISE'
```

### Error shape

Use one consistent error envelope:

```json
{
  "error": {
    "code": "AUTH_EXPIRED",
    "message": "Reconnect Gmail to continue.",
    "details": null
  }
}
```

Recommended `error.code` values:

- `AUTH_EXPIRED`
- `NOT_FOUND`
- `INVALID_INPUT`
- `DRAFT_FAILED`
- `SEND_FAILED`
- `ARCHIVE_FAILED`
- `INTERNAL_ERROR`

---

## Shared response models

### Queue counts

```json
{
  "IMP": 12,
  "FYI": 30,
  "JNK": 20
}
```

### Email list item

Used by `GET /emails`.

```json
{
  "id": "email_123",
  "message_id": "196e8b1a4b3",
  "thread_id": "196e8b19f22",
  "sender": "Maria Chen <maria@northstar.studio>",
  "subject": "Can we confirm the revised launch copy today?",
  "snippet": "We are aligned on the structure. Need your sign-off before I send the final deck.",
  "classify_reason": "Direct client request that requires approval today.",
  "priority": 4,
  "classification": "IMP",
  "status": "NEW",
  "received_at": "2026-06-21T10:24:00Z"
}
```

### Draft object

```json
{
  "email_id": "email_123",
  "thread_id": "196e8b19f22",
  "current_text": "Hi Maria,\n\nThe revised copy looks good to me...",
  "version": 2,
  "last_instruction": "Make it slightly more formal.",
  "updated_at": "2026-06-21T10:28:00Z"
}
```

### Full email detail

Used inside `GET /emails/{id}`.

```json
{
  "id": "email_123",
  "message_id": "196e8b1a4b3",
  "thread_id": "196e8b19f22",
  "sender": "Maria Chen <maria@northstar.studio>",
  "subject": "Can we confirm the revised launch copy today?",
  "snippet": "We are aligned on the structure. Need your sign-off before I send the final deck.",
  "body_text": "Hi Sulav,\n\nWe have incorporated the comments...",
  "body_summary": "Client requests same-day approval of revised launch copy.",
  "classify_reason": "Direct client request that requires approval today.",
  "priority": 4,
  "classification": "IMP",
  "status": "DRAFTED",
  "received_at": "2026-06-21T10:24:00Z",
  "created_at": "2026-06-21T10:25:00Z"
}
```

`body_text` is the user-facing original content.
`body_summary` is the model-facing summary that can also help with debug/transparency.

---

## Endpoints

## 1. Auth

### `GET /auth/login`

Purpose: start Gmail OAuth.

Behavior:
- Usually returns a redirect response, not JSON.
- Frontend should navigate the browser directly to this URL.

Frontend use:
- Do not `fetch()` this in JS.
- Use `window.location.href = '/auth/login'`.

### `GET /auth/callback`

Purpose: OAuth callback target.

Behavior:
- Usually handled server-side.
- Recommended outcome: backend stores tokens and redirects to frontend.

Recommended redirect targets:
- success: `/`
- failure: `/onboarding?auth=failed`

### `GET /auth/status`

Purpose: tell the UI whether Gmail is connected.

Response:

```json
{
  "connected": true,
  "expires_at": "2026-06-28T10:00:00Z"
}
```

Disconnected example:

```json
{
  "connected": false,
  "expires_at": null
}
```

Frontend use:
- Call on app load.
- If `connected=false`, show reconnect state and disable send/archive/redraft actions.

---

## 2. Profile

### `GET /profile`

Purpose: prefill onboarding/profile form.

Response:

```json
{
  "role": "Freelance product designer",
  "important": ["Client inquiries", "Invoices"],
  "junk_rules": ["Cold sales outreach", "Promotional newsletters"],
  "key_senders": ["maria@northstar.studio", "finance@acme.co"],
  "default_tone": "FORMAL",
  "updated_at": "2026-06-21T09:00:00Z"
}
```

Empty-state option:

```json
null
```

If you prefer to avoid `null`, return a fully empty object with arrays and `default_tone` set.

### `POST /profile`

Purpose: create or update the profile.

Request:

```json
{
  "role": "Freelance product designer",
  "important": ["Client inquiries", "Invoices"],
  "junk_rules": ["Cold sales outreach", "Promotional newsletters"],
  "key_senders": ["maria@northstar.studio", "finance@acme.co"],
  "default_tone": "FORMAL"
}
```

Response:

```json
{
  "ok": true,
  "profile": {
    "role": "Freelance product designer",
    "important": ["Client inquiries", "Invoices"],
    "junk_rules": ["Cold sales outreach", "Promotional newsletters"],
    "key_senders": ["maria@northstar.studio", "finance@acme.co"],
    "default_tone": "FORMAL",
    "updated_at": "2026-06-21T09:00:00Z"
  }
}
```

---

## 3. Ingest

### `POST /ingest`

Purpose: pull new Gmail messages, classify them, store them.

Frontend note:
- This is mostly a backend/scheduled-job endpoint.
- It can still be useful for a manual `Refresh inbox` button during development.

Request body:

```json
{}
```

Optional future body:

```json
{
  "limit": 20,
  "since": "2026-06-21T00:00:00Z"
}
```

Response:

```json
{
  "ok": true,
  "ingested": {
    "IMP": 2,
    "FYI": 5,
    "JNK": 3
  },
  "skipped": 7
}
```

---

## 4. Queue counts

### `GET /counts`

Purpose: sidebar counts.

Response:

```json
{
  "IMP": 12,
  "FYI": 30,
  "JNK": 20
}
```

Frontend mapping:
- `IMP` → `needs_reply`
- `FYI` → `fyi`
- `JNK` → `junk`

---

## 5. Queue listing

### `GET /emails?bucket=IMP&status=NEW`

Purpose: fetch one queue.

Query params:

- `bucket`: `IMP | FYI | JNK`
- `status`: default `NEW`

Response:

```json
{
  "items": [
    {
      "id": "email_123",
      "message_id": "196e8b1a4b3",
      "thread_id": "196e8b19f22",
      "sender": "Maria Chen <maria@northstar.studio>",
      "subject": "Can we confirm the revised launch copy today?",
      "snippet": "We are aligned on the structure. Need your sign-off before I send the final deck.",
      "classify_reason": "Direct client request that requires approval today.",
      "priority": 4,
      "classification": "IMP",
      "status": "NEW",
      "received_at": "2026-06-21T10:24:00Z"
    }
  ]
}
```

Frontend notes:
- Do not expect draft text here.
- Keep list rows dense.
- Use `classify_reason` in a secondary place if needed, not as the main row text.

---

## 6. Open one email

### `GET /emails/{id}`

Purpose: fetch the selected email and its current draft.

Response for Important email:

```json
{
  "email": {
    "id": "email_123",
    "message_id": "196e8b1a4b3",
    "thread_id": "196e8b19f22",
    "sender": "Maria Chen <maria@northstar.studio>",
    "subject": "Can we confirm the revised launch copy today?",
    "snippet": "We are aligned on the structure. Need your sign-off before I send the final deck.",
    "body_text": "Hi Sulav,\n\nWe have incorporated the comments...",
    "body_summary": "Client requests same-day approval of revised launch copy.",
    "classify_reason": "Direct client request that requires approval today.",
    "priority": 4,
    "classification": "IMP",
    "status": "DRAFTED",
    "received_at": "2026-06-21T10:24:00Z",
    "created_at": "2026-06-21T10:25:00Z"
  },
  "draft": {
    "email_id": "email_123",
    "thread_id": "196e8b19f22",
    "current_text": "Hi Maria,\n\nThe revised copy looks good to me...",
    "version": 2,
    "last_instruction": "Make it slightly more formal.",
    "updated_at": "2026-06-21T10:28:00Z"
  }
}
```

Response for FYI/Junk email:

```json
{
  "email": {
    "id": "email_456",
    "message_id": "196e8b1a7c1",
    "thread_id": "196e8b1a7c1",
    "sender": "Outbound Growth <hello@hyperpipeline.ai>",
    "subject": "Double your response rate this quarter",
    "snippet": "We noticed your team could benefit from our outbound engine.",
    "body_text": "Hi there,\n\nWe help teams double their response rates...",
    "body_summary": "Cold outbound sales pitch.",
    "classify_reason": "Cold sales outreach that matches the junk rules.",
    "priority": 1,
    "classification": "JNK",
    "status": "NEW",
    "received_at": "2026-06-21T08:00:00Z",
    "created_at": "2026-06-21T08:02:00Z"
  },
  "draft": null
}
```

Frontend notes:
- This endpoint may be slower for Important emails because it can lazily generate the first draft.
- Show a draft-loading state on open.

---

## 7. Send

### `POST /emails/{id}/send`

Purpose: send approved or manually edited draft.

Request:

```json
{
  "text": "Hi Maria,\n\nThe revised copy looks good to me..."
}
```

Response:

```json
{
  "ok": true,
  "email_id": "email_123",
  "status": "SENT",
  "gmail_message_id": "196e8b31f91"
}
```

Frontend notes:
- After success, remove the email from the active queue or refetch counts + queue.
- No separate `approve` endpoint is needed.

---

## 8. Redraft

### `POST /emails/{id}/redraft`

Purpose: rewrite the current draft with one instruction.

Request:

```json
{
  "instruction": "Make it more formal and mention I am available Thursday morning."
}
```

Response:

```json
{
  "draft": {
    "email_id": "email_123",
    "thread_id": "196e8b19f22",
    "current_text": "Hi Maria,\n\nThe revised copy looks good to me...",
    "version": 3,
    "last_instruction": "Make it more formal and mention I am available Thursday morning.",
    "updated_at": "2026-06-21T10:30:00Z"
  }
}
```

Frontend notes:
- Replace draft text in place.
- Do not render draft history UI in v1.

---

## 9. FYI reply escape hatch

### `POST /emails/{id}/reply`

Purpose: force a first draft for an FYI email that actually needs a response.

Request:

```json
{}
```

Response:

```json
{
  "email": {
    "id": "email_789",
    "classification": "FYI",
    "status": "DRAFTED"
  },
  "draft": {
    "email_id": "email_789",
    "thread_id": "196e8b55f02",
    "current_text": "Hi Nikhil,\n\nThanks for sharing the report...",
    "version": 1,
    "last_instruction": null,
    "updated_at": "2026-06-21T11:00:00Z"
  }
}
```

Frontend notes:
- Once called, the UI can treat this like a draftable email.
- If you want less complexity, this can ship after the core loop.

---

## 10. Archive

### `POST /emails/{id}/archive`

Purpose: remove from inbox and queue.

Request:

```json
{}
```

Response:

```json
{
  "ok": true,
  "email_id": "email_456",
  "status": "ARCHIVED"
}
```

---

## 11. Dismiss

### `POST /emails/{id}/dismiss`

Purpose: clear from queue without Gmail archive.

Request:

```json
{}
```

Response:

```json
{
  "ok": true,
  "email_id": "email_456",
  "status": "DISMISSED"
}
```

### `POST /emails/dismiss-bulk`

Request:

```json
{
  "ids": ["email_456", "email_457", "email_458"]
}
```

Response:

```json
{
  "ok": true,
  "updated": 3
}
```

---

## Frontend type mapping

If the frontend wants cleaner names, map API models into UI models at the API boundary.

Example UI model:

```ts
type Bucket = 'needs_reply' | 'fyi' | 'junk'

interface EmailRecord {
  id: string
  bucket: Bucket
  priority: number
  sender: string
  subject: string
  snippet: string
  classifyReason: string
  receivedAt: string
  bodyText?: string
  draft: {
    currentText: string
    version: number
    lastInstruction: string | null
    updatedAt: string
  } | null
}
```

Recommended mapping:

- `IMP` → `needs_reply`
- `FYI` → `fyi`
- `JNK` → `junk`
- `classify_reason` → `classifyReason`
- `received_at` → `receivedAt`
- `body_text` → `bodyText`
- `current_text` → `currentText`
- `last_instruction` → `lastInstruction`
- `updated_at` → `updatedAt`

---

## Integration plan for the frontend

The backend is being built separately, so the frontend should integrate in layers.

### Step 1 — Add an API module boundary

Create a thin client layer, for example:

```text
frontend/src/api/
  client.ts
  auth.ts
  profile.ts
  emails.ts
  mappers.ts
  types.ts
```

Responsibilities:

- `client.ts`: shared `fetch` wrapper, JSON parsing, error handling
- `types.ts`: raw API types from this doc
- `mappers.ts`: convert raw API shapes into UI shapes
- `emails.ts`: queue/detail/action calls
- `profile.ts`: onboarding/profile calls
- `auth.ts`: auth status + reconnect helpers

### Step 2 — Keep UI state separate from API state

Do not let components work directly with raw backend JSON.

Recommended split:

- API layer returns normalized frontend models
- components only consume normalized models

That means if backend names change from `classify_reason` to `reason`, only one mapper changes.

### Step 3 — Replace mock flows in this order

1. `GET /auth/status`
2. `GET /counts`
3. `GET /emails?bucket=&status=`
4. `GET /emails/{id}`
5. `POST /profile`
6. `POST /emails/{id}/archive`
7. `POST /emails/{id}/send`
8. `POST /emails/{id}/redraft`
9. `POST /emails/{id}/dismiss`
10. `POST /ingest` only if you want a manual refresh button

Why this order:

- counts + lists make the cockpit real first
- detail fetch unlocks the main panel
- archive/send give end-to-end movement
- redraft comes last because it is the most AI-specific interaction

### Step 4 — Introduce one fetch wrapper

Example responsibilities for `api/client.ts`:

- prepend base URL
- set JSON headers
- parse error envelope
- throw a typed error with `code` and `message`

Pseudo-shape:

```ts
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T>
```

### Step 5 — Suggested frontend functions

```ts
getAuthStatus(): Promise<AuthStatus>
getProfile(): Promise<Profile | null>
saveProfile(input: SaveProfileInput): Promise<Profile>

getCounts(): Promise<QueueCounts>
getEmails(bucket: Bucket): Promise<EmailListItem[]>
getEmail(id: string): Promise<EmailDetail>

sendEmail(id: string, text: string): Promise<void>
redraftEmail(id: string, instruction: string): Promise<Draft>
archiveEmail(id: string): Promise<void>
dismissEmail(id: string): Promise<void>
replyToFyiEmail(id: string): Promise<Draft>
triggerIngest(): Promise<IngestSummary>
```

### Step 6 — Loading states to wire per endpoint

- app load: `auth status`, then counts, then initial queue
- queue change: list loading only
- email open: detail loading only
- important email open with no draft: draft-loading state inside detail pane
- send/archive/dismiss: disable action bar while request is in flight
- redraft: disable redraft button and show draft-generation state

### Step 7 — Recommended refresh behavior

After successful actions:

- `send` / `archive` / `dismiss`
  - remove item locally from current queue immediately
  - then refetch `GET /counts`
  - optionally refetch current queue in background

- `redraft`
  - replace only the draft in local state
  - no need to refetch queue counts

- `profile save`
  - update local profile state
  - no need to reload queues immediately unless you want re-ingest behavior

### Step 8 — Error handling rules

- `AUTH_EXPIRED`
  - show reconnect banner
  - disable send/archive/redraft
- `NOT_FOUND`
  - remove stale item from UI and refetch queue
- `INVALID_INPUT`
  - show inline validation message
- `DRAFT_FAILED` / `SEND_FAILED` / `ARCHIVE_FAILED`
  - keep current UI state intact
  - show toast/inline error

### Step 9 — What the frontend should not assume

- Do not assume every Important email already has a draft.
- Do not assume `version > 1` means draft history is available.
- Do not assume `POST /ingest` returns the queue items themselves.
- Do not assume auth failure will only appear on `/auth/status`; action endpoints can fail too.

---

## Recommended backend implementation rules for frontend stability

If you keep these stable, frontend integration stays easy:

- Always return the same envelope shape per endpoint.
- Keep enum values uppercase in the API.
- Return `draft: null` explicitly when there is no draft.
- Keep timestamps present and ISO-formatted.
- Return `classify_reason` and `priority` consistently in both list and detail payloads.
- On `send/archive/dismiss`, return the final `status` in the response.

---

## Minimum viable backend for frontend integration

If you want the smallest useful backend surface for the UI to become real, implement these first:

1. `GET /auth/status`
2. `GET /counts`
3. `GET /emails?bucket=&status=`
4. `GET /emails/{id}`
5. `POST /emails/{id}/archive`
6. `POST /emails/{id}/send`
7. `POST /emails/{id}/redraft`
8. `GET /profile`
9. `POST /profile`

Everything else can follow after the main cockpit is alive.
