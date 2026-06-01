# ADR-0003: Make assistant response language follow site language by default

## Status

Accepted

## Date

2026-04-18

## Context

The product already passes language information into the backend prompt path, and the frontend already has localized chat placeholder text. During planning, a separate requirement emerged: the assistant should follow the website language setting by default, but the system should not behave unpredictably when users type in another language or quote content from another language.

The main design tension was between convenience and predictability. A more adaptive language policy might feel clever in some cases, but it also risks unstable behavior: changing response language because the user pasted foreign-language text, asked about another language, or mixed languages in one message.

## Decision

Use a **strict configured-language default** for assistant responses.

The assistant should:

- answer in the website language by default
- not implicitly switch because the current message is written in another language
- not implicitly switch because the message quotes or discusses another language
- switch only when the user explicitly asks for another response language

The product may communicate this behavior through subtle UI affordances such as localized placeholder or helper text, but not through heavy-handed warning UI.

## Alternatives Considered

- **Automatically infer response language from the current user message**  
  Plausible because it can feel natural in mixed-language chat. Rejected because it makes behavior less predictable and can cause accidental language switching.

- **Dynamically switch based on detected dominant language plus heuristics for quoted content**  
  Plausible because it tries to balance adaptability and control. Rejected because it introduces ambiguous edge cases and is harder to explain and test.

- **Always force one product-wide default language with no explicit switching path**  
  Plausible because it is simple. Rejected because users still need a deliberate way to request another response language when needed.

## Consequences

- **Benefits**
  - Predictable and explainable behavior.
  - Easier testing and verification because switching rules are explicit.
  - Aligns prompt behavior with visible website language state.

- **Costs**
  - The assistant may feel less adaptive in multilingual chats.
  - Some users may expect automatic matching and need a subtle cue about how language behavior works.

- **Risks**
  - If the prompt wording is too weak, the model may still drift.
  - If the UI hinting is too subtle, users may not understand why the assistant did not switch automatically.

- **Constraints Created**
  - No automatic language detection as a response-policy mechanism.
  - Prompt assembly must preserve configured-language behavior independently of MCP/tool integration logic.

## Revisit Triggers

- Strong evidence shows users are confused or blocked by the strict default-language policy.
- The product introduces a first-class language selector inside chat that changes the control model.
- The system gains reliable, explicitly designed multilingual conversation controls that are better than current site-language-driven behavior.

## Related

- `.sisyphus/plans/hybrid-mcp-tools-ui.md`
- `api/src/agent/prompts.ts`
- `api/src/agent/loop.ts`
- `app/src/i18n/uiText.ts`
- `app/src/components/chat/ChatThread.tsx`
