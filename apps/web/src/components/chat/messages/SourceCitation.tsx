import type { ReactNode } from "react"

import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationSource,
  InlineCitationText,
} from "@/components/ai-elements/inline-citation"

import type { MessageSource } from "../../../types"
import { hostnameOf } from "./sourceUtils"

interface SourceCitationProps {
  source: MessageSource
  /** Zero-based position in the reply's source list; shown plus one. */
  index: number
  /** The link text the model wrote, kept in the sentence before the marker. */
  label?: ReactNode
}

/**
 * A numbered citation in place of a link to one of the reply's sources.
 * Hovering shows the page title, site, and excerpt. On touch screens, where
 * hover cards do not open, tapping the number opens the page instead.
 */
export const SourceCitation = ({ source, index, label }: SourceCitationProps) => (
  <InlineCitation>
    {label && <InlineCitationText className="rounded-sm">{label}</InlineCitationText>}
    <InlineCitationCard>
      <InlineCitationCardTrigger
        sources={[source.url]}
        asChild
        className="ml-0.5 h-4 min-w-4 justify-center rounded-full bg-slate-100 px-1 align-[0.15em] text-[10px] leading-none font-medium text-slate-500 tabular-nums no-underline hover:bg-slate-200 hover:text-slate-800"
      >
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          {index + 1}
        </a>
      </InlineCitationCardTrigger>
      <InlineCitationCardBody className="w-72">
        <InlineCitationSource
          title={source.title}
          url={hostnameOf(source.url)}
          description={source.snippet}
          className="p-3"
        />
      </InlineCitationCardBody>
    </InlineCitationCard>
  </InlineCitation>
)
