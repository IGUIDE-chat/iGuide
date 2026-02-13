# Architecture Boundaries

## Layers

1. Entry Layer
- `src/index.tsx`
- Mounts providers and router entry only.

2. App Composition Layer
- `src/App.tsx`
- Owns global state composition and top-level providers/layout wiring.

3. Route Layer
- `src/app/routes.tsx`
- Declares routes only.
- No feature business logic should live here.

4. Page Layer
- `src/pages/**`
- Page-level orchestration.
- Uses components/services/context but avoids deep shared mutable logic.

5. Feature/Component Layer
- `src/components/**`
- Reusable UI pieces and feature-specific presentation.

6. Data/Config Layer
- `src/constants/**`, `src/i18n/**`, `src/config/**`, `src/data/**`
- Static config/text/data only.

7. Service Layer
- `src/services/**`
- API and persistence integration.

## Legacy Policy

- Legacy code is stored in `src/legacy/**` and `src/components/housing/legacy/**`.
- Legacy code is not part of runtime flow.
- Active modules must not import from `src/legacy/**`.

## Enforced Checks

- `npm run verify:architecture` checks:
  - no active imports from legacy
  - route and page registry parity
  - single active App/Auth source
  - only one active root Vite config

