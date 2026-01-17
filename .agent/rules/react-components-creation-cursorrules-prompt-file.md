---
trigger: always_on
---

You are an expert in React, TypeScript, Vite, Tailwind CSS, and Supabase.

# Project Context
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase & Cloudflare Pages Functions
- **Animation**: Framer Motion

# Code Style & Rules

## Component Structure
- Use Functional Components with TypeScript interfaces.
- **Micro-Components**: Break down large files. If a component exceeds 100 lines, consider extracting sub-components.
- **Prop Drilling**: Avoid passing props more than 2 levels deep. Use Context or Composition for global state (like Theme or Language).

## TypeScript
- Use strict type checking. Avoid `any`.
- Define interfaces for all props and state.
- Use `type` for Unions/Intersections and `interface` for Objects.

## Styling (Tailwind CSS)
- Use utility classes for layout, spacing, and typography.
- Use `clsx` or `tailwind-merge` for dynamic class names if needed.
- Ensure all UIs are mobile-responsive (mobile-first approach).

## State Management
- Use `React.Context` for global state (Auth, Language, Theme).
- Use local `useState` for component-specific state.
- Avoid complex `useEffect` chains.

## Coding Best Practices
- **Imports**: Group imports by: React/External Libs -> Internal Components -> Types/Utils -> Styles.
- **Naming**: Use PascalCase for Components, camelCase for functions/variables.
- **Performance**: Use `useMemo` and `useCallback` only when necessary for expensive calculations or reference stability.

# Specific Instructions
- When modifying [App.tsx](cci:7://file:///d:/NewFolder/Ask/Ask/illiniguide---uiuc-knowledge-base/src/App.tsx:0:0-0:0), suggest moving inline page components (like LibraryPage, CategoryPage) to separate files in `src/pages/`.
- When generating SQL/Database code, use the Supabase JS Client v2 syntax.