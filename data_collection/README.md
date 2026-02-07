# UIUC Knowledge Base Crawler (AI-Powered) 

A production-grade, full-cycle web crawler designed to build a comprehensive knowledge base for the University of Illinois Urbana-Champaign (UIUC). This project serves as an ETL pipeline to feed Vertical Large Language Models (LLMs) with high-quality, structured data.

## Key Features

### 1. Hybrid Crawling Engine
* **Speed & Power**: Combines `aiohttp` for high-concurrency static fetching and `Playwright` for dynamic content rendering (React/JS pages).
* **Resilience**: Features automatic retries, `crt.sh` subdomain discovery, and fallback strategies.
* **Stealth**: Built-in middleware for User-Agent rotation and Proxy integration.

### 2. Intelligent Data Processing
* **Smart Extraction**: Uses `Trafilatura` to algorithmically extract main content, removing ads, navigation bars, and boilerplate noise.
* **Zero-Shot AI Classification**: Utilizes a pre-trained NLI model (BART) to semantically categorize pages into specific domains (e.g., *Faculty Profiles, Course Syllabi, Research Labs*) with high precision.

### 3. Lifecycle Management
* **Incremental Updates**: Uses SQLite and Content Hashing to track changes, ensuring only new or updated pages are processed.
* **Auto-Pruning**: Automatically detects and removes stale content (404s) to maintain data integrity.

## Tech Stack

* **Core**: Python 3.10+
* **Network**: `aiohttp`, `Playwright`
* **AI/NLP**: `Transformers` (Hugging Face), `Trafilatura`
* **Storage**: `SQLite`, `aiofiles`

## Installation

1.  Clone the repository:
    ```bash
    git clone [https://github.com/YOUR_USERNAME/UIUC-Crawler.git](https://github.com/YOUR_USERNAME/UIUC-Crawler.git)
    cd UIUC-Crawler
    ```

2.  Create and activate a virtual environment:
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # Windows: .venv\Scripts\activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    playwright install chromium
    ```

## Usage

### One-Click Run (Recommended)
Use the automated shell script to run the crawler followed by the AI classifier:

```bash
chmod +x run_all.sh
./run_all.sh
```

## Project Structure
```text
├── main.py              # Entry point & Hybrid Crawler logic
├── reorganize_ai.py     # Zero-Shot AI Classification script
├── database.py          # SQLite state management
├── middleware.py        # Proxy & User-Agent rotation
├── run_all.sh           # Automation script
├── legacy/              # Archived scripts from previous iterations
├── uiuc_knowledge_base/ # [Output] Structured Data (Ignored by Git)
└── requirements.txt     # Dependencies
```