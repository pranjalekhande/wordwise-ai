"use client"

import React from "react"
import type { GrammarIssue } from "@/lib/types"

interface GrammarHighlightProps {
  text: string
  issues: GrammarIssue[]
  onApplySuggestion: (issueId: string, suggestion: string) => void
  onDismissIssue: (issueId: string) => void
  className?: string
}

const getSeverityHighlight = (severity: GrammarIssue["severity"]) => {
  switch (severity) {
    case "high":
      return "border-b-2 border-red-500"
    case "medium":
      return "border-b-2 border-orange-400"
    case "low":
      return "border-b-1 border-blue-400"
    default:
      return "border-b-2 border-red-500"
  }
}

export function GrammarHighlight({
  text,
  issues,
  onApplySuggestion,
  onDismissIssue,
  className = ""
}: GrammarHighlightProps) {
  // Sort issues by start position to handle overlapping correctly
  const sortedIssues = [...issues].sort((a, b) => a.start - b.start)

  const renderHighlightedText = () => {
    if (sortedIssues.length === 0) {
      return <span className="whitespace-pre-wrap">{text}</span>
    }

    const elements: React.ReactElement[] = []
    let lastIndex = 0

    sortedIssues.forEach((issue, index) => {
      // Add text before the issue
      if (issue.start > lastIndex) {
        elements.push(
          <span key={`text-${index}`} className="whitespace-pre-wrap">
            {text.substring(lastIndex, issue.start)}
          </span>
        )
      }

      // Add the highlighted issue - simple underline only
      elements.push(
        <span
          key={issue.id}
          className={`${getSeverityHighlight(issue.severity)} whitespace-pre-wrap`}
          title={`${issue.type}: ${issue.message}`}
        >
          {text.substring(issue.start, issue.end)}
        </span>
      )

      lastIndex = Math.max(lastIndex, issue.end)
    })

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end" className="whitespace-pre-wrap">
          {text.substring(lastIndex)}
        </span>
      )
    }

    return <>{elements}</>
  }

  return (
    <div className={`${className}`}>
      <div 
        className="min-h-[600px] text-base leading-relaxed whitespace-pre-wrap"
        style={{
          fontFamily: 'inherit',
          fontSize: '1rem',
          lineHeight: '1.625',
          padding: 0,
          margin: 0,
          color: 'transparent',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {renderHighlightedText()}
      </div>
    </div>
  )
} 