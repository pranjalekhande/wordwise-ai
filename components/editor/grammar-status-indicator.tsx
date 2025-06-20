"use client"

import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface GrammarStatusIndicatorProps {
  issueCount: number
  isChecking?: boolean
  size?: "sm" | "md"
  showCount?: boolean
}

export function GrammarStatusIndicator({ 
  issueCount, 
  isChecking = false, 
  size = "sm",
  showCount = false 
}: GrammarStatusIndicatorProps) {
  if (isChecking) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} animate-spin text-blue-500`} />
        {showCount && <span className="text-xs text-muted-foreground">Checking...</span>}
      </div>
    )
  }

  if (issueCount === 0) {
    return (
      <div className="flex items-center gap-1">
        <CheckCircle2 className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} text-green-500`} />
        {showCount && <span className="text-xs text-green-600">Clean</span>}
      </div>
    )
  }

  const severity = issueCount >= 3 ? "high" : issueCount >= 1 ? "medium" : "low"
  const badgeVariant = severity === "high" ? "destructive" : severity === "medium" ? "secondary" : "outline"

  return (
    <div className="flex items-center gap-1">
      <AlertCircle className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} text-orange-500`} />
      {showCount && (
        <Badge variant={badgeVariant} className="text-xs px-1 py-0 h-4">
          {issueCount}
        </Badge>
      )}
    </div>
  )
} 