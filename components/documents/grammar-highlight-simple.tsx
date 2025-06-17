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

const getSeverityHighlight = (issue: GrammarIssue) => {
  const { severity, type } = issue
  
  // Style suggestions get background highlighting
  if (type === "style") {
    switch (severity) {
      case "high":
        return "bg-blue-200/80 border-b-1 border-blue-500 rounded-sm px-0.5"
      case "medium":
        return "bg-blue-100/70 border-b-1 border-blue-400 rounded-sm px-0.5"
      case "low":
        return "bg-blue-100/50 border-b-1 border-blue-300 rounded-sm px-0.5"
      default:
        return "bg-blue-100/70 border-b-1 border-blue-400 rounded-sm px-0.5"
    }
  }
  
  // Only spelling errors get underlines
  if (type === "spelling") {
    switch (severity) {
      case "high":
        return "border-b-2 border-red-500"
      case "medium":
        return "border-b-2 border-orange-400"
      case "low":
        return "border-b-1 border-yellow-400"
      default:
        return "border-b-2 border-red-500"
    }
  }
  
  // Grammar errors - no highlighting
  return ""
}

export function GrammarHighlight({
  text,
  issues,
  onApplySuggestion,
  onDismissIssue,
  className = ""
}: GrammarHighlightProps) {
  // Filter to only spelling and style issues, sort by start position
  const relevantIssues = issues
    .filter(issue => issue.type === "spelling" || issue.type === "style")
    .sort((a, b) => a.start - b.start)

  const renderHighlightedText = () => {
    if (relevantIssues.length === 0) {
      return <span className="whitespace-pre-wrap">{text}</span>
    }

    const elements: React.ReactElement[] = []
    let lastIndex = 0

    relevantIssues.forEach((issue, index) => {
      // Add text before the issue
      if (issue.start > lastIndex) {
        elements.push(
          <span key={`text-${index}`} className="whitespace-pre-wrap">
            {text.substring(lastIndex, issue.start)}
          </span>
        )
      }

      // Add the highlighted issue - spelling gets underlines, style gets background
      elements.push(
        <span
          key={issue.id}
          className={`${getSeverityHighlight(issue)} whitespace-pre-wrap`}
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
        className="min-h-[600px] text-base leading-relaxed whitespace-pre-wrap border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 bg-transparent"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Menlo, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: '1rem',
          lineHeight: '1.625',
          padding: '0',
          margin: '0',
          border: 'none',
          outline: 'none',
          boxSizing: 'border-box',
          color: 'transparent',
          userSelect: 'none',
          pointerEvents: 'none',
          width: '100%',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          textRendering: 'optimizeSpeed',
          fontVariantLigatures: 'none',
          fontKerning: 'none',
          letterSpacing: '0',
          wordSpacing: '0'
        }}
      >
        {renderHighlightedText()}
      </div>
    </div>
  )
} 