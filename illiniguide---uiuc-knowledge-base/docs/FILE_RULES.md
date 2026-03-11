# Project File Rules

This document is the practical file-placement contract for
`illiniguide---uiuc-knowledge-base/`.

It should stay aligned with:

- `README.md`
- `docs/ARCHITECTURE.md`

---

## 1) Root Scope

At repository root (`Ask/`), the business-facing directories currently are:

- `api-gateway/`
- `data_collection/`
- `illiniguide---uiuc-knowledge-base/`

Do not add hidden tooling folders such as `.agent/`, `.claude/`, or `.gemini/`
to business structure documentation.

---

## 2) Default Placement Rule

Put new code next to the feature that uses it, unless it is clearly shared by
multiple unrelated features.

The repository should prefer one obvious home for new code over speculative
"future" folders.

---

## 3) Current Canonical App Structure

```text
illiniguide---uiuc-knowledge-base/
|-- docs/
|-- functions/
|   `-- api/
|-- public/
|-- scripts/
|   `-- migrations/
|-- src/
|   |-- app/                    # routes and app-level composition metadata
|   |-- components/
|   |   |-- ui/                 # business-agnostic dumb UI only
|   |   |   `-- branding/
|   |   |-- layout/             # app shell, nav, sidebar, layout-only pieces
|   |   |-- chat/               # chat feature UI
|   |   `-- housing/            # housing feature UI and submodules
|   |       |-- constants/
|   |       |-- dorm-detail/
|   |       |-- dorm-list/
|   |       |-- dorm-map/
|   |       |-- edit-panel/
|   |       |-- filter-modal/
|   |       |-- hooks/
|   |       |-- i18n/
|   |       |-- store/
|   |       `-- types/
|   |-- constants/
|   |-- contexts/
|   |-- data/
|   |-- hooks/                  # shared hooks only
|   |-- i18n/
|   |-- pages/                  # thin route entry points
|   |   |-- chat/
|   |   |-- courses/
|   |   |-- dorms/
|   |   |-- library/
|   |   |-- profile/
|   |   `-- resume/
|   |-- legacy/                 # isolated unused reference code
|   |   |-- auth/
|   |   `-- components/
|   |-- scripts/
|   |-- services/               # shared persistence / API integration
|   |-- utils/                  # shared pure helpers
|   |-- App.tsx                 # only active app-composition file
|   |-- constants.ts            # shared root constants still in active use
|   |-- index.css
|   |-- index.tsx               # runtime entry
|   `-- types.ts                # shared root TS types still in active use
`-- tests/
    `-- artifacts/
```

Important:

- `src/App.tsx` is the only active app-composition file.
- `src/legacy/**` is an explicit isolation boundary for unused reference code.
- A small number of active display components may remain directly under
  `src/components/` when they do not yet have a stable documented subtree.
- Do not declare a new canonical root such as `src/features/**` in docs unless
  the runtime imports and build have actually moved there.

---

## 4) Placement Rules

### 4.1 Pages

`src/pages/**` is for route-level orchestration only.

Allowed:

- reading route params
- assembling feature components
- page-local orchestration hooks

Not allowed:

- large reusable UI implementations
- feature data models that belong to a domain folder
- broad shared utility code

### 4.2 Feature UI

`src/components/chat/**` and `src/components/housing/**` own feature-local UI
composition.

Put code here when it is specific to one feature, such as:

- feature view components
- feature-local controllers
- feature-local stores and hooks
- feature-local constants and types
- tabs, sections, shells
- display helpers that only that feature uses

### 4.3 Layout

`src/components/layout/**` is layout-only.

It may know about:

- navigation
- shell structure
- sidebar composition

It must not absorb dorm-specific or chat-specific business logic.

### 4.4 Global UI

`src/components/ui/**` is for business-agnostic UI only.

Allowed:

- buttons
- modal primitives
- icons
- presentational wrappers

Not allowed:

- API calls
- context-dependent business behavior
- imports from chat-specific or housing-specific modules

### 4.5 Root-Level Active Components

Some active components may remain directly under `src/components/` when they do
not belong in `ui/`, `layout/`, `chat/`, or `housing/`, and the repo does not
yet have a stable documented subtree for them.

Do not invent a new canonical subtree just to relocate a single file.

### 4.6 Shared Hooks, Types, Services, Utils

Use global directories only when the code is truly shared:

- `src/hooks/**`
- `src/types/**`
- `src/services/**`
- `src/utils/**`

Promotion rule:

- if it is used by only one feature, keep it local
- if it is used by two or more unrelated features, promote it

### 4.7 Static Data and Config

Use:

- `src/constants/**` for static config and canonical source data
- `src/data/**` for static content payloads
- `src/i18n/**` for shared translation assets

Do not hide mutable business logic inside constants files.

### 4.8 Legacy

`src/legacy/**` stores unused reference code only.

Rules:

- active runtime modules must not import from legacy paths
- legacy files may be retained for reference during refactors
- if new legacy code is isolated, prefer `src/legacy/**` unless a feature-local
  legacy boundary already exists

---

## 5) Anti-Patterns

These patterns should be avoided:

1. Two competing canonical homes for the same thing.
2. Feature-specific code promoted to global too early.
3. Docs that describe a target migration instead of the current runtime tree.
4. Big-bang file moves mixed with feature edits.
5. Page files becoming feature owners.

---

## 6) File Size Guidance

Large files are a smell, not an automatic failure.

Guideline:

- around 300-400 lines, stop and check whether the file has multiple reasons to
  change
- split when the boundary is obvious
- do not split purely to satisfy an arbitrary number if it makes navigation
  worse

Good splits:

- `sections/`
- `tabs/`
- `controllers/`
- `store/`
- `i18n/`

Bad splits:

- meaningless `Part1`, `Part2`
- extracting tiny wrappers with no semantic boundary

---

## 7) Migration Rule

If the project is being reorganized:

- finish import rewrites before calling the new structure canonical
- do not leave docs, imports, and runtime checks pointing at different trees
- prefer one migration axis at a time

A structure move is not complete until:

- imports resolve
- `npm run build` passes
- docs describe the same tree the runtime uses

---

## 8) Verification

For structure-affecting changes:

1. Run `npm run typecheck`.
2. Run `npm run build` for module moves, route changes, or renamed imports.
3. Use targeted `rg` searches to confirm old paths or deprecated imports are
   gone after structural moves.

---

## 9) Short Decision Rule

When unsure where code belongs, ask these questions in order:

1. Is it route-only?
   If yes, put it in `src/pages/**`.
2. Is it specific to one feature?
   If yes, keep it inside that feature under `src/components/**`.
3. Is it layout-only?
   If yes, use `src/components/layout/**`.
4. Is it business-agnostic shared UI?
   If yes, use `src/components/ui/**`.
5. Is it unused reference code?
   If yes, isolate it under `src/legacy/**`.
6. Is it truly shared across unrelated features?
   If yes, promote it to a global shared directory.

If two locations both seem valid, prefer the more local placement.
