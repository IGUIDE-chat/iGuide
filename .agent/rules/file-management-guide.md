---
trigger: always_on
---

# Project File Organization Rules

This document outlines the strict file structure and organization rules for the `IlliniGuide` project. The project follows a **Hybrid RAG Architecture** with distinct layers for Edge, Frontend, Backend, and Data.

## 1. Top-Level Directory Structure

| Directory | Purpose |
| :--- | :--- |
| **`illiniguide---uiuc-knowledge-base/`** | **Frontend & Edge Layer**. Contains the React App and Cloudflare Functions. |
| **`backend/`** | **Core Intelligence Layer**. Python FastAPI Application, RAG Engine, and ETL Pipeline. |
| **`data_collection/`** | **Raw Data Stage**. Scripts for initial crawling and raw data storage. |

---

## 2. Backend Structure (`backend/`)

The brain of the system. Python 3.10+ based.

*   **`main.py`**: Application Entry Point. Defines API endpoints and Split-Brain Routing.
*   **`requirements.txt`**: Python dependencies.
*   **`core/`**: Core logic and configuration.
    *   `config.py`: Environment variables and settings (API Keys, Paths).
    *   `search.py`: **Local Search Engine**. Handles FTS5, Vector Search, and Reranking.
    *   `models/`: Directory for ONNX models (Embeddings/Rerankers).
*   **`etl/`**: Advanced Extract-Transform-Load Pipeline.
    *   `processor.py`: **Smart Processor**. Handles Trafilatura cleaning, Semantic Chunking, and Metadata Injection.
    *   `loader.py`: **DB Loader**. Handles concurrency (WAL), incremental updates (MD5), and dual-index writing.
*   **`schemas.py`**: Pydantic models for API Input/Output (`ChatRequest`, `ChatResponse`).

---

## 3. Frontend & Edge Structure (`illiniguide---uiuc-knowledge-base/`)

The face of the system. React 19 + Vite + Cloudflare Pages.

*   **`src/`**: React Application Source.
    *   **`components/`**: UI Components (e.g., `ChatScreen.tsx`, `TypewriterText.tsx`).
    *   **`services/`**: Frontend Logic & API Clients (e.g., `supabase.ts`).
    *   **`contexts/`**: Global State (e.g., `AuthContext.tsx`).
*   **`functions/`**: **Edge Layer** (Cloudflare Pages Functions).
    *   `_middleware.ts`: **Auth & Routing**. Validates JWT and injects `X-User-Region`.
    *   `api/chat.ts`: **Proxy**. Forwards safe requests to the Python Backend.

---

## 4. Data Collection Structure (`data_collection/`)

Legacy and Raw Data processing.

*   **`get_data.py`** / **`raw_scripts/`**: Initial scraping logic.
*   **`raw_data/`**: Temporary storage for raw HTML/JSON before processing.
*   *Note: usage of scripts here is migrating towards `backend/etl/` for production flows.*

---

## 5. General Rules

1.  **Strict Separation**: Do not import Frontend code into Backend or vice versa. They communicate ONLY via HTTP APIs.
2.  **Configuration**: 
    *   Frontend secrets go in `illiniguide---uiuc-knowledge-base/.env` (Vite).
    *   Backend secrets go in `backend/.env` (Pydantic).
    *   Edge secrets go in Cloudflare Dashboard (or `.dev.vars` for local).
3.  **Database**: The `knowledge.db` (SQLite) is the **Single Source of Truth** for RAG. It resides in `backend/` during runtime but may be built from `data_collection/` outputs.
4.  **Tests**: 
    *   Frontend tests in `illiniguide---uiuc-knowledge-base/tests/`.
    *   Backend tests in `backend/tests/` (pytest).

## 6. Naming Conventions

*   **Python**: `snake_case` for files and variables, `PascalCase` for Classes.
*   **TypeScript/React**: `PascalCase` for Components (`ChatScreen.tsx`), `camelCase` for functions/variables.
*   **Directories**: `snake-case` or `kebab-case` preferred, consistent within parent layer.
