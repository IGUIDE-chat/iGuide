# README.md Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the root `README.md` to be developer-focused, well-structured, and comprehensive by embedding content from sub-packages and docs.

**Architecture:** A tiered technical overview including a 3-layer system split (Edge, User Data, Core Intelligence) and a unified monorepo map.

**Tech Stack:** Markdown, Git.

---

### Task 1: Create Chinese Version and Link it

**Files:**
- Create: `README_CN.md`
- Modify: `README.md`

- [x] **Step 1: Extract Chinese content from root README.md**
- [x] **Step 2: Write Chinese content to README_CN.md**
- [x] **Step 3: Add a link to README_CN.md at the top of the new README.md draft and remove the existing Chinese section from root README.md**
- [x] **Step 4: Commit**

```bash
git add README_CN.md README.md
git commit -m "docs: move Chinese README to separate file"
```

### Task 2: Source Extraction & Drafting Core Sections (Header, Map, Architecture)

**Files:**
- Modify: `README.md`

- [x] **Step 1: Extract and draft the new technical header and one-liner**
- [x] **Step 2: Create the Monorepo Map table using info from `app/README.md`, `api/README.md`, and `data_collection/README.md`**
- [x] **Step 3: Write the "3-Layer Split" architecture section using info from `api/README.md` and the existing "Edge-Core Hybrid RAG Architecture" section in the root `README.md`**
- [x] **Step 4: Embed the Hybrid RAG logic (FTS5 + sqlite-vec) from the existing architecture notes in root `README.md`**
- [x] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add header, map, and architecture to README"
```

### Task 3: Setup & Developer Guidelines (Unified Setup, Rules, Chatflow, API Setup)

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Create a "Quick Start" section combining frontend (dev server and typechecking from `app/README.md`), database seeding (`app/docs/SUPABASE_SETUP.md`), and crawler setup (`data_collection/README.md`)**
- [ ] **Step 2: Add API Gateway features and setup from `api/README.md`**
- [ ] **Step 3: Embed the "Architecture & Placement Rules" from `app/docs/FILE_RULES.md`**
- [ ] **Step 4: Summarize and embed the "Dify Chatflow Setup" from `app/docs/CHATFLOW_SETUP.md`**
- [ ] **Step 5: Verify no "AI slop" or agent-only instructions are included**
- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: finalize setup, rules, and chatflow in README"
```

### Task 4: Final Verification & Links

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Verify all relative links to other docs work (though most are embedded, some might still be linked)**
- [ ] **Step 2: Final proofread for clarity and layout**
- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: final README polish and verification"
```
