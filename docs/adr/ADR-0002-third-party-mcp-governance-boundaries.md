# ADR-0002: Limit phase-1 third-party MCP integrations to governed Streamable HTTP connections

## Status
Accepted

## Date
2026-04-18

## Context
The product needs to support third-party MCP integrations while adding a management UI and a persistence model for connection ownership, visibility, enablement, and tool controls. During discussion, several scope questions were resolved: where the UI should live, which transports should be supported, whether credentials should be handled, how discovered tools should be enabled by default, and what responsibility the product has for arbitrary public third-party MCP quality.

Without explicit guardrails, phase 1 could easily expand into credential storage, multiple transports, template marketplaces, or ambiguous responsibility boundaries between first-party and arbitrary third-party integrations.

## Decision
For phase 1, support only manually entered third-party **Streamable HTTP** MCP connections, managed from **Settings / Integrations** within the profile/settings information architecture.

Phase 1 excludes credential-protected third-party MCP endpoints, stdio transport, legacy SSE transport, templates/marketplace flows, and chat-page management entry.

Saved enabled connections will auto-enable all discovered tools by default, while allowing users to manually disable individual tools afterward.

The persistence model must separate:
- ownership
- visibility scope
- runtime enablement
- health/test state
- discovery state

Arbitrary user-added public third-party MCP services are supported with clear disclaimers, but their answer quality is not treated as a product-quality guarantee. Quality responsibility remains with built-in or platform-owned offerings.

## Alternatives Considered
- **Support multiple transports in phase 1, including stdio and legacy SSE**  
  Plausible because it would broaden MCP compatibility immediately. Rejected because it would expand implementation and support complexity before the basic product flow is proven.

- **Support credential-protected third-party endpoints in phase 1**  
  Plausible because many real MCP services require auth. Rejected because it would force secret storage, credential UX, and stronger operational/security guarantees into the first rollout.

- **Put integration management directly on the chat page**  
  Plausible because it keeps configuration close to tool use. Rejected because the user explicitly chose Settings / Integrations, and chat should remain focused on conversation rather than systems management.

- **Treat arbitrary third-party MCP quality as part of product correctness**  
  Plausible from a user-experience perspective. Rejected because the team explicitly decided that clear disclaimers are sufficient for user-added public third-party services, while stronger responsibility applies only to built-in/internal offerings.

## Consequences
- **Benefits**
  - Keeps phase 1 narrow enough to ship and verify.
  - Makes operational and product responsibility boundaries explicit.
  - Avoids introducing secret management and transport sprawl before the core workflow is validated.
  - Supports future institution-scoped rollout by separating ownership from visibility.

- **Costs**
  - Some real MCP servers will remain unsupported in phase 1.
  - Users must enter endpoints manually; there is no marketplace or template convenience layer.
  - The product must communicate limitations clearly to avoid confusion.

- **Risks**
  - Future contributors may be tempted to add unsupported transports or auth handling incrementally without revisiting the whole security and UX model.
  - If disclaimers are weak, users may over-assume first-party guarantees for arbitrary third-party tools.

- **Constraints Created**
  - No credential fields or secret storage flows for third-party MCP in phase 1.
  - No chat-page integrations management UX in phase 1.
  - The UI and API must expose structured connection failure reasons rather than vague generic failures.

## Revisit Triggers
- The product is ready to support authenticated third-party MCP services with a deliberate secret-management model.
- Streamable HTTP alone blocks materially important integrations.
- There is a validated need for templates, presets, or a marketplace.
- Institution-level or tenant-level rollout becomes active enough that the ownership/visibility model needs expansion beyond the current phase-1 assumptions.

## Related
- `.sisyphus/plans/hybrid-mcp-tools-ui.md`
- `app/src/pages/profile/ProfilePage.tsx`
- `app/src/components/profile/ProfileScreen.tsx`
- `docs/development/custom-tool-and-skill-guide.md`
