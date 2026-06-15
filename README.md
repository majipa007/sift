# Sift — Personalized Inbox Triage Agent

Sift is a personalized, human-in-the-loop email triage agent for Gmail. You tell it who you are and what matters to you; it watches your inbox, sorts every incoming email into **Needs Reply / FYI / Junk**, drafts genuinely context-aware replies for the ones that need them, and surfaces everything in a simple UI where you approve, tweak, or send. Nothing leaves your account without your say-so.

It is an **agent, not a chatbot** — it acts on a real trigger (an email arrives), invokes real tools (the Gmail API), handles ambiguous input (raw email is messy), and pauses for a human at the one moment that matters (before anything sends). That is the Track 4 rubric, almost word for word.

---

## The one-liner

*Tell Sift who you are and what matters. It reads your inbox, sorts it, drafts the replies you'd actually send, and waits for your nod before doing anything.*

---

## Why this project

- **Bounded on purpose.** One inbox, three buckets, three actions (send / edit-then-send / archive). The tight scope is the design, not a limitation — it's what makes a *finished, polished* thing possible solo in 25 days.
- **Production-flavored, not a toy.** Real Gmail connector, real OAuth, real tool use, a real human checkpoint. Emphasis on something a person would actually keep using.
- **Token-conscious by design.** A personalization profile up front means sharper, shorter prompts. Classification runs on a cheap model; drafting on a stronger one; the re-draft loop is a single focused call, never a spiraling chat. Good ROI is the whole point.
- **Plays to strengths, dodges gaps.** Leans on solid backend + real understanding of how LLMs behave. Does not require deep multi-agent orchestration.

---

## How it works (90 seconds)

1. **Onboard.** You fill a short structured profile: your role, what counts as *important*, what's always *junk*, senders that always matter.
2. **Ingest.** Sift pulls new mail from Gmail.
3. **Classify.** A lightweight model sorts each email into Needs Reply / FYI / Junk, using *your* profile — so the same newsletter that's junk to one person is FYI to another.
4. **Draft.** For Needs-Reply emails, a stronger model drafts a context-aware response using the thread history.
5. **You decide.** In the UI: read it, edit it inline, type a tweak ("make it more formal", "mention I'm out Friday") to re-draft, then **Send** — or **Archive** the junk. Nothing is automatic.

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Models | **Qwen** (`qwen-turbo` for classify, `qwen-plus`/`qwen-max` for draft) via Qwen Cloud / DashScope | Tiered for token efficiency |
| Orchestration | **LangGraph** | State machine + human-in-the-loop interrupt |
| Backend | **FastAPI** | Deployed on **Alibaba Cloud** (hackathon requirement) |
| Database | **MongoDB** (ApsaraDB for MongoDB on Alibaba Cloud, or self-hosted on ECS) | Profiles, email metadata, drafts, summaries |
| Email | **Gmail API** | Restricted scopes; Testing-mode OAuth |
| Frontend | **React** (lightweight) | Three-queue sidebar + email detail pane |

---

## Repository layout (planned)

```
sift/
├── README.md
├── LICENSE                 # OSS license — REQUIRED, must show in repo "About"
├── docs/
│   ├── PROJECT_PLAN.md
│   ├── FRONTEND_PLAN.md
│   ├── BACKEND_PLAN.md
│   └── AGENT_PLAN.md
├── backend/
│   ├── app/
│   ├── alibaba/            # deployment config — the Alibaba Cloud proof lives here
│   └── requirements.txt
└── frontend/
    └── src/
```

---

## Hackathon submission checklist

- [ ] Public repo, **OSS license file** visible in the repo About section
- [ ] **Proof of Alibaba Cloud deployment** — short recording + a linked code file showing Alibaba Cloud services/APIs in use
- [ ] **Architecture diagram** (Qwen Cloud → backend → DB → frontend)
- [ ] **~3-min demo video** (public on YouTube/Vimeo)
- [ ] **Text description** of features + functionality
- [ ] **Track identified:** Track 4 — Autopilot Agent
- [ ] *(Optional)* Blog/social post on the build journey → Blog Post Prize

---

## Status

Pre-build. Gmail API access path confirmed: **reading + sending both work with no verification as long as the OAuth app stays in Testing mode.** Watch the 7-day refresh-token expiry in Testing mode — re-authorize the morning of the demo.

See `docs/` for the full plan.
