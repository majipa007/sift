# Sift —  DB Schema

> **Portability note.** Designed against the **Cosmos DB Mongo API** so the exact same driver code runs against **ApsaraDB for MongoDB** on Alibaba Cloud (the hackathon deployment target) with only a connection-string change. Develop on Cosmos if you like; deploy on Alibaba.

## Cosmos specifics to remember
- **No native `enum` type.** Cosmos/JSON stores `string`; enums below are **enforced in the app layer** (Pydantic models in FastAPI). The "Enum" column is your validation contract, not a DB feature.
- **Every item needs an `id`** (string). We use a UUID string.
- **Partition key matters.** All containers partition on `/user_id`. For a single/low-user hackathon app, every query is within one partition → cheap and fast. Don't overthink it.
- **Data types** are JSON: `string`, `number`, `boolean`, `array`, `object`, `null`. There is no separate int/float — `number` covers both. Timestamps are stored as ISO-8601 `string` (or epoch `number`; pick one and be consistent — ISO string recommended for readability).

---

## Container: `profiles`
One per user. Drives personalized classification + draft tone.

**Partition key:** `/user_id`

| Field | Type | Enum / constraint | Notes |
|---|---|---|---|
| `id` | string | UUID | Cosmos item id |
| `user_id` | string | — | Partition key; the Gmail account owner |
| `role` | string | — | e.g. "freelance product designer" |
| `important` | array<string> | — | What counts as important ("client inquiries", "invoices") |
| `junk_rules` | array<string> | — | What's always junk ("cold sales", "promos") |
| `key_senders` | array<string> | — | Emails/domains that always matter |
| `default_tone` | string | `FORMAL` \| `FRIENDLY` \| `CONCISE` | Feeds the drafter |
| `updated_at` | string | ISO-8601 | — |

---

## Container: `emails`
One per ingested email. The trigger writes here; the UI reads here. **No draft text stored here** (drafts churn separately).

**Partition key:** `/user_id`

| Field | Type | Enum / constraint | Notes |
|---|---|---|---|
| `id` | string | UUID | Cosmos item id |
| `user_id` | string | — | Partition key |
| `message_id` | string | unique per user | Gmail message id (idempotency — never ingest twice) |
| `thread_id` | string | — | Gmail thread id; needed to fetch context for drafting |
| `sender` | string | — | From address |
| `subject` | string | — | — |
| `snippet` | string | — | Short preview for list view |
| `body_summary` | string | — | **Summarized** body (produced at classify time); what re-enters the draft prompt. Not the raw body. |
| `classification` | string | `IMP` \| `FYI` \| `JNK` | Set by the classify step |
| `classify_reason` | string | — | One short line — powers the "why this bucket" UI hint |
| `priority` | number | 1–5 (optional) | Ordering within the Important queue |
| `status` | string | `NEW` \| `DRAFTED` \| `SENT` \| `ARCHIVED` \| `DISMISSED` | The real state machine (replaces `visited`) |
| `received_at` | string | ISO-8601 | For ordering newest-first |
| `created_at` | string | ISO-8601 | When Sift ingested it |

**Status lifecycle**
```
IMP:  NEW → (user opens, draft made) DRAFTED → SENT
                                              ↘ ARCHIVED
      NEW → DISMISSED        (ignored without acting)
FYI:  NEW → DISMISSED / ARCHIVED   (read-only by default)
JNK:  NEW → ARCHIVED
```

**Why `status` not `visited`:** a boolean can't separate "drafted but unsent" from "untouched" — and that distinction *is* the Important queue. `status` carries it; keep a separate `reviewed: boolean` only if you want an explicit "seen but parked" flag.

**Indexing:** Cosmos auto-indexes everything by default — fine for a hackathon. If you tune later, the hot query is `WHERE user_id = ? AND classification = ? AND status = 'NEW'`.

---

## Container: `drafts`
Separate container because the re-draft loop overwrites `current_text` and bumps `version` repeatedly — you don't want to rewrite the whole email item each time. One draft per email (latest wins).

**Partition key:** `/user_id`

| Field | Type | Enum / constraint | Notes |
|---|---|---|---|
| `id` | string | UUID | Cosmos item id |
| `user_id` | string | — | Partition key |
| `email_id` | string | FK → `emails.id` | The email this draft replies to |
| `thread_id` | string | — | Carried for context on re-draft |
| `current_text` | string | — | The live draft the UI shows |
| `version` | number | int ≥ 1 | Bumps on each re-draft |
| `last_instruction` | string \| null | — | The tweak the user last gave ("more formal") |
| `updated_at` | string | ISO-8601 | — |

---

## Container: `tokens`
**Kept separate on purpose** — OAuth credentials are a different security concern from email data. A leak in email data shouldn't expose Gmail access.

**Partition key:** `/user_id`

| Field | Type | Enum / constraint | Notes |
|---|---|---|---|
| `id` | string | UUID | Cosmos item id |
| `user_id` | string | — | Partition key |
| `refresh_token` | string | — | **Encrypt at rest.** Expires after 7 days in OAuth Testing mode — handle re-auth. |
| `access_token` | string | — | Short-lived |
| `expires_at` | string | ISO-8601 | Drives the `/auth/status` check |
| `updated_at` | string | ISO-8601 | — |

---

## App-layer enum contract (FastAPI / Pydantic)
Since Cosmos won't enforce these, define them once and validate on write:

```python
from enum import Enum

class Classification(str, Enum):
    IMP = "IMP"
    FYI = "FYI"
    JNK = "JNK"

class EmailStatus(str, Enum):
    NEW = "NEW"
    DRAFTED = "DRAFTED"
    SENT = "SENT"
    ARCHIVED = "ARCHIVED"
    DISMISSED = "DISMISSED"

class Tone(str, Enum):
    FORMAL = "FORMAL"
    FRIENDLY = "FRIENDLY"
    CONCISE = "CONCISE"
```
