/**
 * @file ./src/components/profile/IntegrationsSection.tsx
 * @description Profile feature UI — MCP integrations shell (Task 7, phase 1)
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from "react";
import { Language } from "../../types";

interface PlatformConnection {
  id: string;
  name: string;
  status: "ok" | "error" | "unknown";
  toolCount: number;
  url: string;
}

interface UserConnection {
  id: string;
  name: string;
  status: "ok" | "error" | "unknown";
  toolCount: number;
  url: string;
}

const PLATFORM_CONNECTIONS: PlatformConnection[] = [
  {
    id: "uiuc-campus-tools",
    name: "UIUC Campus Tools",
    status: "ok",
    toolCount: 3,
    url: "https://mcp.illinois.edu/campus-tools",
  },
];

const USER_CONNECTIONS: UserConnection[] = [];

interface IntegrationsSectionProps {
  language: Language;
}

export const IntegrationsSection: React.FC<IntegrationsSectionProps> = ({
  language,
}) => {
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
      emptyHint: "Add a Streamable HTTP MCP server to get started.",
      bannerText:
        "Phase 1 supports Streamable HTTP MCP servers only. Credential-protected third-party endpoints are not supported.",
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
      emptyHint: "添加一个 Streamable HTTP MCP 服务器以开始使用。",
      bannerText:
        "第一阶段仅支持 Streamable HTTP MCP 服务器。不支持需要凭证的第三方端点。",
    },
  }[language];

  const statusDot = (status: PlatformConnection["status"]) => {
    if (status === "ok")
      return <span className="size-2 rounded-full bg-emerald-400 inline-block" />;
    if (status === "error")
      return <span className="size-2 rounded-full bg-red-400 inline-block" />;
    return <span className="size-2 rounded-full bg-slate-300 inline-block" />;
  };

  const statusLabel = (status: PlatformConnection["status"]) => {
    if (status === "ok") return t.statusOk;
    if (status === "error") return t.statusError;
    return t.statusUnknown;
  };

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
        <span>🔌</span> {t.title}
      </h3>

      <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
        <span className="mt-0.5 text-amber-500 shrink-0">⚠️</span>
        <p className="text-xs text-amber-700 leading-relaxed">{t.bannerText}</p>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">{t.platformTitle}</p>
            <p className="text-xs text-slate-400">{t.platformDesc}</p>
          </div>
        </div>

        <div className="space-y-2">
          {PLATFORM_CONNECTIONS.map((conn) => (
            <div
              key={conn.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {statusDot(conn.status)}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{conn.name}</p>
                  <p className="text-xs text-slate-400 truncate">{conn.url}</p>
                </div>
              </div>
              <div className="ml-3 shrink-0 text-right">
                <span className="text-xs text-slate-500">
                  {conn.toolCount} {conn.toolCount === 1 ? t.tool : t.tools}
                </span>
                <p className="text-xs text-emerald-600 font-medium">{statusLabel(conn.status)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">{t.myTitle}</p>
            <p className="text-xs text-slate-400">{t.myDesc}</p>
          </div>
          <button className="text-xs font-medium text-illini-orange transition-colors hover:text-illini-blue">
            {t.add}
          </button>
        </div>

        {USER_CONNECTIONS.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
            <p className="text-sm text-slate-500">{t.emptyState}</p>
            <p className="mt-0.5 text-xs text-slate-400">{t.emptyHint}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {USER_CONNECTIONS.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {statusDot(conn.status)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{conn.name}</p>
                    <p className="text-xs text-slate-400 truncate">{conn.url}</p>
                  </div>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <span className="text-xs text-slate-500">
                    {conn.toolCount} {conn.toolCount === 1 ? t.tool : t.tools}
                  </span>
                  <p className="text-xs font-medium" style={{ color: conn.status === "ok" ? "#10b981" : conn.status === "error" ? "#f87171" : "#94a3b8" }}>
                    {statusLabel(conn.status)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
