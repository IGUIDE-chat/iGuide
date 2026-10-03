# Dorm Data Audit Log

Required by `README.md` in this directory: every uncertain, missing, removed, or
source-limited dorm fact must be recorded here instead of being silently guessed.

Record one entry per fact, newest last:

```markdown
## <dorm name> — <short fact> — YYYY-MM-DD

- Status: uncertain | missing | removed | source-limited
- Source: <official URL, or "none found">
- What we know: <exact quote or field value, or "unknown">
- Why it is not resolved: <what blocked it>
- Affected code/data: <file path or column>
```

Rules:

- Never fill a gap with a plausible guess. Leave the field empty and log it here.
- Prefer official sources: housing.illinois.edu, the Office of Housing, the
  University Housing directory, and the dorm's own published materials.
- Google Maps review scrapers (`packages/dorm/scrapers/`) are not authoritative for dorm
  facts; they only supply review text.
- When a fact is later resolved or corrected, keep the old entry and append the
  resolution — the history is the point.
