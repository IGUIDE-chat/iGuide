# Quick Start: Migrating to Dify

This document summarizes the minimal path changes for the Dify migration work.

## Quick Setup

1. Register accounts with Dify Cloud and DeepSeek.
2. Copy `.env.local.example` to `.env.local`.
3. Add your `VITE_DIFY_API_KEY`.
4. Update the chat service import in
   `src/components/chat/ChatScreen.tsx` if that migration is still in use.
5. Run `pnpm run dev`.

## Import Example

```ts
import { streamChatResponse } from '../../services/cozeService';
```

becomes:

```ts
import { streamChatResponse } from '../../services/difyService';
```

## Validation

- `pnpm run typecheck`
- `pnpm run build`
