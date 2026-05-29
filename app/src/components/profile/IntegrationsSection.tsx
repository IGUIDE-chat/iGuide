/**
 * @file ./src/components/profile/IntegrationsSection.tsx
 * @description Profile feature UI — MCP integrations with add/test/save/details interactions (Task 8)
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useEffect, useState } from "react"

import { supabase } from "../../services/supabase"
import { type Language } from "../../types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiscoveredTool {
  name: string
  description: string
  enabled: boolean
}

interface PlatformConnection {
  id: string
  name: string
  status: "ok" | "error" | "unknown"
  toolCount: number
  url: string
}

interface UserConnection {
  id: string
  name: string
  description: string
  status: "ok" | "error" | "unknown"
  url: string
  is_enabled: boolean
  tools: DiscoveredTool[]
}

interface ApiConnection {
  id: string
  display_name: string
  description?: string
  endpoint_url: string
  last_test_status?: string | null
  is_enabled: boolean
  tools?: Array<{ name: string; description?: string }>
}

type TestResult =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; tools: Array<{ name: string; description: string }> }
  | { state: "failure"; reason: MockFailureReason }

type MockFailureReason =
  | "unreachable"
  | "auth_required"
  | "invalid_mcp_response"
  | "no_tools_discovered"
  | "timeout"
  | "unsupported_transport"
  | "unknown"

// ─── API helpers ──────────────────────────────────────────────────────────────

const API_BASE =
  (import.meta as { env: Record<string, string> }).env.VITE_API_URL ||
  "http://localhost:8787"

async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken()
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  })
}

function deriveConnectionStatus(
  lastTestStatus: string | null | undefined
): "ok" | "error" | "unknown" {
  if (lastTestStatus === "ok") {
    return "ok"
  }
  if (lastTestStatus) {
    return "error"
  }
  return "unknown"
}

async function fetchConnectionsFromApi(): Promise<{
  platform: PlatformConnection[]
  user: UserConnection[]
}> {
  const res = await apiFetch("/integrations")
  if (!res.ok) {
    throw new Error(`Failed to load integrations: ${res.status}`)
  }
  const data = (await res.json()) as {
    platform?: ApiConnection[]
    user?: ApiConnection[]
  }
  return {
    platform: (data.platform ?? []).map((c) => ({
      id: c.id,
      name: c.display_name,
      status: deriveConnectionStatus(c.last_test_status),
      toolCount: (c.tools ?? []).length,
      url: c.endpoint_url,
    })),
    user: (data.user ?? []).map((c) => ({
      id: c.id,
      name: c.display_name,
      description: c.description ?? "",
      status: deriveConnectionStatus(c.last_test_status),
      url: c.endpoint_url,
      is_enabled: c.is_enabled,
      tools: (c.tools ?? []).map((t) => ({
        name: t.name,
        description: t.description ?? "",
        enabled: true,
      })),
    })),
  }
}

async function saveConnectionToApi(data: {
  name: string
  url: string
  description: string
}): Promise<UserConnection> {
  const res = await apiFetch("/integrations", {
    method: "POST",
    body: JSON.stringify({
      display_name: data.name,
      endpoint_url: data.url,
      transport: "streamable_http",
      description: data.description || undefined,
    }),
  })
  if (!res.ok) {
    const err = (await res
      .json()
      .catch(() => ({ error: "Unknown error" }))) as { error?: string }
    throw new Error(err.error ?? `Failed to save: ${res.status}`)
  }
  const conn = (await res.json()) as ApiConnection
  return {
    id: conn.id,
    name: conn.display_name,
    description: conn.description ?? "",
    status: deriveConnectionStatus(conn.last_test_status),
    url: conn.endpoint_url,
    is_enabled: conn.is_enabled,
    tools: (conn.tools ?? []).map((t) => ({
      name: t.name,
      description: t.description ?? "",
      enabled: true,
    })),
  }
}

async function deleteConnectionFromApi(id: string): Promise<void> {
  const res = await apiFetch(`/integrations/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const err = (await res
      .json()
      .catch(() => ({ error: "Unknown error" }))) as { error?: string }
    throw new Error(err.error ?? `Failed to delete: ${res.status}`)
  }
}

async function mockTestConnection(url: string): Promise<{
  ok: boolean
  tools?: Array<{ name: string; description: string }>
  reason?: MockFailureReason
}> {
  await new Promise((resolve) => {
    setTimeout(resolve, 1500)
  })
  const normalizedUrl = url.toLowerCase()
  if (normalizedUrl.includes("auth") || normalizedUrl.includes("private")) {
    return { ok: false, reason: "auth_required" }
  }
  if (normalizedUrl.includes("invalid") || normalizedUrl.includes("broken")) {
    return { ok: false, reason: "invalid_mcp_response" }
  }
  if (normalizedUrl.includes("empty") || normalizedUrl.includes("notools")) {
    return { ok: false, reason: "no_tools_discovered" }
  }
  if (normalizedUrl.includes("timeout") || normalizedUrl.includes("slow")) {
    return { ok: false, reason: "timeout" }
  }
  if (normalizedUrl.includes("sse") || normalizedUrl.includes("stdio")) {
    return { ok: false, reason: "unsupported_transport" }
  }
  if (normalizedUrl.includes("fail") || normalizedUrl.includes("down")) {
    return { ok: false, reason: "unreachable" }
  }
  return {
    ok: true,
    tools: [
      { name: "search_campus", description: "Search campus info" },
      { name: "get_events", description: "Get campus events" },
    ],
  }
}

// ─── Helpers (no component scope needed) ──────────────────────────────────────

const statusDot = (status: "ok" | "error" | "unknown", dimmed = false) => {
  const base = "size-2 rounded-full inline-block"
  if (status === "ok") {
    return (
      <span
        className={` ${base} ${dimmed ? "bg-emerald-300" : "bg-emerald-400"} `}
      />
    )
  }
  if (status === "error") {
    return (
      <span className={` ${base} ${dimmed ? "bg-red-300" : "bg-red-400"} `} />
    )
  }
  return <span className={` ${base} bg-slate-300`} />
}

const toolCount = (conn: UserConnection) => conn.tools.length

function ToolRowItem({
  tool,
  onToggle,
}: {
  tool: DiscoveredTool
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="min-w-0">
        <p
          className={`text-xs font-medium ${tool.enabled ? "text-slate-700" : "text-slate-400 line-through"}`}
        >
          {tool.name}
        </p>
        <p className="truncate text-xs text-slate-400">{tool.description}</p>
      </div>
      <button
        type="button"
        aria-label="Toggle tool"
        onClick={onToggle}
        className={`relative ml-3 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${tool.enabled ? "bg-illini-orange" : "bg-slate-200"}`}
        role="switch"
        aria-checked={tool.enabled}
      >
        <span
          className={`inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform ${tool.enabled ? "translate-x-4" : "translate-x-1"}`}
        />
      </button>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface IntegrationsSectionProps {
  language: Language
}

export const IntegrationsSection: React.FC<IntegrationsSectionProps> = ({
  language,
}) => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [platformConnections, setPlatformConnections] = useState<
    PlatformConnection[]
  >([])
  const [userConnections, setUserConnections] = useState<UserConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setLoadError(null)
    const load = async () => {
      try {
        const { platform, user } = await fetchConnectionsFromApi()
        setPlatformConnections(platform)
        setUserConnections(user)
      } catch (err: unknown) {
        setLoadError(
          err instanceof Error ? err.message : "Failed to load integrations"
        )
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // Add form
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState("")
  const [addUrl, setAddUrl] = useState("")
  const [addDesc, setAddDesc] = useState("")
  const [testResult, setTestResult] = useState<TestResult>({ state: "idle" })
  const [isSaving, setIsSaving] = useState(false)

  // Details panel
  const [detailsId, setDetailsId] = useState<string | null>(null)

  // ── i18n ───────────────────────────────────────────────────────────────────
  const t = {
    en: {
      title: "Integrations",
      platformTitle: "Platform Connections",
      platformDesc: "Provided by UIUC — read-only",
      myTitle: "My Connections",
      myDesc: "Your own MCP servers",
      add: "Add",
      tools: "tools",
      tool: "tool",
      statusOk: "Connected",
      statusError: "Error",
      statusUnknown: "Unknown",
      emptyState: "No connections yet.",
      emptyHint: "Add a public Streamable HTTP MCP server to get started.",
      bannerTitle: "Phase 1 guardrails",
      bannerBullets: [
        "Streamable HTTP only — stdio and legacy SSE are blocked.",
        "Credential-protected third-party endpoints are blocked — no credential fields are collected here.",
        "Marketplace and template flows are not available in phase 1.",
        "Arbitrary public third-party MCP quality is not guaranteed by the platform.",
      ],
      // Add form
      addTitle: "Add Connection",
      displayName: "Display Name",
      displayNamePlaceholder: "e.g. My Campus Tools",
      endpointUrl: "Endpoint URL",
      endpointUrlPlaceholder: "https://your-server.example.com/mcp",
      description: "Description (optional)",
      descriptionPlaceholder: "What does this server do?",
      transport: "Transport",
      transportValue: "Streamable HTTP",
      transportHint: "Other transports stay blocked in phase 1.",
      testConnection: "Test Connection",
      testing: "Testing…",
      testSuccess: "Connection ready to save",
      testSuccessDetailPrefix: "Structured result",
      testSuccessOutcome: "connected",
      discoveredLabel: "discovered",
      testFailure: "Connection test blocked",
      failureReasonLabel: "Failure reason",
      failureReasonDescriptions: {
        unreachable:
          "The endpoint could not be reached from the current network path.",
        auth_required:
          "The endpoint appears to require credentials, which phase 1 intentionally does not support.",
        invalid_mcp_response:
          "The server responded, but not with a valid MCP tool-discovery payload.",
        no_tools_discovered:
          "The server responded without any discoverable tools.",
        timeout:
          "The endpoint did not respond before the phase-1 timeout budget.",
        unsupported_transport:
          "This looks like a non-Streamable HTTP endpoint, which phase 1 blocks.",
        unknown: "The endpoint failed for an uncategorized reason.",
      },
      saveConnection: "Save Connection",
      saving: "Saving…",
      cancel: "Cancel",
      // Details panel
      detailsTitle: "Connection Details",
      connectionName: "Name",
      connectionUrl: "URL",
      connectionStatus: "Status",
      discoveredTools: "Discovered Tools",
      enableConnection: "Enable Connection",
      testAgain: "Test Again",
      refreshDiscovery: "Refresh Discovery",
      deleteConnection: "Delete Connection",
      confirmDelete: "Delete this connection? This cannot be undone.",
      close: "Close",
      enabled: "Enabled",
      disabled: "Disabled",
    },
    zh: {
      title: "集成",
      platformTitle: "平台连接",
      platformDesc: "由 UIUC 提供 — 只读",
      myTitle: "我的连接",
      myDesc: "你自己的 MCP 服务器",
      add: "添加",
      tools: "个工具",
      tool: "个工具",
      statusOk: "已连接",
      statusError: "错误",
      statusUnknown: "未知",
      emptyState: "暂无连接。",
      emptyHint: "添加一个公开的 Streamable HTTP MCP 服务器以开始使用。",
      bannerTitle: "第一阶段限制",
      bannerBullets: [
        "仅支持 Streamable HTTP——stdio 和旧版 SSE 传输会被拦截。",
        "不支持需要凭证的第三方端点——这里不会收集任何凭证字段。",
        "第一阶段不提供市场或模板流程。",
        "平台不对任意公开第三方 MCP 的服务质量作保证。",
      ],
      // Add form
      addTitle: "添加连接",
      displayName: "显示名称",
      displayNamePlaceholder: "例如：我的校园工具",
      endpointUrl: "端点 URL",
      endpointUrlPlaceholder: "https://your-server.example.com/mcp",
      description: "描述（可选）",
      descriptionPlaceholder: "这个服务器是做什么的？",
      transport: "传输协议",
      transportValue: "Streamable HTTP",
      transportHint: "其他传输方式在第一阶段仍被拦截。",
      testConnection: "测试连接",
      testing: "测试中…",
      testSuccess: "连接可保存",
      testSuccessDetailPrefix: "结构化结果",
      testSuccessOutcome: "已连接",
      discoveredLabel: "已发现",
      testFailure: "连接测试被拦截",
      failureReasonLabel: "失败原因",
      failureReasonDescriptions: {
        unreachable: "当前网络路径无法访问该端点。",
        auth_required: "该端点似乎需要凭证，而第一阶段刻意不支持此能力。",
        invalid_mcp_response:
          "服务器有响应，但返回的不是有效的 MCP 工具发现结果。",
        no_tools_discovered: "服务器响应成功，但没有发现任何工具。",
        timeout: "该端点在第一阶段的超时预算内没有完成响应。",
        unsupported_transport:
          "这看起来不是 Streamable HTTP 端点，因此会被第一阶段拦截。",
        unknown: "该端点因未分类原因失败。",
      },
      saveConnection: "保存连接",
      saving: "保存中…",
      cancel: "取消",
      // Details panel
      detailsTitle: "连接详情",
      connectionName: "名称",
      connectionUrl: "URL",
      connectionStatus: "状态",
      discoveredTools: "已发现工具",
      enableConnection: "启用连接",
      testAgain: "重新测试",
      refreshDiscovery: "刷新发现",
      deleteConnection: "删除连接",
      confirmDelete: "删除此连接？此操作无法撤销。",
      close: "关闭",
      enabled: "已启用",
      disabled: "已禁用",
    },
  }[language]

  // ── Helpers ────────────────────────────────────────────────────────────────

  const statusLabel = (status: "ok" | "error" | "unknown") => {
    if (status === "ok") {
      return t.statusOk
    }
    if (status === "error") {
      return t.statusError
    }
    return t.statusUnknown
  }

  const getFailureReasonDescription = (reason: MockFailureReason) =>
    t.failureReasonDescriptions[reason] ?? t.failureReasonDescriptions.unknown

  // ── Add form handlers ──────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setShowAddForm(true)
    setAddName("")
    setAddUrl("")
    setAddDesc("")
    setTestResult({ state: "idle" })
  }

  const handleCancelAdd = () => {
    setShowAddForm(false)
    setTestResult({ state: "idle" })
  }

  const handleTest = async () => {
    if (!addUrl.trim()) {
      return
    }
    setTestResult({ state: "loading" })
    const result = await mockTestConnection(addUrl.trim())
    if (result.ok && result.tools) {
      setTestResult({ state: "success", tools: result.tools })
    } else {
      setTestResult({ state: "failure", reason: result.reason ?? "unknown" })
    }
  }

  const handleSave = async () => {
    if (testResult.state !== "success") {
      return
    }
    setIsSaving(true)
    try {
      await saveConnectionToApi({
        name: addName.trim(),
        url: addUrl.trim(),
        description: addDesc.trim(),
      })
      const { platform, user } = await fetchConnectionsFromApi()
      setPlatformConnections(platform)
      setUserConnections(user)
      setIsSaving(false)
      setShowAddForm(false)
      setTestResult({ state: "idle" })
    } catch (err) {
      console.error("Failed to save connection:", err)
      setIsSaving(false)
      alert(err instanceof Error ? err.message : "Failed to save connection")
    }
  }

  // ── Details panel handlers ─────────────────────────────────────────────────

  const _detailsConn = userConnections.find((c) => c.id === detailsId) ?? null

  const handleToggleConnection = (id: string) => {
    setUserConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_enabled: !c.is_enabled } : c))
    )
  }

  const handleToggleTool = (connId: string, toolName: string) => {
    setUserConnections((prev) =>
      prev.map((c) =>
        c.id === connId
          ? {
              ...c,
              tools: c.tools.map((tool) =>
                tool.name === toolName
                  ? { ...tool, enabled: !tool.enabled }
                  : tool
              ),
            }
          : c
      )
    )
  }

  const handleTestAgain = async (id: string) => {
    const conn = userConnections.find((c) => c.id === id)
    if (!conn) {
      return
    }
    setUserConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "unknown" } : c))
    )
    const result = await mockTestConnection(conn.url)
    setUserConnections((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: result.ok ? "ok" : "error" } : c
      )
    )
  }

  const handleRefreshDiscovery = async (id: string) => {
    const conn = userConnections.find((c) => c.id === id)
    if (!conn) {
      return
    }
    const result = await mockTestConnection(conn.url)
    if (result.ok && result.tools) {
      setUserConnections((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: "ok",
                tools: (result.tools ?? []).map((tool) =>
                  Object.assign({}, tool, { enabled: true })
                ),
              }
            : c
        )
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) {
      return
    }
    try {
      await deleteConnectionFromApi(id)
      const { platform, user } = await fetchConnectionsFromApi()
      setPlatformConnections(platform)
      setUserConnections(user)
      if (detailsId === id) {
        setDetailsId(null)
      }
    } catch (err) {
      console.error("Failed to delete connection:", err)
      alert(err instanceof Error ? err.message : "Failed to delete connection")
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
        <span>🔌</span> {t.title}
      </h3>

      {/* Banner */}
      <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="mb-1.5 flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-amber-500">⚠️</span>
          <p className="text-xs font-semibold text-amber-800">
            {t.bannerTitle}
          </p>
        </div>
        <ul className="list-disc space-y-1 pl-6 text-xs/relaxed text-amber-700">
          {t.bannerBullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>

      {/* Platform Connections */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              {t.platformTitle}
            </p>
            <p className="text-xs text-slate-400">{t.platformDesc}</p>
          </div>
        </div>
        <div className="space-y-2">
          {isLoading && <p className="py-2 text-xs text-slate-400">Loading…</p>}
          {!isLoading && loadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-xs text-red-600">{loadError}</p>
              <button
                type="button"
                onClick={async () => {
                  setIsLoading(true)
                  setLoadError(null)
                  try {
                    const { platform, user } = await fetchConnectionsFromApi()
                    setPlatformConnections(platform)
                    setUserConnections(user)
                  } catch (err: unknown) {
                    setLoadError(
                      err instanceof Error
                        ? err.message
                        : "Failed to load integrations"
                    )
                  } finally {
                    setIsLoading(false)
                  }
                }}
                className="mt-1 text-xs font-medium text-red-500 hover:text-red-700"
              >
                Retry
              </button>
            </div>
          )}
          {!isLoading &&
            !loadError &&
            platformConnections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  {statusDot(conn.status)}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {conn.name}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {conn.url}
                    </p>
                  </div>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <span className="text-xs text-slate-500">
                    {conn.toolCount} {conn.toolCount === 1 ? t.tool : t.tools}
                  </span>
                  <p className="text-xs font-medium text-emerald-600">
                    {statusLabel(conn.status)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* My Connections */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">{t.myTitle}</p>
            <p className="text-xs text-slate-400">{t.myDesc}</p>
          </div>
          {!showAddForm && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="text-illini-orange hover:text-illini-blue text-xs font-medium transition-colors"
            >
              {t.add}
            </button>
          )}
        </div>

        {/* Add Connection Form */}
        {showAddForm && (
          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              {t.addTitle}
            </p>

            {/* Display Name */}
            <div className="mb-2.5">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {t.displayName}
              </label>
              <input
                aria-label="Input field"
                type="text"
                value={addName}
                onChange={(e) => {
                  setAddName(e.target.value)
                }}
                placeholder={t.displayNamePlaceholder}
                className="focus:border-illini-orange focus:ring-illini-orange/30 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-300 focus:ring-2 focus:outline-none"
              />
            </div>

            {/* Endpoint URL */}
            <div className="mb-2.5">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {t.endpointUrl}
              </label>
              <input
                aria-label="Input field"
                type="url"
                value={addUrl}
                onChange={(e) => {
                  setAddUrl(e.target.value)
                  setTestResult({ state: "idle" })
                }}
                placeholder={t.endpointUrlPlaceholder}
                className="focus:border-illini-orange focus:ring-illini-orange/30 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-300 focus:ring-2 focus:outline-none"
              />
            </div>

            {/* Description */}
            <div className="mb-2.5">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {t.description}
              </label>
              <input
                aria-label="Input field"
                type="text"
                value={addDesc}
                onChange={(e) => {
                  setAddDesc(e.target.value)
                }}
                placeholder={t.descriptionPlaceholder}
                className="focus:border-illini-orange focus:ring-illini-orange/30 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-300 focus:ring-2 focus:outline-none"
              />
            </div>

            {/* Transport (read-only) */}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {t.transport}
              </label>
              <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm text-slate-400">
                {t.transportValue}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {t.transportHint}
              </p>
            </div>

            {/* Test result message */}
            {testResult.state === "success" && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <span className="mt-0.5 text-emerald-500">✓</span>
                <div>
                  <p className="text-xs font-medium text-emerald-700">
                    {t.testSuccess}
                  </p>
                  <p className="text-xs text-emerald-600">
                    {t.testSuccessDetailPrefix}: {t.testSuccessOutcome};{" "}
                    {testResult.tools.length}{" "}
                    {testResult.tools.length === 1 ? t.tool : t.tools}{" "}
                    {t.discoveredLabel}.
                  </p>
                  <p className="text-xs text-emerald-600">
                    {testResult.tools.length}{" "}
                    {testResult.tools.length === 1 ? t.tool : t.tools}:{" "}
                    {testResult.tools.map((tool) => tool.name).join(", ")}
                  </p>
                </div>
              </div>
            )}
            {testResult.state === "failure" && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <span className="mt-0.5 text-red-500">✕</span>
                <div>
                  <p className="text-xs font-medium text-red-700">
                    {t.testFailure}
                  </p>
                  <p className="text-xs font-medium text-red-600">
                    {t.failureReasonLabel}: <code>{testResult.reason}</code>
                  </p>
                  <p className="text-xs text-red-600">
                    {getFailureReasonDescription(testResult.reason)}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelAdd}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-200"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleTest}
                disabled={!addUrl.trim() || testResult.state === "loading"}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-40"
              >
                {testResult.state === "loading" ? t.testing : t.testConnection}
              </button>
              {testResult.state === "success" && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!addName.trim() || isSaving}
                  className="bg-illini-orange hover:bg-illini-blue rounded-full px-3 py-1 text-xs font-medium text-white transition-colors disabled:opacity-40"
                >
                  {isSaving ? t.saving : t.saveConnection}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && userConnections.length === 0 && !showAddForm && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
            <p className="text-sm text-slate-500">{t.emptyState}</p>
            <p className="mt-0.5 text-xs text-slate-400">{t.emptyHint}</p>
          </div>
        )}

        {/* User connection cards */}
        {userConnections.length > 0 && (
          <div className="space-y-2">
            {userConnections.map((conn) => (
              <div key={conn.id}>
                {/* Card row */}
                <button
                  type="button"
                  onClick={() => {
                    setDetailsId(detailsId === conn.id ? null : conn.id)
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {statusDot(conn.status, !conn.is_enabled)}
                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm font-medium ${conn.is_enabled ? "text-slate-800" : "text-slate-400"}`}
                      >
                        {conn.name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {conn.url}
                      </p>
                    </div>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <span className="text-xs text-slate-500">
                        {toolCount(conn)}{" "}
                        {toolCount(conn) === 1 ? t.tool : t.tools}
                      </span>
                      <p
                        className={`text-xs font-medium ${conn.is_enabled ? "text-emerald-600" : "text-slate-400"}`}
                      >
                        {conn.is_enabled
                          ? statusLabel(conn.status)
                          : t.disabled}
                      </p>
                    </div>
                    <span className="text-slate-300">
                      {detailsId === conn.id ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Details panel (inline expansion) */}
                {detailsId === conn.id && (
                  <div className="mt-1 rounded-lg border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        {t.detailsTitle}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setDetailsId(null)
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        {t.close}
                      </button>
                    </div>

                    {/* Meta */}
                    <div className="mb-3 space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {t.connectionName}
                        </span>
                        <span className="text-xs font-medium text-slate-700">
                          {conn.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {t.connectionUrl}
                        </span>
                        <span className="max-w-[180px] truncate text-xs text-slate-500">
                          {conn.url}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {t.connectionStatus}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          {statusDot(conn.status)}
                          {statusLabel(conn.status)}
                        </span>
                      </div>
                    </div>

                    {/* Enable/disable toggle */}
                    <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <span className="text-xs font-medium text-slate-600">
                        {t.enableConnection}
                      </span>
                      <button
                        type="button"
                        aria-label="Toggle connection"
                        onClick={() => {
                          handleToggleConnection(conn.id)
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${conn.is_enabled ? "bg-illini-orange" : "bg-slate-200"}`}
                        role="switch"
                        aria-checked={conn.is_enabled}
                      >
                        <span
                          className={`inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform ${conn.is_enabled ? "translate-x-4" : "translate-x-1"}`}
                        />
                      </button>
                    </div>

                    {/* Discovered tools */}
                    <div className="mb-3">
                      <p className="mb-1.5 text-xs font-semibold text-slate-500">
                        {t.discoveredTools}
                      </p>
                      <div className="space-y-1.5">
                        {conn.tools.map((tool) => (
                          <ToolRowItem
                            key={tool.name}
                            tool={tool}
                            onToggle={() => {
                              handleToggleTool(conn.id, tool.name)
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleTestAgain(conn.id)}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-200"
                      >
                        {t.testAgain}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRefreshDiscovery(conn.id)}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-200"
                      >
                        {t.refreshDiscovery}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(conn.id)}
                        className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-100"
                      >
                        {t.deleteConnection}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
