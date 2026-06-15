# Sift — Project Plan

## Time budget

| Block | Sessions | Hours |
|---|---|---|
| 3 weekends | 5 hrs × 2 days each | ~30 |
| ~15 weekdays | 1–2 hrs | ~20–30 |
| **Total** | | **~50–60** |

---

## Guiding rules

1. **The core loop ships first, everything else is decoration.** Get one email all the way from inbox to approved-send by end of Weekend 2, even if ugly.
2. **No email client features.** Three actions only: send, edit-then-send, archive. Every hour spent making it look like Gmail is stolen from the agent, which is what's judged.
3. **Deploy early, deploy often.** The Alibaba Cloud deployment is a *requirement*, not a final step. Get a "hello world" FastAPI running on Alibaba Cloud in week 1 so it's never a surprise.
4. **Token discipline from day one.** Tiered models, structured profile, summaries-not-bodies in context. (Detailed in `AGENT_PLAN.md`.)

---

## Milestones

### Week 1 — Foundation (weekdays + Weekend 1)

**Goal: plumbing works end to end, even if dumb.**

- [x] Day 1–2 (weekday): Gmail Cloud Console setup — project, enable Gmail API, OAuth consent screen in **Testing** mode, add yourself as test user, pull credentials. Confirm you can **read** mail from a script.
- [x] Day 2–3 (weekday): Confirm you can **send** a mail from a script. (This is the maybe-wall — clear it now.)
- [ ] Day 3–4 (weekday): Spin up FastAPI skeleton. Deploy a trivial version to **Alibaba Cloud** (ECS or Function Compute). Prove the pipeline exists.
- [ ] **Weekend 1:**
  - [ ] MongoDB schema + connection (profiles, emails, drafts).
  - [ ] Ingestion endpoint: fetch N recent emails, store metadata.
  - [ ] First Qwen call: classify one email into a bucket (no UI yet, just logs).
  - [ ] Bare React skeleton: three empty queues + a detail pane.

**Exit check:** an email in your real inbox shows up in the right queue in a browser.

### Week 2 — The Agent (weekdays + Weekend 2)

**Goal: the core loop is real.**

- [ ] Weekdays: build the **onboarding profile** form + storage. Wire the profile into the classification prompt.
- [ ] Weekdays: tune classification quality across the three buckets on your own inbox.
- [ ] **Weekend 2:**
  - [ ] LangGraph pipeline: ingest → classify → route → (draft | store) → human checkpoint. (See `AGENT_PLAN.md`.)
  - [ ] **Context-aware drafting** for Needs-Reply: pull thread, draft with the stronger Qwen model. This is the wow feature — spend quality budget here.
  - [ ] Drafts render in the UI next to the original email.
  - [ ] **Send** and **Archive** wired through the Gmail API, gated behind a human click.

**Exit check:** one email goes inbox → classified → drafted → you click Send → it actually sends. End to end.

### Week 3 — Polish + Submission (weekdays + Weekend 3)

**Goal: it feels real, and it's submitted.**

- [ ] Weekdays: the **"ask AI to tweak"** re-draft loop (single focused call, keep thread context, cap it — don't let it spiral).
- [ ] Weekdays: error states, empty states, loading states. Make the demo path bulletproof.
- [ ] **Weekend 3:**
  - [ ] Finalize Alibaba Cloud deployment + record the **deployment proof** clip; link the code file that uses Alibaba services.
  - [ ] **Architecture diagram.**
  - [ ] Record the **~3-min demo video** (script it — see below).
  - [ ] Write the **text description**, confirm **OSS license** shows in repo About.
  - [ ] *(Optional)* Blog post for the bonus prize.
- [ ] **Buffer days (final weekdays):** re-test everything, re-auth Gmail token, submit early. **Do not submit on the last day.**

**Exit check:** submission complete, demo rehearsed, token freshly re-authed.

---

## Demo video script (≈3 min)

1. **(20s) The hook.** "Everyone's inbox is full of three things: stuff you must reply to, stuff you just need to know, and noise. Sift sorts all three — and drafts the replies for you."
2. **(30s) Onboarding.** Show the profile. "I tell it I'm a [role], client emails are important, newsletters are FYI." This is your *ambiguous-input → personalization* beat.
3. **(60s) The triage.** Show the three populated queues. Open a Needs-Reply email, show the context-aware draft.
4. **(40s) The money shot.** Type a tweak — "make this more formal, mention I'm traveling Friday." Watch it re-draft live. Then click Send.
5. **(20s) Close.** "Real Gmail, real tool use, human approves everything, running on Alibaba Cloud with Qwen. Track 4." Show the architecture diagram.

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Gmail send blocked by scopes | Low (Testing mode works) | Confirmed in week 1; fallback = "draft + copy to clipboard" |
| 7-day token expiry kills demo | Medium | Re-auth the morning of the demo; note it in code |
| Classification feels dumb | Medium | The profile is the fix; tune on real inbox in week 2 |
| Alibaba deploy eats a weekend | Medium | Deploy trivial version in week 1, not week 3 |
| Scope creep (building an email client) | **High** | Three actions only. Re-read rule #2 weekly. |
| Re-draft loop spirals into a chatbot | Medium | Cap it; single call; it's a tool not a conversation |

---

## Definition of done

A stranger can: connect their Gmail, fill the profile, see their inbox sorted into three buckets, open a Needs-Reply email, read a draft that actually fits the thread, tweak it in plain English, and send it — all from Sift, with the backend running on Alibaba Cloud and Qwen doing the thinking.
