/**
 * Shared timestamp shape for persisted MCP contract records.
 *
 * Consumers may hydrate these values into Date objects at runtime, while
 * persistence and API boundaries may keep them as ISO strings.
 */
export type MCPTimestamp = Date | string

/**
 * Tool input schema snapshots should stay compatible with the internal
 * ToolDefinition.parameters contract used by the API tool registry.
 */
export type MCPToolInputSchema = Record<string, unknown>

export type MCPConnectionOwnerType = 'platform' | 'user'

export type MCPConnectionVisibility = 'global' | 'owner_only' | 'institution'

export type MCPConnectionTransport = 'streamable_http'

export type MCPConnectionTestStatus = 'ok' | 'failed' | null

/**
 * Persisted product-facing model for a registered MCP server.
 *
 * Separation of concerns:
 * - ownership answers who controls the record
 * - visibility answers who can see/use the record
 * - enablement answers whether the connection is active
 * - health answers the most recent connection test result
 * - discovery answers when tool discovery last ran and what it found
 *
 * These concerns intentionally stay separate instead of being collapsed into a
 * single overloaded lifecycle/status field.
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
 * Snapshot of a tool discovered from an MCP server.
 *
 * This is discovery output, not a mutable runtime registry object. Tool-level
 * overrides and connection-level enablement are modeled separately.
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
 * Manual override for a discovered MCP tool.
 *
 * Connection ownership/visibility stay on the parent connection, while this
 * record only captures per-owner tool disablement state.
 */
export interface MCPToolOverride {
  id: string
  connection_id: string
  tool_name: string
  owner_id: string
  is_disabled: boolean
  created_at: MCPTimestamp
}
