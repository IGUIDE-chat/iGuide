# Project File Organization Rules

This document outlines the file structure and organization rules for the `IlliniGuide` project.

## Directory Structure

*   **`root/`**
    *   **`src/`**: Source code directory.
        *   **`components/`**: React UI components (e.g., `ChatScreen.tsx`, `ArticleView.tsx`).
        *   **`services/`**: API and logic services (e.g., `conversationService.ts`, `supabase.ts`).
        *   **`contexts/`**: React Context providers (e.g., `AuthContext.tsx`).
    *   **`functions/`**: Cloudflare Pages functions (serverless backend).
    *   **`docs/`**: Project documentation, setup guides, and changelogs.
    *   **`tests/`**: Test scripts (Python/JS) and test result files.
    *   **`scripts/`**: Utility and maintenance scripts (e.g., migration or layout adjustment scripts).
    *   **`dist/`**: Build output directory (do not edit manually).

## Organization Rules

1.  **Tests**: All test files (unit, integration, connection tests) must be placed in the `tests/` directory. Naming convention: `test_*.py` or `*.test.ts`.
2.  **Scripts**: Standalone utility scripts (non-application code) should go in `scripts/`.
3.  **Documentation**: All `.md` (Markdown) documentation files (except the main `README.md`) should be placed in `docs/`.
4.  **Source Code**: Core application source code (`components/`, `services/`, `contexts/`, `App.tsx`, etc.) must be placed in the `src/` directory.

## Maintenance

*   When adding new documentation, place it in `docs/`.
*   When creating new one-off scripts, place them in `scripts/`.
*   Keep the root directory clean of temporary or miscellaneous files.
