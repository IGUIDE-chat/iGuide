# ADR-0001: Use a hybrid MCP runtime instead of replacing the internal tool runtime

## Status
Accepted

## Date
2026-04-18

## Context
The current backend runtime is not a standard MCP server. In `api/`, each `/chat` request creates a fresh `ToolRegistry`, registers internal tools, and executes them through the existing request-scoped agent loop. Internal tools currently rely on direct `ToolDefinition.execute(args, ctx)` execution, local request context, current timeout/budget/truncation behavior, and existing SSE/fallback wiring.

We considered whether to replace this “MCP-style” internal runtime with a single real MCP client so that both internal tools and third-party MCP tools would share one execution model. That option looked superficially cleaner because it would unify tool invocation behind one abstraction.

However, the discussion established that this would add protocol, transport, session, discovery, and error-mapping machinery to what is currently an in-process function-call path. In a Cloudflare Worker-shaped runtime, that cost is especially visible because the current design is request-scoped and lightweight, while a real MCP client is better aligned with external protocol endpoints than with local tool execution.

## Decision
Keep the existing internal `ToolRegistry` runtime as the primary execution path for internal tools, and add third-party MCP support through a thin adapter that maps discovered remote MCP tools into request-scoped local wrappers.

The adapter may use a real MCP client internally for third-party Streamable HTTP MCP servers, but internal tools will not be rewritten to run through MCP.

## Alternatives Considered
- **Replace the internal runtime with a single MCP-first execution path**  
  Plausible because it appears architecturally uniform and could reduce the number of concepts on paper. Rejected because it would protocolize local tools, add transport/session/discovery complexity, and force the current direct runtime path into an abstraction that does not fit its execution model.

- **Keep the current runtime and add ad hoc external integrations without an MCP adapter boundary**  
  Plausible because the codebase already integrates external services through direct HTTP wrappers. Rejected because the product explicitly wants real third-party MCP interoperability, and a dedicated adapter boundary is a cleaner place to isolate MCP-specific concerns.

- **Run all tools, internal and external, through a universal tool platform abstraction from day one**  
  Plausible as a longer-term platform vision. Rejected for phase 1 because it adds abstraction without present value and increases migration risk.

## Consequences
- **Benefits**
  - Preserves the current internal runtime behavior, including request-scoped registration, budget enforcement, timeout handling, fallback behavior, and local execution semantics.
  - Limits MCP-specific complexity to the boundary where it is actually needed: third-party protocol integrations.
  - Reduces migration risk and keeps the implementation aligned with the current Worker-based architecture.

- **Costs**
  - The system will intentionally have two execution shapes: native internal tools and MCP-adapted remote tools.
  - Some metadata normalization is required so remote tools can appear as local wrappers at request time.

- **Risks**
  - The adapter boundary can grow into over-abstraction if it starts absorbing internal tool concerns.
  - Future contributors may still try to “finish the unification” without revisiting the tradeoffs that led to this decision.

- **Constraints Created**
  - Internal tools must continue to work without MCP transport assumptions.
  - MCP support must fit into the request-scoped registration flow rather than replacing it.

## Revisit Triggers
- We have multiple external MCP integrations whose lifecycle management becomes more complex than the hybrid boundary can reasonably contain.
- The backend runtime moves away from the current request-scoped Worker shape into a platform where a persistent MCP-first runtime becomes natural.
- Internal tools begin to require the same discovery/session/capability model as remote MCP tools, making the split abstraction no longer worthwhile.

## Related
- `.sisyphus/plans/hybrid-mcp-tools-ui.md`
- `api/src/index.ts`
- `api/src/tools/registry.ts`
- `api/src/agent/loop.ts`
