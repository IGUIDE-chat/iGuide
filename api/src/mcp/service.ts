import {
  type MCPConnection,
  type MCPDiscoveredTool,
  type MCPToolOverride,
} from "./types.ts"
import {
  type MCPAdapterClient,
  type MCPDiscoveryResult,
  type MCPTestResult,
} from "./adapter.ts"
import { type MCPStore, createMCPStore } from "./store.ts"
import { StreamableHttpMCPClient } from "./streamable-http-client.ts"
import { tool } from "ai"
import { z } from "zod"

type CreateConnectionInput = Pick<
  MCPConnection,
  "display_name" | "endpoint_url" | "transport"
> &
  Partial<Pick<MCPConnection, "description">>

type UpdateConnectionInput = Partial<
  Pick<MCPConnection, "display_name" | "description" | "is_enabled">
>

const CONNECTION_PREFIX = "conn:"
const TOOL_PREFIX = "tool:"
const OVERRIDE_PREFIX = "override:"

function asEnvRecord(env?: unknown): Record<string, unknown> | undefined {
  return env && typeof env === "object"
    ? (env as Record<string, unknown>)
    : undefined
}

function isMCPStore(value: unknown): value is MCPStore {
  return Boolean(
    value &&
    typeof value === "object" &&
    "get" in value &&
    "put" in value &&
    "delete" in value &&
    "list" in value
  )
}

function resolveStore(input?: unknown): MCPStore {
  if (isMCPStore(input)) {
    return input
  }

  return createMCPStore({ env: asEnvRecord(input) })
}

function connectionKey(id: string): string {
  return `${CONNECTION_PREFIX}${id}`
}

function toolKey(connectionId: string, toolName: string): string {
  return `${TOOL_PREFIX}${connectionId}:${toolName}`
}

function toolPrefix(connectionId: string): string {
  return `${TOOL_PREFIX}${connectionId}:`
}

function overrideKey(
  connectionId: string,
  ownerId: string,
  toolName: string
): string {
  return `${OVERRIDE_PREFIX}${connectionId}:${ownerId}:${toolName}`
}

function overridePrefix(connectionId: string, ownerId?: string): string {
  return ownerId
    ? `${OVERRIDE_PREFIX}${connectionId}:${ownerId}:`
    : `${OVERRIDE_PREFIX}${connectionId}:`
}

function isPlatformConnectionVisible(
  connection: MCPConnection,
  viewerId: string
): boolean {
  switch (connection.visibility) {
    case "global":
      return true
    case "owner_only":
      return connection.owner_id === viewerId
    case "institution":
      return connection.institution_id === viewerId
  }
}

function createConnectionGroups(
  ids: string[]
): Record<string, MCPDiscoveredTool[]> {
  return Object.fromEntries(ids.map((id) => [id, []]))
}

function createOverrideGroups(
  ids: string[]
): Record<string, MCPToolOverride[]> {
  return Object.fromEntries(ids.map((id) => [id, []]))
}

export class MCPConnectionService {
  private readonly store: MCPStore

  constructor(env?: unknown) {
    this.store = resolveStore(env)
  }

  async listForViewer(viewerId: string): Promise<{
    platform: MCPConnection[]
    user: MCPConnection[]
  }> {
    const records = await this.store.list<MCPConnection>(CONNECTION_PREFIX)
    const platform: MCPConnection[] = []
    const user: MCPConnection[] = []

    for (const { value: connection } of records) {
      if (connection.owner_type === "platform") {
        if (isPlatformConnectionVisible(connection, viewerId)) {
          platform.push(connection)
        }
        continue
      }

      if (
        connection.owner_type === "user" &&
        connection.owner_id === viewerId
      ) {
        user.push(connection)
      }
    }

    return { platform, user }
  }

  async createUserConnection(
    viewerId: string,
    input: CreateConnectionInput
  ): Promise<MCPConnection> {
    const timestamp = new Date().toISOString()
    const connection: MCPConnection = {
      id: crypto.randomUUID(),
      owner_id: viewerId,
      owner_type: "user",
      visibility: "owner_only",
      display_name: input.display_name,
      endpoint_url: input.endpoint_url,
      transport: input.transport,
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
      is_enabled: true,
      last_test_status: null,
      created_at: timestamp,
      updated_at: timestamp,
    }

    await this.store.put(connectionKey(connection.id), connection)
    return connection
  }

  async getByIdForViewer(
    id: string,
    viewerId: string
  ): Promise<MCPConnection | null> {
    const connection = await this.store.get<MCPConnection>(connectionKey(id))
    if (!connection) {
      return null
    }

    if (connection.owner_type === "user") {
      return connection.owner_id === viewerId ? connection : null
    }

    return isPlatformConnectionVisible(connection, viewerId) ? connection : null
  }

  async updateUserConnection(
    id: string,
    viewerId: string,
    patch: UpdateConnectionInput
  ): Promise<MCPConnection | null> {
    const existing = await this.getByIdForViewer(id, viewerId)
    if (!existing || existing.owner_type !== "user") {
      return null
    }

    const updated: MCPConnection = {
      ...existing,
      ...patch,
      updated_at: new Date().toISOString(),
    }

    await this.store.put(connectionKey(id), updated)
    return updated
  }

  async deleteUserConnection(id: string, viewerId: string): Promise<boolean> {
    const existing = await this.getByIdForViewer(id, viewerId)
    if (!existing || existing.owner_type !== "user") {
      return false
    }

    await this.store.delete(connectionKey(id))
    return true
  }

  async recordTestResult(
    id: string,
    viewerId: string,
    result: MCPTestResult
  ): Promise<void> {
    const existing = await this.getByIdForViewer(id, viewerId)
    if (!existing || existing.owner_type !== "user") {
      return
    }

    const updated: MCPConnection = {
      ...existing,
      last_test_at: new Date().toISOString(),
      last_test_status: result.success ? "ok" : "failed",
      last_test_error: result.error_message ?? undefined,
      updated_at: new Date().toISOString(),
    }

    await this.store.put(connectionKey(id), updated)
  }

  async recordDiscoveryResult(
    id: string,
    viewerId: string,
    result: MCPDiscoveryResult
  ): Promise<void> {
    const existing = await this.getByIdForViewer(id, viewerId)
    if (!existing || existing.owner_type !== "user") {
      return
    }

    const updated: MCPConnection = {
      ...existing,
      last_discovery_at: new Date().toISOString(),
      last_discovery_tool_count: result.tools.length,
      updated_at: new Date().toISOString(),
    }

    await this.store.put(connectionKey(id), updated)
  }
}

export class MCPDiscoveredToolService {
  private readonly store: MCPStore

  constructor(env?: unknown) {
    this.store = resolveStore(env)
  }

  async listTools(connectionId: string): Promise<MCPDiscoveredTool[]> {
    const records = await this.store.list<MCPDiscoveredTool>(
      toolPrefix(connectionId)
    )
    return records.map((record) => record.value)
  }

  async listByConnectionIds(
    connectionIds: string[]
  ): Promise<Record<string, MCPDiscoveredTool[]>> {
    const groups = createConnectionGroups(connectionIds)

    await Promise.all(
      [...new Set(connectionIds)].map(async (connectionId) => {
        const records = await this.store.list<MCPDiscoveredTool>(
          toolPrefix(connectionId)
        )
        groups[connectionId] = records.map((record) => record.value)
      })
    )

    return groups
  }

  async replaceDiscoveredTools(
    connectionId: string,
    tools: MCPDiscoveryResult["tools"]
  ): Promise<void> {
    const existing = await this.store.list<MCPDiscoveredTool>(
      toolPrefix(connectionId)
    )
    await Promise.all(existing.map((record) => this.store.delete(record.key)))

    const discoveredAt = new Date().toISOString()
    await Promise.all(
      tools.map((mcpToolDef) => {
        const key = toolKey(connectionId, mcpToolDef.name)
        const record: MCPDiscoveredTool = {
          id: key,
          connection_id: connectionId,
          name: mcpToolDef.name,
          ...(mcpToolDef.description
            ? { description: mcpToolDef.description }
            : {}),
          input_schema: mcpToolDef.parameters,
          discovered_at: discoveredAt,
        }

        return this.store.put(key, record)
      })
    )
  }
}

export class MCPToolOverrideService {
  private readonly store: MCPStore

  constructor(env?: unknown) {
    this.store = resolveStore(env)
  }

  async getDisabledToolNames(
    connectionId: string,
    viewerId: string
  ): Promise<string[]> {
    const records = await this.store.list<MCPToolOverride>(
      overridePrefix(connectionId, viewerId)
    )

    return records
      .map((record) => record.value)
      .filter((override) => override.is_disabled)
      .map((override) => override.tool_name)
  }

  async listOverridesByConnectionIds(
    connectionIds: string[],
    viewerId: string
  ): Promise<Record<string, MCPToolOverride[]>> {
    const groups = createOverrideGroups(connectionIds)

    await Promise.all(
      [...new Set(connectionIds)].map(async (connectionId) => {
        const records = await this.store.list<MCPToolOverride>(
          overridePrefix(connectionId, viewerId)
        )
        groups[connectionId] = records.map((record) => record.value)
      })
    )

    return groups
  }

  async disableTool(
    connectionId: string,
    toolName: string,
    viewerId: string
  ): Promise<MCPToolOverride> {
    const key = overrideKey(connectionId, viewerId, toolName)
    const existing = await this.store.get<MCPToolOverride>(key)
    const override: MCPToolOverride = {
      id: existing?.id ?? key,
      connection_id: connectionId,
      tool_name: toolName,
      owner_id: viewerId,
      is_disabled: true,
      created_at: existing?.created_at ?? new Date().toISOString(),
    }

    await this.store.put(key, override)
    return override
  }

  async enableTool(
    connectionId: string,
    toolName: string,
    viewerId: string
  ): Promise<MCPToolOverride | null> {
    const key = overrideKey(connectionId, viewerId, toolName)
    const existing = await this.store.get<MCPToolOverride>(key)
    if (!existing) {
      return null
    }

    await this.store.delete(key)
    return existing
  }
}

interface RuntimeLogger {
  error(message?: unknown, ...optionalParams: unknown[]): void
  warn?(message?: unknown, ...optionalParams: unknown[]): void
}

export interface RegisterRuntimeMCPToolsOptions {
  viewerId: string
  env?: unknown
  store?: MCPStore
  client?: MCPAdapterClient
  logger?: RuntimeLogger
}

function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodTypeAny {
  const type = schema.type as string | undefined

  if (type === "string") {
    return z.string()
  }
  if (type === "number") {
    return z.number()
  }
  if (type === "integer") {
    return z.number().int()
  }
  if (type === "boolean") {
    return z.boolean()
  }
  if (type === "array") {
    const items = schema.items as Record<string, unknown> | undefined
    return items ? z.array(jsonSchemaToZod(items)) : z.array(z.any())
  }
  if (type === "object") {
    const properties = schema.properties as
      | Record<string, Record<string, unknown>>
      | undefined
    if (properties) {
      const shape: Record<string, z.ZodTypeAny> = {}
      for (const [key, propSchema] of Object.entries(properties)) {
        shape[key] = jsonSchemaToZod(propSchema)
      }
      return z.object(shape)
    }
    return z.record(z.string(), z.any())
  }

  return z.any()
}

export async function registerRuntimeMCPTools({
  viewerId,
  env,
  store,
  client = new StreamableHttpMCPClient(),
  logger = console,
  // eslint-disable-next-line typescript/no-explicit-any -- AI SDK ToolSet requires Record<string, any>
}: RegisterRuntimeMCPToolsOptions): Promise<Record<string, any>> {
  const resolvedStore = store ?? createMCPStore({ env: asEnvRecord(env) })
  const connections = new MCPConnectionService(resolvedStore)
  const tools = new MCPDiscoveredToolService(resolvedStore)
  const overrides = new MCPToolOverrideService(resolvedStore)
  const visibleConnections = await connections.listForViewer(viewerId)

  // eslint-disable-next-line typescript/no-explicit-any -- AI SDK ToolSet requires Record<string, any>
  const result: Record<string, any> = {}

  for (const connection of [
    ...visibleConnections.platform,
    ...visibleConnections.user,
  ]) {
    if (!connection.is_enabled) {
      continue
    }

    try {
      // eslint-disable-next-line no-await-in-loop -- connections must be processed sequentially for deterministic key ordering
      const [discoveredTools, disabledToolNames] = await Promise.all([
        tools.listTools(connection.id),
        overrides.getDisabledToolNames(connection.id, viewerId),
      ])
      const disabledToolNameSet = new Set(disabledToolNames)

      for (const mcpTool of discoveredTools) {
        if (disabledToolNameSet.has(mcpTool.name)) {
          continue
        }

        const sanitizedConnectionId = connection.id.replaceAll("-", "_")
        const registryKey = `mcp_${sanitizedConnectionId}_${mcpTool.name}`
        const zodSchema = jsonSchemaToZod(mcpTool.input_schema)

        result[registryKey] = tool({
          description: mcpTool.description ?? `MCP tool ${mcpTool.name}`,
          parameters: zodSchema,
          // @ts-expect-error - AI SDK tool() execute signature inference issue with dynamic schemas
          execute: async (args) => {
            const callResult = await client.call(
              connection.endpoint_url,
              mcpTool.name,
              args
            )

            if (callResult.success && callResult.tool_result) {
              return callResult.tool_result.content
            }

            throw new Error(callResult.error_message ?? "MCP call failed")
          },
        })
      }
    } catch (error) {
      logger.error(
        `Failed to load MCP tools for connection ${connection.id}`,
        error
      )
    }
  }

  return result
}
