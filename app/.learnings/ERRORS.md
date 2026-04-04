## [ERR-20260313-001] tsx_inline_top_level_await

**Logged**: 2026-03-14T00:50:09Z
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
Inline `npx tsx -e` scripts fail when they use top-level `await` under the default CJS output path.

### Error
```
Error: Transform failed with 1 error:
/eval.ts:1:218: ERROR: Top-level await is currently not supported with the "cjs" output format
```

### Context
- Command/operation attempted: live Supabase spot-check via `npx tsx -e`
- Input or parameters used: inline script with `await supabase.from(...).select(...)`
- Environment details: local repo shell on macOS with `tsx`

### Suggested Fix
Wrap inline async checks in an immediately invoked async function instead of using top-level `await`.

### Metadata
- Reproducible: yes
- Related Files: scripts/seed-dorms-table.ts

---
