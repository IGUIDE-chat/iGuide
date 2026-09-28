/**
 * Timestamps cross hydration, persistence, and API boundaries as `Date` in
 * some layers and ISO strings in others, so every persisted record accepts
 * either rather than forcing a conversion at each boundary.
 */
export type MCPTimestamp = Date | string

/**
 * Kept structurally compatible with `ToolDefinition.parameters` so discovered
 * schemas can be handed to the tool registry without translation.
 */
export type MCPToolInputSchema = Record<string, unknown>

export type MCPConnectionOwnerType = "platform" | "user"

export type MCPConnectionVisibility = "global" | "owner_only" | "institution"

export type MCPConnectionTransport = "streamable_http"

export type MCPConnectionTestStatus = "ok" | "failed" | null

/**
 * Ownership, visibility, enablement, health, and discovery are deliberately
 * independent fields. Collapsing them into one lifecycle/status column would
 * make "disabled but reachable" and "visible but never tested" unrepresentable.
 */
export interface MCPConnection {
  id: string
  owner_id: string
  owner_type: MCPConnectionOwnerType
  visibility: MCPConnectionVisibility
  institution_id?: string
  display_name: string
  endpoint_url: string
  transport: MCPConnectionTransport
  description?: string
  is_enabled: boolean
  last_test_at?: MCPTimestamp
  last_test_status: MCPConnectionTestStatus
  last_test_error?: string
  last_discovery_at?: MCPTimestamp
  last_discovery_tool_count?: number
  created_at: MCPTimestamp
  updated_at: MCPTimestamp
}

/**
 * A discovery-time snapshot, not a live registry entry: connection-level
 * enablement and per-tool overrides are applied later, when tools are bound.
 */
export interface MCPDiscoveredTool {
  id: string
  connection_id: string
  name: string
  description?: string
  input_schema: MCPToolInputSchema
  discovered_at: MCPTimestamp
}

/**
 * Only per-owner tool disablement lives here; ownership and visibility remain
 * properties of the parent connection.
 */
export interface MCPToolOverride {
  id: string
  connection_id: string
  tool_name: string
  owner_id: string
  is_disabled: boolean
  created_at: MCPTimestamp
}
