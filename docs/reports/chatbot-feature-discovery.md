# IlliniGuide Chatbot — Feature Discovery

> Discovery pass over the existing chatbot to identify high-value features to build next.
> Grounded in the current codebase (`app/`, `api/`), the accepted ADRs, and the stubbed
> product surfaces (Courses / Resume landing pages are waitlists today).

## 1. What the chatbot already does

| Area | Status | Where |
|------|--------|-------|
| Agentic RAG loop (act → observe → stop) | ✅ Live | `api/src/agent/loop.ts`, `system.md` |
| Hybrid retrieval (pgvector + Postgres FTS + RRF) | ✅ Live | `api/src/lib/supabase-rpc.ts`, `tools/search-knowledge-base.ts` |
| Tools: `search_knowledge_base`, `web_search` (Tavily), `grep_docs`, `custom-skills` | ✅ Live | `api/src/tools/` |
| Custom skills: `campus_navigation`, `compare_dorms`, `find_by_criteria` | ✅ Live (all dorm/nav scoped) | `api/src/skills/` |
| Memory: AI persona (soul), user profile memory, conversation memory | ✅ Service exists | `app/src/services/memoryService.ts` |
| Conversation history (Supabase + local), pin/rename | ✅ Live | `conversationService.ts`, `localConversationService.ts` |
| Bilingual EN/ZH responses (follows site language) | ✅ Live | ADR-0003, `agent/prompts/language-*.md` |
| Streaming SSE, thinking process, tool status, follow-up questions | ✅ Live | `components/chat/` |
| Static starter suggestions (4 fixed prompts) | ✅ Live | `i18n/uiText.ts` |

**Coverage is strong for dorms/housing and general campus Q&A, and thin everywhere else.**
Courses, the academic calendar, dining, and resume help are either ADR-designed-but-unbuilt
or sitting behind "coming soon" waitlist landing pages.

## 2. Recommended features (prioritized)

### Tier 1 — Flagship domain agents (highest impact, partly pre-designed)

1. **Course Explorer agent** — *ADR-0005 is already accepted; `CoursesLandingPage` is just a waitlist.*
   - New tools/skills: find courses by criteria (GenEd, credit hours, level, department),
     prerequisite-aware discovery, term-offering lookup, and side-by-side course comparison
     (mirror the existing `compare_dorms` / `find_by_criteria` skill pattern).
   - Stays within ADR scope: **no** live seat/enrollment/waitlist state.
   - Why first: ADR groundwork done, a real product surface is already stubbed, and it's the
     single most-asked student question category not yet covered.

2. **Academic deadline / calendar agent** — *ADR-0008 (`academic_calendar_item`) is accepted.*
   - Answer "when is the drop deadline / refund cutoff / registration window?" from a
     source-grounded calendar index.
   - High-value add-on: **`.ics` export / "add to calendar"** for any deadline the bot surfaces.
   - Pairs naturally with proactive reminders (Tier 3).

3. **Resume agent** — *`ResumeLandingPage` is a waitlist today.*
   - Resume review/tailoring grounded in UIUC career resources (CARS, college career centers).
   - Accept a pasted resume or screenshot (see image input, Tier 2) and return targeted edits.

### Tier 2 — Conversational UX upgrades (low effort, broad benefit)

4. **Message actions + feedback loop** — copy, regenerate, edit-and-resend, and 👍/👎.
   Thumbs feed an eval/quality signal. The thread UI (`ChatThread.tsx`) has none of these today.

5. **Context-aware starter suggestions** — replace the 4 static prompts with suggestions that
   adapt to time of term (registration week, finals, move-in) and to the user's stored profile
   (major/year/international status). Infrastructure (`memoryService`, `i18n`) already exists.

6. **Voice + image input** — students are mobile-first.
   - Speech-to-text for input and optional read-aloud (accessibility).
   - Image Q&A: upload a schedule screenshot, a dorm photo, or a resume image.

7. **Inline source citations** — render clickable, deduped source cards/footnotes for
   knowledge-base and web results (the system prompt already asks for source URLs; surface them
   as first-class UI rather than inline markdown only). Reinforces trust.

### Tier 3 — Personalization & proactivity

8. **Memory management UI** — let users view/edit what the bot remembers, surfaced in
   `ProfilePage`. The storage layer (soul / user memory) already exists; only the UI is missing.

9. **Guided onboarding** — a short first-run flow that seeds the profile (major, year,
   international student, interests) so answers are tailored from message one.

10. **Proactive deadline nudges** — opt-in notifications for upcoming academic deadlines
    (builds on Tier 1 #2 and the existing `mailingListService`).

### Tier 4 — Additional domain tools (incremental)

11. **Dining agent** — dining-hall hours, menus, and dietary filters (a `dining` category and
    the `greenStreetEats` article already exist).
12. **Real-time transit** — extend `campus_navigation` with MTD bus arrivals and building-to-building
    walk times.
13. **Course quality signals** — public GPA-distribution / grade-history lookups (UIUC publishes this);
    stay clear of live registration state per ADR-0005.

## 3. Suggested sequencing

1. **Course Explorer agent** (Tier 1 #1) — unlocks a stubbed surface with ADR groundwork done.
2. **Message actions + feedback** (Tier 2 #4) — cheap, immediately improves every conversation
   and starts collecting quality signal.
3. **Academic deadline agent + `.ics` export** (Tier 1 #2).
4. **Context-aware suggestions + memory UI** (Tier 2 #5, Tier 3 #8) — reuse existing memory infra.
5. **Voice/image input** and **resume agent** as the next wave.

## 4. Notes / constraints

- New domain capabilities should follow the existing **skill JSON + tool registry** pattern
  (`api/src/skills/*.json`, `api/src/tools/registry.ts`) so they plug into the agent loop and
  respect the tool-call budget / timeout guards.
- Keep everything **source-grounded** (ADR-0006) — no free-floating facts; cite official UIUC
  sources where possible.
- Respect ADR scope boundaries: the product is **not** a real-time SIS/registrar; avoid live
  seat counts, enrollment, and waitlist state.
- All new UI must remain **bilingual (EN/ZH)** per ADR-0003.
