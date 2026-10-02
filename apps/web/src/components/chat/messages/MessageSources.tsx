import { ChevronDown } from "lucide-react"

import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources"

import type { MessageSource } from "../../../types"
import { hostnameOf, siteColor, siteInitial } from "./sourceUtils"

interface MessageSourcesProps {
  sources: readonly MessageSource[]
  /** e.g. "3 个来源". */
  label: string
}

const SiteBadge = ({ url, className = "" }: { url: string; className?: string }) => (
  <span
    aria-hidden="true"
    className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white ring-2 ring-white ${siteColor(url)} ${className}`}
  >
    {siteInitial(url)}
  </span>
)

/**
 * The "N sources" pill above a reply: up to three overlapping site badges and
 * a count. Opening it lists every source with the number its citations use.
 */
export const MessageSources = ({ sources, label }: MessageSourcesProps) => (
  <Sources className="not-prose mb-2 text-xs">
    <SourcesTrigger
      count={sources.length}
      className="group/sources inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pr-2.5 pl-1.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
    >
      <span className="flex -space-x-1">
        {sources.slice(0, 3).map((source) => (
          <SiteBadge key={source.id} url={source.url} />
        ))}
      </span>
      <span>{label}</span>
      <ChevronDown className="size-3.5 transition-transform group-data-[state=open]/sources:rotate-180" />
    </SourcesTrigger>
    <SourcesContent className="mt-2 w-full max-w-md gap-0 rounded-xl border border-slate-200 bg-white p-1">
      {sources.map((source, index) => (
        <Source
          key={source.id}
          href={source.url}
          title={source.title}
          className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-slate-700 transition-colors hover:bg-slate-50"
        >
          <span className="flex size-4 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-medium text-slate-500 tabular-nums">
            {index + 1}
          </span>
          <SiteBadge url={source.url} className="ring-0" />
          <span className="min-w-0 flex-1 truncate">{source.title}</span>
          <span className="shrink-0 text-xs text-slate-400">{hostnameOf(source.url)}</span>
        </Source>
      ))}
    </SourcesContent>
  </Sources>
)
