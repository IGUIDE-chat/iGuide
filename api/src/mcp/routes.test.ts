import { expect, test } from "vite-plus/test"

import type { MCPDiscoveryResult, MCPTestResult } from "./adapter.ts"
import { maybeHandleIntegrationsRoute } from "./routes.ts"
import type {
  MCPConnection,
  MCPDiscoveredTool,
  MCPToolOverride,
} from "./types.ts"

interface MockServices {
  connections: {
    listForViewer: (viewerId: string) => Promise<{
      platform: MCPConnection[]
      user: MCPConnection[]
    }>
    createUserConnection: (
      viewerId: string,
      input: Record<string, unknown>
    ) => Promise<MCPConnection>
    getByIdForViewer: (
      id: string,
      viewerId: string
    ) => Promise<MCPConnection | null>
    updateUserConnection: (
      id: string,
      viewerId: string,
      patch: Record<string, unknown>
    ) => Promise<MCPConnection | null>
    deleteUserConnection: (id: string, viewerId: string) => Promise<boolean>
    recordTestResult: (
      id: string,
      viewerId: string,
      result: MCPTestResult
    ) => Promise<void>
    recordDiscoveryResult: (
      id: string,
      viewerId: string,
      result: MCPDiscoveryResult
    ) => Promise<void>
  }
  tools: {
    listByConnectionIds: (
      connectionIds: string[]
    ) => Promise<Record<string, MCPDiscoveredTool[]>>
    replaceDiscoveredTools: (
      connectionId: string,
      tools: MCPDiscoveryResult["tools"]
    ) => Promise<void>
  }
  overrides: {
    disableTool: (
      connectionId: string,
      toolName: string,
      viewerId: string
    ) => Promise<MCPToolOverride>
    enableTool: (
      connectionId: string,
      toolName: string,
      viewerId: string
    ) => Promise<MCPToolOverride | null>
    listOverridesByConnectionIds: (
      connectionIds: string[],
      viewerId: string
    ) => Promise<Record<string, MCPToolOverride[]>>
  }
  client: {
    test: (url: string) => Promise<MCPTestResult>
    discover: (url: string) => Promise<MCPDiscoveryResult>
  }
}

const baseConnection: MCPConnection = {
  id: "conn_user_1",
  owner_id: "user-123",
  owner_type: "user",
  visibility: "owner_only",
  display_name: "Example MCP",
  endpoint_url: "https://example.com/mcp",
  transport: "streamable_http",
  description: "demo",
  is_enabled: true,
  last_test_status: null,
  created_at: "2026-04-18T00:00:00.000Z",
  updated_at: "2026-04-18T00:00:00.000Z",
}

function createServices(overrides: Partial<MockServices> = {}): MockServices {
  return {
    connections: {
      listForViewer: async () => ({ platform: [], user: [baseConnection] }),
      createUserConnection: async (_viewerId, input) => ({
        ...baseConnection,
        display_name: String(input.display_name),
        endpoint_url: String(input.endpoint_url),
        description:
          typeof input.description === "string" ? input.description : undefined,
      }),
      getByIdForViewer: async (id) =>
        id === baseConnection.id ? baseConnection : null,
      updateUserConnection: async (id, _viewerId, patch) =>
        id === baseConnection.id
          ? {
              ...baseConnection,
              ...(patch as Partial<MCPConnection>),
            }
          : null,
      deleteUserConnection: async (id) => id === baseConnection.id,
      recordTestResult: async () => {},
      recordDiscoveryResult: async () => {},
    },
    tools: {
      listByConnectionIds: async () => ({
        [baseConnection.id]: [
          {
            id: "tool-1",
            connection_id: baseConnection.id,
            name: "search_docs",
            description: "Search docs",
            input_schema: { type: "object" },
            discovered_at: "2026-04-18T00:00:00.000Z",
          },
        ],
      }),
      replaceDiscoveredTools: async () => {},
    },
    overrides: {
      disableTool: async (connectionId, toolName, viewerId) => ({
        id: "override-1",
        connection_id: connectionId,
        tool_name: toolName,
        owner_id: viewerId,
        is_disabled: true,
        created_at: "2026-04-18T00:00:00.000Z",
      }),
      enableTool: async () => null,
      listOverridesByConnectionIds: async () => ({
        [baseConnection.id]: [
          {
            id: "override-1",
            connection_id: baseConnection.id,
            tool_name: "search_docs",
            owner_id: baseConnection.owner_id,
            is_disabled: true,
            created_at: "2026-04-18T00:00:00.000Z",
          },
        ],
      }),
    },
    client: {
      test: async () => ({
        success: true,
        failure_reason: null,
        error_message: null,
        latency_ms: 42,
      }),
      discover: async () => ({
        success: true,
        failure_reason: null,
        error_message: null,
        tools: [
          {
            url: baseConnection.endpoint_url,
            name: "search_docs",
            description: "Search docs",
            parameters: { type: "object" },
          },
        ],
      }),
    },
    ...overrides,
  }
}

function requireResponse(response: Response | null): Response {
  expect(response).toBeTruthy()
  return response!
}

test("GET /integrations returns platform/user sections and phase1 disclaimers", async () => {
  const platformConnection: MCPConnection = {
    ...baseConnection,
    id: "conn_platform_1",
    owner_id: "platform",
    owner_type: "platform",
    visibility: "global",
    display_name: "Platform MCP",
  }

  const response = await maybeHandleIntegrationsRoute(
    new Request("https://api.example.com/integrations"),
    createServices({
      connections: {
        ...createServices().connections,
        listForViewer: async () => ({
          platform: [platformConnection],
          user: [baseConnection],
        }),
      },
    }),
    "user-123"
  )

  const resolved = requireResponse(response)
  expect(resolved.status).toBe(200)
  const body = await resolved.json()
  expect(Array.isArray(body.phase1_limitations)).toBeTruthy()
  expect(body.phase1_limitations.length > 0).toBeTruthy()
  for (const limitation of body.phase1_limitations) {
    expect(typeof limitation).toBe("string")
    expect(limitation.length > 0).toBeTruthy()
  }
  expect(body.platform[0].owner_type).toBe("platform")
  expect(body.user[0].owner_type).toBe("user")
  expect(Array.isArray(body.platform[0].tools)).toBeTruthy()
  expect(Array.isArray(body.user[0].tools)).toBeTruthy()
  expect(Array.isArray(body.user[0].overrides)).toBeTruthy()
})

test("POST /integrations rejects credential fields", async () => {
  const response = await maybeHandleIntegrationsRoute(
    new Request("https://api.example.com/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: "Blocked",
        endpoint_url: "https://example.com/mcp",
        transport: "streamable_http",
        api_key: "secret",
      }),
    }),
    createServices(),
    "user-123"
  )

  const resolved = requireResponse(response)
  expect(resolved.status).toBe(400)
  const body = await resolved.json()
  expect(body.error).toMatch(/credential/i)
  expect(body.failure_reason).toBe("auth_required")
})

test("POST /integrations rejects unsupported transports with failure classification", async () => {
  const response = await maybeHandleIntegrationsRoute(
    new Request("https://api.example.com/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: "Legacy SSE",
        endpoint_url: "https://example.com/sse",
        transport: "sse",
      }),
    }),
    createServices(),
    "user-123"
  )

  const resolved = requireResponse(response)
  expect(resolved.status).toBe(400)
  const body = await resolved.json()
  expect(body.failure_reason).toBe("unsupported_transport")
  expect(body.error).toMatch(/streamable_http/i)
})

test("POST /integrations rejects credentialed endpoint URLs with failure classification", async () => {
  const response = await maybeHandleIntegrationsRoute(
    new Request("https://api.example.com/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: "Credentialed MCP",
        endpoint_url: "https://user:pass@example.com/mcp",
        transport: "streamable_http",
      }),
    }),
    createServices(),
    "user-123"
  )

  const resolved = requireResponse(response)
  expect(resolved.status).toBe(400)
  const body = await resolved.json()
  expect(body.failure_reason).toBe("auth_required")
  expect(body.error).toMatch(/credential|auth/i)
})

test("PUT on a platform-owned connection returns 403", async () => {
  const platformConnection: MCPConnection = {
    ...baseConnection,
    id: "conn_platform_1",
    owner_id: "platform",
    owner_type: "platform",
    visibility: "global",
  }

  const services = createServices({
    connections: {
      ...createServices().connections,
      getByIdForViewer: async (id) =>
        // eslint-disable-next-line vitest/no-conditional-in-test -- mock implementation requires conditional
        id === platformConnection.id ? platformConnection : null,
    },
  })

  const response = await maybeHandleIntegrationsRoute(
    new Request(
      `https://api.example.com/integrations/${platformConnection.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: false }),
      }
    ),
    services,
    "user-123"
  )

  const resolved = requireResponse(response)
  expect(resolved.status).toBe(403)
  const body = await resolved.json()
  expect(body.error).toMatch(/platform/i)
})

test("POST /integrations/:id/test returns MCPTestResult and persists it", async () => {
  let recordedResult: MCPTestResult | null = null
  const services = createServices({
    connections: {
      ...createServices().connections,
      recordTestResult: async (_id, _viewerId, result) => {
        recordedResult = result
      },
    },
  })

  const response = await maybeHandleIntegrationsRoute(
    new Request(
      `https://api.example.com/integrations/${baseConnection.id}/test`,
      {
        method: "POST",
      }
    ),
    services,
    "user-123"
  )

  const resolved = requireResponse(response)
  expect(resolved.status).toBe(200)
  const body = (await resolved.json()) as MCPTestResult
  expect(body.success).toBe(true)
  expect((recordedResult as unknown as MCPTestResult).latency_ms).toBe(42)
})
