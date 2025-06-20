"use client"

import React from "react"
import { Card } from "@/components/ui/card"

interface InstagramSquarePreviewProps {
  content: string
  slideNumber?: number
  totalSlides?: number
  className?: string
}

export function InstagramSquarePreview({
  content,
  slideNumber = 1,
  totalSlides = 1,
  className = ""
}: InstagramSquarePreviewProps) {
  
  // Parse markdown-like syntax for preview
  const parseContent = (text: string) => {
    // Basic markdown parsing for preview
    let parsed = text
      // Bold text **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text *text* -> <em>text</em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Hashtags #hashtag -> styled hashtag
      .replace(/#(\w+)/g, '<span class="text-blue-600 font-medium">#$1</span>')
      // Mentions @username -> styled mention
      .replace(/@(\w+)/g, '<span class="text-blue-600 font-medium">@$1</span>')
      // Line breaks
      .replace(/\n/g, '<br />')
    
    return parsed
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Preview Label */}
      <div className="text-sm text-muted-foreground font-medium">
        Instagram Preview
      </div>
      
      {/* Square Container */}
      <Card className="relative w-80 h-80 bg-white border-2 border-gray-200 shadow-lg overflow-hidden">
        {/* Slide Indicator */}
        {totalSlides > 1 && (
          <div className="absolute top-3 right-3 z-10">
            <div className="flex space-x-1">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === slideNumber - 1
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Content Area */}
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center w-full">
            {content.trim() ? (
              <div
                className="text-gray-900 leading-relaxed"
                style={{
                  fontSize: '16px',
                  lineHeight: '1.4',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  wordBreak: 'break-word',
                  hyphens: 'auto'
                }}
                dangerouslySetInnerHTML={{
                  __html: parseContent(content)
                }}
              />
            ) : (
              <div className="text-gray-400 text-sm">
                Your content will appear here...
              </div>
            )}
          </div>
        </div>
        
        {/* Instagram-like bottom bar (visual only) */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-white border-t border-gray-100 flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="w-6 h-6 border-2 border-gray-300 rounded-full bg-gray-50" />
            <div className="w-6 h-6 border-2 border-gray-300 rounded bg-gray-50" />
            <div className="w-6 h-6 border-2 border-gray-300 rounded bg-gray-50" />
          </div>
          <div className="w-6 h-6 border-2 border-gray-300 rounded bg-gray-50" />
        </div>
      </Card>
      
      {/* Character Count */}
      <div className="text-xs text-muted-foreground">
        {content.length} characters
      </div>
    </div>
  )
} 