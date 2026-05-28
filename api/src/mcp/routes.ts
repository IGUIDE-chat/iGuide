import {
  type MCPAdapterClient,
  type MCPDiscoveryResult,
  type MCPFailureReason,
  type MCPTestResult,
} from "./adapter.ts"
import {
  MCPConnectionService,
  MCPDiscoveredToolService,
  MCPToolOverrideService,
} from "./service.ts"
import { StreamableHttpMCPClient } from "./streamable-http-client.ts"
import {
  type MCPConnection,
  type MCPConnectionTransport,
  type MCPDiscoveredTool,
  type MCPToolOverride,
} from "./types.ts"

const INTEGRATIONS_LIMITATIONS = [
  "Streamable HTTP only",
  "Credential-protected third-party MCP endpoints are not supported",
  "Stdio and legacy SSE transports are not supported",
  "Marketplace/template flows are not available in phase 1",
  "Arbitrary public third-party MCP quality is not guaranteed by the platform",
] as const

const CREDENTIAL_FIELD_PATTERN =
  /(credential|credentials|secret|token|api[_-]?key|authorization|password|headers?)/i

interface JSONHeaders {
  [key: string]: string
}

class MCPRouteError extends Error {
  readonly status: number
  readonly failureReason?: MCPFailureReason

  constructor(
    message: string,
    status: number,
    failureReason?: MCPFailureReason
  ) {
    super(message)
    this.name = "MCPRouteError"
    this.status = status
    this.failureReason = failureReason
  }
}

class MCPJSONBodyError extends Error {
  readonly cause: unknown

  constructor(message: string, cause: unknown) {
    super(message)
    this.name = "MCPJSONBodyError"
    this.cause = cause
  }
}

export interface MCPRouteServices {
  connections: Pick<
    MCPConnectionService,
    | "listForViewer"
    | "createUserConnection"
    | "getByIdForViewer"
    | "updateUserConnection"
    | "deleteUserConnection"
    | "recordTestResult"
    | "recordDiscoveryResult"
  >
  tools: Pick<
    MCPDiscoveredToolService,
    "listByConnectionIds" | "replaceDiscoveredTools"
  >
  overrides: Pick<
    MCPToolOverrideService,
    "listOverridesByConnectionIds" | "disableTool" | "enableTool"
  >
  client: Pick<MCPAdapterClient, "test" | "discover">
}

interface CreateConnectionBody {
  display_name: string
  endpoint_url: string
  transport: MCPConnectionTransport
  description?: string
}

interface UpdateConnectionBody {
  display_name?: string
  description?: string
  is_enabled?: boolean
}

function jsonResponse(
  body: unknown,
  status: number,
  headers: JSONHeaders = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  })
}

function stripApiPrefix(pathname: string) {
  return pathname.startsWith("/api/") ? pathname.slice(4) : pathname
}

function parseEndpointUrl(endpointUrl: string): URL {
  try {
    return new URL(endpointUrl)
  } catch {
    throw new MCPRouteError("endpoint_url must be a valid URL", 400)
  }
}

function assertNoCredentialedEndpoint(url: URL) {
  if (url.username || url.password) {
    throw new MCPRouteError(
      "Credential-protected endpoints are not supported in phase 1",
      400,
      "auth_required"
    )
  }
}

function hasCredentialFields(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasCredentialFields(item))
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(
      ([key, nested]) =>
        CREDENTIAL_FIELD_PATTERN.test(key) || hasCredentialFields(nested)
    )
  }

  return false
}

async function readJSONBody(
  request: Request
): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Request body must be an object")
    }

    return body as Record<string, unknown>
  } catch (error) {
    throw new MCPJSONBodyError(
      error instanceof Error ? error.message : "Invalid JSON request body",
      error
    )
  }
}

function parseCreateBody(body: Record<string, unknown>): CreateConnectionBody {
  if (hasCredentialFields(body)) {
    throw new MCPRouteError(
      "Credential fields are not supported in phase 1",
      400,
      "auth_required"
    )
  }

  if (typeof body.display_name !== "string" || !body.display_name.trim()) {
    throw new MCPRouteError("display_name is required", 400)
  }

  if (typeof body.endpoint_url !== "string" || !body.endpoint_url.trim()) {
    throw new MCPRouteError("endpoint_url is required", 400)
  }

  const endpointUrl = body.endpoint_url.trim()
  const parsedEndpointUrl = parseEndpointUrl(endpointUrl)
  assertNoCredentialedEndpoint(parsedEndpointUrl)

  if (body.transport !== "streamable_http") {
    throw new MCPRouteError(
      "transport must be streamable_http",
      400,
      "unsupported_transport"
    )
  }

  if (body.description !== undefined && typeof body.description !== "string") {
    throw new MCPRouteError("description must be a string when provided", 400)
  }

  return {
    display_name: body.display_name.trim(),
    endpoint_url: endpointUrl,
    transport: "streamable_http",
    ...(typeof body.description === "string"
      ? { description: body.description.trim() }
      : {}),
  }
}

function parseUpdateBody(body: Record<string, unknown>): UpdateConnectionBody {
  if (hasCredentialFields(body)) {
    throw new MCPRouteError(
      "Credential fields are not supported in phase 1",
      400,
      "auth_required"
    )
  }

  const patch: UpdateConnectionBody = {}

  if (body.display_name !== undefined) {
    if (typeof body.display_name !== "string" || !body.display_name.trim()) {
      throw new MCPRouteError("display_name must be a non-empty string", 400)
    }
    patch.display_name = body.display_name.trim()
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      throw new MCPRouteError("description must be a string", 400)
    }
    patch.description = body.description.trim()
  }

  if (body.is_enabled !== undefined) {
    if (typeof body.is_enabled !== "boolean") {
      throw new MCPRouteError("is_enabled must be a boolean", 400)
    }
    patch.is_enabled = body.is_enabled
  }

  if (Object.keys(patch).length === 0) {
    throw new MCPRouteError(
      "At least one of display_name, description, or is_enabled must be provided",
      400
    )
  }

  return patch
}

function assertMutableConnection(connection: MCPConnection) {
  if (connection.owner_type === "platform") {
    throw new MCPRouteError(
      "Platform-owned integrations are not mutable via user endpoints",
      403
    )
  }
}

function assertPhase1CompatibleConnection(connection: MCPConnection) {
  if (connection.transport !== "streamable_http") {
    throw new MCPRouteError(
      "Only streamable_http integrations can be tested or refreshed in phase 1",
      400,
      "unsupported_transport"
    )
  }

  assertNoCredentialedEndpoint(parseEndpointUrl(connection.endpoint_url))
}

function mapConnectionWithMetadata(
  connection: MCPConnection,
  toolsByConnectionId: Record<string, MCPDiscoveredTool[]>,
  overridesByConnectionId: Record<string, MCPToolOverride[]>
) {
  const tools = toolsByConnectionId[connection.id] ?? []
  const overrides = overridesByConnectionId[connection.id] ?? []

  return connection.owner_type === "user"
    ? { ...connection, tools, overrides }
    : { ...connection, tools }
}

async function buildConnectionDetail(
  connection: MCPConnection,
  services: MCPRouteServices,
  viewerId: string
) {
  const [toolsByConnectionId, overridesByConnectionId] = await Promise.all([
    services.tools.listByConnectionIds([connection.id]),
    services.overrides.listOverridesByConnectionIds([connection.id], viewerId),
  ])

  return mapConnectionWithMetadata(
    connection,
    toolsByConnectionId,
    overridesByConnectionId
  )
}

export function createMCPRouteServices(env?: unknown): MCPRouteServices {
  return {
    connections: new MCPConnectionService(env),
    tools: new MCPDiscoveredToolService(env),
    overrides: new MCPToolOverrideService(env),
    client: new StreamableHttpMCPClient(),
  }
}

export async function handleIntegrationsRoute(
  request: Request,
  services: MCPRouteServices,
  viewerId: string,
  responseHeaders: JSONHeaders = {}
): Promise<Response> {
  const url = new URL(request.url)
  const pathname = stripApiPrefix(url.pathname)

  if (pathname === "/integrations") {
    if (request.method === "GET") {
      const connections = await services.connections.listForViewer(viewerId)
      const connectionIds = [
        ...connections.platform.map((connection) => connection.id),
        ...connections.user.map((connection) => connection.id),
      ]
      const [toolsByConnectionId, overridesByConnectionId] = await Promise.all([
        services.tools.listByConnectionIds(connectionIds),
        services.overrides.listOverridesByConnectionIds(
          connectionIds,
          viewerId
        ),
      ])

      return jsonResponse(
        {
          phase1_limitations: [...INTEGRATIONS_LIMITATIONS],
          platform: connections.platform.map((connection) =>
            mapConnectionWithMetadata(
              connection,
              toolsByConnectionId,
              overridesByConnectionId
            )
          ),
          user: connections.user.map((connection) =>
            mapConnectionWithMetadata(
              connection,
              toolsByConnectionId,
              overridesByConnectionId
            )
          ),
        },
        200,
        responseHeaders
      )
    }

    if (request.method === "POST") {
      const body = parseCreateBody(await readJSONBody(request))
      const connection = await services.connections.createUserConnection(
        viewerId,
        body
      )
      const detail = await buildConnectionDetail(connection, services, viewerId)
      return jsonResponse(detail, 201, responseHeaders)
    }
  }

  const detailMatch = pathname.match(/^\/integrations\/([^/]+)$/)
  if (detailMatch) {
    const connectionId = decodeURIComponent(detailMatch[1])
    const connection = await services.connections.getByIdForViewer(
      connectionId,
      viewerId
    )

    if (!connection) {
      return jsonResponse(
        { error: "Integration not found" },
        404,
        responseHeaders
      )
    }

    if (request.method === "GET") {
      return jsonResponse(
        await buildConnectionDetail(connection, services, viewerId),
        200,
        responseHeaders
      )
    }

    if (request.method === "PUT") {
      assertMutableConnection(connection)
      const patch = parseUpdateBody(await readJSONBody(request))
      const updated = await services.connections.updateUserConnection(
        connectionId,
        viewerId,
        patch
      )

      if (!updated) {
        return jsonResponse(
          { error: "Integration not found" },
          404,
          responseHeaders
        )
      }

      return jsonResponse(
        await buildConnectionDetail(updated, services, viewerId),
        200,
        responseHeaders
      )
    }

    if (request.method === "DELETE") {
      assertMutableConnection(connection)
      const deleted = await services.connections.deleteUserConnection(
        connectionId,
        viewerId
      )

      if (!deleted) {
        return jsonResponse(
          { error: "Integration not found" },
          404,
          responseHeaders
        )
      }

      return jsonResponse({ success: true }, 200, responseHeaders)
    }
  }

  const testMatch = pathname.match(/^\/integrations\/([^/]+)\/test$/)
  if (testMatch && request.method === "POST") {
    const connectionId = decodeURIComponent(testMatch[1])
    const connection = await services.connections.getByIdForViewer(
      connectionId,
      viewerId
    )

    if (!connection) {
      return jsonResponse(
        { error: "Integration not found" },
        404,
        responseHeaders
      )
    }

    assertMutableConnection(connection)
    assertPhase1CompatibleConnection(connection)
    const result = (await services.client.test(
      connection.endpoint_url
    )) as MCPTestResult
    await services.connections.recordTestResult(connectionId, viewerId, result)
    return jsonResponse(result, 200, responseHeaders)
  }

  const refreshMatch = pathname.match(/^\/integrations\/([^/]+)\/refresh$/)
  if (refreshMatch && request.method === "POST") {
    const connectionId = decodeURIComponent(refreshMatch[1])
    const connection = await services.connections.getByIdForViewer(
      connectionId,
      viewerId
    )

    if (!connection) {
      return jsonResponse(
        { error: "Integration not found" },
        404,
        responseHeaders
      )
    }

    assertMutableConnection(connection)
    assertPhase1CompatibleConnection(connection)
    const result = (await services.client.discover(
      connection.endpoint_url
    )) as MCPDiscoveryResult
    await services.connections.recordDiscoveryResult(
      connectionId,
      viewerId,
      result
    )
    if (result.success) {
      await services.tools.replaceDiscoveredTools(connectionId, result.tools)
    }
    return jsonResponse(result, 200, responseHeaders)
  }

  const toolToggleMatch = pathname.match(
    /^\/integrations\/([^/]+)\/tools\/([^/]+)\/(disable|enable)$/
  )
  if (toolToggleMatch && request.method === "POST") {
    const connectionId = decodeURIComponent(toolToggleMatch[1])
    const toolName = decodeURIComponent(toolToggleMatch[2])
    const mode = toolToggleMatch[3]
    const connection = await services.connections.getByIdForViewer(
      connectionId,
      viewerId
    )

    if (!connection) {
      return jsonResponse(
        { error: "Integration not found" },
        404,
        responseHeaders
      )
    }

    assertMutableConnection(connection)
    const override =
      mode === "disable"
        ? await services.overrides.disableTool(connectionId, toolName, viewerId)
        : await services.overrides.enableTool(connectionId, toolName, viewerId)

    return jsonResponse(
      {
        success: true,
        tool_name: toolName,
        is_disabled: mode === "disable",
        override,
      },
      200,
      responseHeaders
    )
  }

  return jsonResponse({ error: "Method not allowed" }, 400, responseHeaders)
}

export async function maybeHandleIntegrationsRoute(
  request: Request,
  services: MCPRouteServices,
  viewerId: string,
  responseHeaders: JSONHeaders = {}
): Promise<Response | null> {
  const pathname = stripApiPrefix(new URL(request.url).pathname)
  if (!pathname.startsWith("/integrations")) {
    return null
  }

  try {
    return await handleIntegrationsRoute(
      request,
      services,
      viewerId,
      responseHeaders
    )
  } catch (error) {
    if (error instanceof MCPRouteError) {
      return jsonResponse(
        {
          error: error.message,
          ...(error.failureReason
            ? { failure_reason: error.failureReason }
            : {}),
        },
        error.status,
        responseHeaders
      )
    }

    if (
      error instanceof Error &&
      (error.message.includes("required") ||
        error.message.includes("must be") ||
        error.message.includes("At least one") ||
        error.message.includes("Request body") ||
        error.message.includes("Invalid JSON"))
    ) {
      return jsonResponse({ error: error.message }, 400, responseHeaders)
    }

    console.error("Integrations route error:", error)
    return jsonResponse(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Unknown integrations error",
      },
      500,
      responseHeaders
    )
  }
}
