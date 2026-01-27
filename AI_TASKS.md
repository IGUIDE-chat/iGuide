# Project Tasks: IlliniGuide

Based on `README.md` Architecture and Responsibility Split.

**📊 完整验证报告**: 见 `VERIFICATION_REPORT.md`

---

## Phase 1: Core Intelligence Layer (Backend)
*Status: [x] Core Implemented*
*Priority: High (Architect Responsibility)*

This phase establishes the "Chicago VPS" Python backend which serves as the brain of the RAG system.

- [x] **Design FastAPI Skeleton**
    - [x] Create `backend/` directory.
    - [x] Setup `main.py` with `POST /chat` endpoint.
    - [x] Define input/output schemas (`ChatRequest`, `ChatResponse`) in `backend/schemas.py`.
- [x] **Implement Local Search Engine (`local_search`)**
    - [x] **Dual Index**:
        - [x] FTS5 Search (BM25) for keywords (implemented in `backend/core/search.py`).
        - [x] Vector Search (`sqlite-vec` + ONNX embedding).
    - [x] **Rerank**:
        - [x] Cross-Encoder logic (`bge-reranker-v2-m3`) implemented.
    - [x] **Web Fallback**:
        - [x] Confidence check (< 0.4) triggering Tavily.

## Phase 2: Advanced ETL Pipeline
*Status: [x] Complete (Verified)*
*Priority: High (Data Quality)*

Upgrade `data_collection/` scripts to the "Advanced ETL" standard.

- [x] **Implement Extraction & Incremental Updates**
    - [x] `backend/etl/loader.py` exists (WAL enabled).
    - [x] MD5 Check (The "5%" rule) is implemented.
    - [x] **Stale Chunk Deletion**: Implemented pre-delete logic.
- [x] **Implement Smart Cleaning & Metadata Injection**
    - [x] `backend/etl/processor.py` uses `trafilatura`.
    - [x] **Metadata Injection**: `[Source: ...] [Date: ...]`.
- [x] **Implement Database Loading**
    - [x] Script to create/update `knowledge.db` with FTS5 and Vector tables.

## Phase 3: Edge Layer & Security (Cloudflare + Routing)
*Status: [x] Implemented*
*Priority: Medium (Production Readiness)*

Implement the Cloudflare Workers / Pages Functions logic (Layer 1 in Architecture).

- [x] **Implement Auth Proxy (Cloudflare Functions)**
    - [x] `functions/_middleware.ts` handles Geo-IP and Auth.
    - [x] Validates Supabase JWT tokens.
- [x] **Implement Split-Brain Routing**
    - [x] **Edge Logic**: Maps `cf.country` -> `X-User-Region`.
    - [x] **Core Logic**: Switches between SiliconFlow (CN) and DeepSeek (Global).
    - [x] **Config**: `SILICONFLOW_BASE_URL` and keys configured.

## Phase 4: Frontend & QA
*Status: [x] Integration Ready / QA Suite Built*
*Priority: Medium (User Experience)*

Tasks assigned to "Classmates" in README, plus integration.

- [x] **Frontend Integration**
    - [x] **Backend Streaming**: `backend/main.py` implements SSE with Coze-compatible events.
    - [x] Connect `ChatScreen.tsx`: Proxied via `cozeService` / `functions`.
    - [x] **Streaming UI**: `ChatScreen.tsx` supports Source visualization.
- [x] **UI Polish**
    - [x] **Typewriter Effect**: Validated.
    - [x] **Citations**: Source cards implemented in `ChatScreen.tsx`.
- [x] **QA & Prompt Engineering**
    - [x] **Bad Case Analysis**: Generated `qa/bad_cases.json` (20 tough qs).
    - [x] **Automated Eval**: Created `qa/run_evaluation.py` for latency/keyword benchmarking.
    - [x] **System Prompt**: Centralized in `backend/core/prompts.py`.

## Phase 5: Delivery & Verification Plan
*Status: [~] In Progress (Issues Found)*
*Priority: Critical (Release)*

### 1. Delivery Checklist
- [x] **Tier 1 (Smoke Test)**: Run `backend/scripts/verify_delivery.py`. ✅ PASSED
- [x] **Tier 2 (QA)**: Run `qa/run_evaluation.py` (Requires live backend). ⚠️ COMPLETED WITH ISSUES
  - Average Latency: 7.77s (Target: < 3s) - NEEDS OPTIMIZATION
  - Keyword Match: 60% (Target: > 80%) - NEEDS IMPROVEMENT  
  - Sources Bug: 0 sources returned - REQUIRES FIX
  - See `qa/QA_REPORT.md` for detailed analysis
- [ ] **Tier 3 (Deployment)**:
    - [ ] Deploy Backend to VPS.
    - [ ] Deploy Frontend to Cloudflare Pages.
    - [ ] Configure Argo Tunnel.

### 2. Final Acceptance
- [x] **Codebase**: All high-priority tasks complete.
- [x] **Data**: `knowledge.db` populated.
- [ ] **Quality**: QA Latency < 3s (Currently 7.77s).
- [ ] **Bug Fixes**: Source attribution in SSE response.
