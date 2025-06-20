"use client"

import { Badge } from "@/components/ui/badge"
import { Newspaper, BookOpen, ShoppingBag } from "lucide-react"

interface TemplateTypeBadgeProps {
  templateType: "NEWS" | "STORY" | "PRODUCT"
  showIcon?: boolean
  size?: "sm" | "md"
}

export function TemplateTypeBadge({ 
  templateType, 
  showIcon = true, 
  size = "sm" 
}: TemplateTypeBadgeProps) {
  const getTemplateConfig = () => {
    switch (templateType) {
      case "NEWS":
        return {
          label: "News",
          icon: Newspaper,
          variant: "secondary" as const,
          className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
        }
      case "STORY":
        return {
          label: "Story", 
          icon: BookOpen,
          variant: "secondary" as const,
          className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
        }
      case "PRODUCT":
        return {
          label: "Product",
          icon: ShoppingBag,
          variant: "secondary" as const,
          className: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
        }
      default:
        return {
          label: "Story",
          icon: BookOpen,
          variant: "outline" as const,
          className: ""
        }
    }
  }

  const config = getTemplateConfig()
  const Icon = config.icon
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4"
  const textSize = size === "sm" ? "text-xs" : "text-sm"

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${textSize} px-2 py-1 font-medium flex items-center gap-1`}
    >
      {showIcon && <Icon className={iconSize} />}
      {config.label}
    </Badge>
  )
} 