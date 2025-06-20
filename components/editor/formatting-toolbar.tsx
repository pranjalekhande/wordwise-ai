"use client"

import React from "react"
import { Bold, Italic, Hash, AtSign, Smile, AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FormattingToolbarProps {
  onFormatText: (format: string, value?: string) => void
  className?: string
}

export function FormattingToolbar({ onFormatText, className = "" }: FormattingToolbarProps) {
  
  const handleFormat = (format: string, value?: string) => {
    onFormatText(format, value)
  }

  const formatButtons = [
    {
      icon: Bold,
      label: "Bold",
      shortcut: "⌘B",
      action: () => handleFormat("bold"),
      format: "bold"
    },
    {
      icon: Italic,
      label: "Italic", 
      shortcut: "⌘I",
      action: () => handleFormat("italic"),
      format: "italic"
    },
    {
      icon: Hash,
      label: "Add Hashtag",
      shortcut: "#",
      action: () => handleFormat("hashtag"),
      format: "hashtag"
    },
    {
      icon: AtSign,
      label: "Add Mention",
      shortcut: "@",
      action: () => handleFormat("mention"),
      format: "mention"
    },
    {
      icon: Smile,
      label: "Add Emoji",
      shortcut: "😊",
      action: () => handleFormat("emoji"),
      format: "emoji"
    }
  ]

  const quickInserts = [
    { text: "💡", label: "Idea", action: () => handleFormat("insert", "💡 ") },
    { text: "🔥", label: "Fire", action: () => handleFormat("insert", "🔥 ") },
    { text: "✨", label: "Sparkles", action: () => handleFormat("insert", "✨ ") },
    { text: "🚀", label: "Rocket", action: () => handleFormat("insert", "🚀 ") },
    { text: "💯", label: "100", action: () => handleFormat("insert", "💯 ") }
  ]

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg border ${className}`}>
        {/* Text Formatting Group */}
        <div className="flex items-center gap-1">
          {formatButtons.map((button) => {
            const IconComponent = button.icon
            return (
              <Tooltip key={button.format}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={button.action}
                    className="h-8 w-8 p-0 hover:bg-white hover:shadow-sm"
                  >
                    <IconComponent className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    {button.label}
                    {button.shortcut && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {button.shortcut}
                      </span>
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Quick Emoji Group */}
        <div className="flex items-center gap-1">
          {quickInserts.map((insert) => (
            <Tooltip key={insert.text}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insert.action}
                  className="h-8 w-8 p-0 hover:bg-white hover:shadow-sm text-base"
                >
                  {insert.text}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{insert.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
} 