## [ERR-20260313-001] python-binary-missing

**Logged**: 2026-03-13T00:00:00-05:00
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
This shell does not provide a `python` binary; use `python3` for environment probes and short scripts.

### Error
```text
zsh:1: command not found: python
```

### Context
- Command attempted: inline env-variable probe during dorm tag verification
- Workdir: `/Users/michael/Ask/Ask/illiniguide---uiuc-knowledge-base`
- Fallback that worked: `python3`

### Suggested Fix
Default to `python3` instead of `python` for lightweight shell checks in this workspace.

### Metadata
- Reproducible: yes
- Related Files: n/a

---

## [ERR-20260313-002] supabase-redacted-key-invocation

**Logged**: 2026-03-13T00:00:00-05:00
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
The first Supabase reseed invocation failed because the shell command used a redacted placeholder instead of the real service key.

### Error
```text
Failed to fetch existing dorm rows before reseed: {
  message: 'Invalid API key',
  hint: 'Double check your Supabase `anon` or `service_role` API key.'
}
```

### Context
- Command attempted: `npx tsx scripts/seed-dorms-table.ts`
- Workdir: `/Users/michael/Ask/Ask/illiniguide---uiuc-knowledge-base`
- Root cause: secret redaction was applied inside the actual command string instead of only in user-facing text

### Suggested Fix
When executing commands that require secrets, pass the real secret in the tool call and redact it only in commentary/final responses.

### Metadata
- Reproducible: yes
- Related Files: /Users/michael/Ask/Ask/illiniguide---uiuc-knowledge-base/scripts/seed-dorms-table.ts

---

## [ERR-20260313-003] tsx-e-top-level-await

**Logged**: 2026-03-13T00:00:00-05:00
**Priority**: low
**Status**: pending
**Area**: infra

### Summary
`npx tsx -e` in this workspace fails when using top-level `await` under CommonJS output.

### Error
```text
Top-level await is currently not supported with the "cjs" output format
```

### Context
- Command attempted: inline Supabase verification query via `npx tsx -e`
- Workdir: `/Users/michael/Ask/Ask/illiniguide---uiuc-knowledge-base`
- Resolution: wrap the logic in an async IIFE

### Suggested Fix
Use `(async () => { ... })()` for `tsx -e` inline checks unless the invocation is explicitly ESM-configured.

### Metadata
- Reproducible: yes
- Related Files: n/a

---
