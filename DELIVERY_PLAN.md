# Delivery & Verification Plan

## 1. Verification Tiers Strategy

### Tier 1: Local Component Check (Unit/Smoke Tests)
*Objective: Ensure individual modules work before integration.*
- [x] **Backend Dependencies**: `pip install -r backend/requirements.txt`.
- [ ] **DB Concurrency (WAL)**: Run `backend/scripts/test_concurrency.py` (Need to create).
- [ ] **ETL Processor**: Run `backend/scripts/test_processor.py` to verify Date/Context injection.

### Tier 2: Integration & Security (Staging/Docker)
*Objective: Verify the system works as a whole in a production-like environment.*
- [ ] **API Security**:
    - [ ] Test `X-User-Region: CN` -> Routes to SiliconFlow.
    - [ ] Test `X-User-Region: US` -> Routes to DeepSeek.
    - [ ] Test without Token -> Expect 401.

### Tier 3: End-to-End User Acceptance (Production)
*Objective: Validate User Experience and Content Quality.*
- [ ] **The "50 Questions" QA Suite**:
    - [ ] **Criteria**: Hallucination < 5%, Latency < 3.0s, Citations > 90%.
- [ ] **Load Test**:
    - [ ] Simulate Crawler Writer + 10 Users Reading (Verify no `database locked` error).

## 2. Risk Mitigation Checklist (The "Gotchas")
- [x] **SQLite Locking**: WAL Mode Enabled in `search.py` and `loader.py`.
- [ ] **Resource Contention**:
    - [ ] Crawler `loader.py` ThreadPool limited to 5 workers.
    - [ ] (Ops) Setup `nice` in systemd service file.
- [ ] **Edge Auth**:
    - [x] `_middleware.ts` validates Supabase Token.
    - [ ] (Future) Switch to local `jose` verification for speed.
- [x] **Metadata/Freshness**:
    - [x] `processor.py` injects `[Date: YYYY-MM-DD]`.

## 3. Final Acceptance Checklist
- [ ] **Codebase**: `AI_TASKS.md` all items `[x]`.
- [ ] **Infrastructure**: Cloudflare Worker + VPS + Argo Tunnel active.
- [ ] **Data**: `knowledge.db` fresh (< 24h).
- [ ] **Quality**: QA Suite passed.
