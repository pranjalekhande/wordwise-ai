"use client"

import React, { useState, useEffect } from "react"
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
  
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    // Add small delay to ensure everything is properly hydrated
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Parse content for display (safe JSX rendering)
  const parseContentToJSX = (text: string) => {
    if (!text) return null

    try {
      const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|#\w+|@\w+|\n)/g)
      
      return parts.map((part, index) => {
        // Bold text **text**
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>
        }
        // Italic text *text*
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return <em key={index}>{part.slice(1, -1)}</em>
        }
        // Hashtags #hashtag
        if (part.startsWith('#')) {
          return <span key={index} className="text-blue-600 font-medium">{part}</span>
        }
        // Mentions @username
        if (part.startsWith('@')) {
          return <span key={index} className="text-blue-600 font-medium">{part}</span>
        }
        // Line breaks
        if (part === '\n') {
          return <br key={index} />
        }
        // Regular text
        return <span key={index}>{part}</span>
      })
    } catch (error) {
      console.error('Error parsing content:', error)
      return <span>{text}</span>
    }
  }

  // Show loading state initially
  if (!mounted || isLoading) {
    return (
      <div className={`flex flex-col items-center space-y-4 ${className}`}>
        <div className="text-sm text-muted-foreground font-medium">
          Instagram Preview
        </div>
        <Card className="relative w-80 h-80 bg-white border-2 border-gray-200 shadow-lg overflow-hidden">
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-gray-400 text-sm">Loading preview...</div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-white border-t border-gray-100 flex items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6 border-2 border-gray-300 rounded-full bg-gray-50" />
              <div className="w-6 h-6 border-2 border-gray-300 rounded bg-gray-50" />
              <div className="w-6 h-6 border-2 border-gray-300 rounded bg-gray-50" />
            </div>
            <div className="w-6 h-6 border-2 border-gray-300 rounded bg-gray-50" />
          </div>
        </Card>
        <div className="text-xs text-muted-foreground">
          0 characters
        </div>
      </div>
    )
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
              {Array.from({ length: Math.min(totalSlides, 10) }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
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
          <div className="text-center w-full max-w-full">
            {content?.trim() ? (
              <div
                className="text-gray-900 leading-relaxed text-base break-words"
                style={{
                  lineHeight: '1.4',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                }}
              >
                {parseContentToJSX(content)}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">
                Your content will appear here...
              </div>
            )}
          </div>
        </div>
        
        {/* Instagram-like bottom bar */}
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
        {content?.length || 0} characters
      </div>
    </div>
  )
} 