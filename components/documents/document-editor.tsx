"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Save,
  MoreHorizontal,
  Target,
  TrendingUp,
  Zap,
  FileText,
  Settings,
  Download,
  Share,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { calculateReadabilityScore } from "@/lib/utils"
import { generateUntitledName } from "@/lib/document-utils"
import type { Document } from "@/lib/types"

interface DocumentEditorProps {
  document?: Document | null
  isNewDocument?: boolean
}

export function DocumentEditor({ document, isNewDocument = false }: DocumentEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize title and content
  useEffect(() => {
    const initializeDocument = async () => {
      if (document && !isNewDocument) {
        // Existing document
        setTitle(document.title)
        setContent(document.content)
        setCurrentDocumentId(document.id)
        setHasUnsavedChanges(false)
        setIsInitialized(true)
      } else if (isNewDocument) {
        // New document - generate untitled name
        try {
          const response = await fetch("/api/documents")
          if (response.ok) {
            const { documents } = await response.json()
            const generatedTitle = generateUntitledName(documents)
            setTitle(generatedTitle)
          } else {
            setTitle("Untitled")
          }
        } catch (error) {
          console.error("Error fetching documents for title generation:", error)
          setTitle("Untitled")
        }
        setContent("")
        setCurrentDocumentId(null)
        setHasUnsavedChanges(false)
        setIsInitialized(true)
      }
    }

    initializeDocument()
  }, [document, isNewDocument])

  useEffect(() => {
    if (!isInitialized) return

    const words = content.split(/\s+/).filter((word) => word.length > 0).length
    setWordCount(words)
    setCharCount(content.length)

    // Mark as having unsaved changes if there's content or title changes
    if (content.trim() || (title.trim() && title !== "Untitled")) {
      setHasUnsavedChanges(true)
    }

    // Auto-save after 2 seconds of inactivity, but only if there's meaningful content
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      // Only auto-save if we have both title and content, and there are unsaved changes
      if (shouldAutoSave()) {
        handleAutoSave()
      }
    }, 2000)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [content, title, isInitialized])

  const shouldAutoSave = (): boolean => {
    // Don't auto-save if no unsaved changes
    if (!hasUnsavedChanges) return false

    // Don't auto-save if both title and content are empty
    if (!title.trim() && !content.trim()) return false

    // For new documents, require some content before saving
    if (!currentDocumentId && !content.trim()) return false

    // For existing documents, save if either title or content has meaningful content
    return title.trim().length > 0 && (content.trim().length > 0 || currentDocumentId)
  }

  const handleAutoSave = async () => {
    if (!shouldAutoSave()) return

    setIsAutoSaving(true)
    setError(null)

    try {
      const url = currentDocumentId ? `/api/documents/${currentDocumentId}` : "/api/documents"
      const method = currentDocumentId ? "PUT" : "POST"

      const titleToSave = title.trim() || "Untitled"
      const contentToSave = content.trim()

      console.log("Auto-saving document:", {
        url,
        method,
        title: titleToSave,
        contentLength: contentToSave.length,
        hasContent: contentToSave.length > 0,
      })

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: titleToSave,
          content: contentToSave,
        }),
      })

      const responseData = await response.json()

      if (response.ok) {
        setLastSaved(new Date())
        setHasUnsavedChanges(false)

        // If this was a new document, update the URL and document ID
        if (!currentDocumentId && responseData.document) {
          setCurrentDocumentId(responseData.document.id)
          router.replace(`/documents/${responseData.document.id}`)
        }
      } else {
        throw new Error(responseData.message || responseData.error || "Failed to save document")
      }
    } catch (error) {
      console.error("Auto-save failed:", error)
      setError(error instanceof Error ? error.message : "Failed to save document")
    } finally {
      setIsAutoSaving(false)
    }
  }

  const handleManualSave = async () => {
    // For manual save, we're more lenient - save even with just a title
    if (!title.trim() && !content.trim()) {
      setError("Please add a title or content before saving")
      return
    }

    setHasUnsavedChanges(true) // Force save
    await handleAutoSave()
  }

  const readabilityScore = calculateReadabilityScore(content)
  const dailyGoal = 500 // This could come from user settings
  const goalProgress = Math.min(100, (wordCount / dailyGoal) * 100)

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />
          <span>Initializing document...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/documents")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-none bg-transparent text-lg font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
              placeholder="Document title"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isAutoSaving ? (
              <>
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                Saving...
              </>
            ) : lastSaved && !hasUnsavedChanges ? (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Saved {lastSaved.toLocaleTimeString()}
              </>
            ) : hasUnsavedChanges ? (
              <>
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                Unsaved changes
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                {isNewDocument ? "New document" : "No changes"}
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={isAutoSaving || (!title.trim() && !content.trim())}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Document Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="p-4 border-b">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="border-b">
            <Tabs defaultValue="goals" className="w-full">
              <div className="flex items-center justify-between px-6 py-2">
                <TabsList className="grid w-auto grid-cols-3">
                  <TabsTrigger value="goals" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Goals
                  </TabsTrigger>
                  <TabsTrigger value="score" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Overall score
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    AI Assistant
                  </TabsTrigger>
                </TabsList>

                <div className="text-sm text-muted-foreground">{wordCount} words</div>
              </div>
            </Tabs>
          </div>

          {/* Writing Area */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type or paste (⌘+V) your text here or upload a document."
                className="min-h-[600px] border-none resize-none text-base leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 p-0 bg-transparent"
              />

              {content.length === 0 && (
                <div className="absolute bottom-20 right-20 text-center space-y-2">
                  <div className="text-6xl">🖋️</div>
                  <div className="space-y-1">
                    <p className="font-medium text-lg">The first word is the hardest.</p>
                    <p className="text-muted-foreground">Start typing to begin your document.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l bg-muted/30 p-4 space-y-4 overflow-auto">
          {/* Writing Goals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Daily Goal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{wordCount}</span>
                <Badge variant="outline">{dailyGoal - wordCount} left</Badge>
              </div>
              <Progress value={goalProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {goalProgress >= 100 ? "Goal achieved! 🎉" : `${Math.round(goalProgress)}% of daily goal`}
              </p>
            </CardContent>
          </Card>

          {/* Readability Score */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Readability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{Math.round(readabilityScore.score)}</span>
                <Badge variant="outline">{readabilityScore.level}</Badge>
              </div>
              {readabilityScore.suggestions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Suggestions:</p>
                  {readabilityScore.suggestions.slice(0, 2).map((suggestion, index) => (
                    <p key={index} className="text-xs text-muted-foreground">
                      • {suggestion}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Document Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Words:</span>
                <span className="font-medium">{wordCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Characters:</span>
                <span className="font-medium">{charCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paragraphs:</span>
                <span className="font-medium">{content.split("\n\n").filter((p) => p.trim()).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reading time:</span>
                <span className="font-medium">{Math.ceil(wordCount / 200)} min</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Writing Assistant */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                <Zap className="h-4 w-4 mr-2" />
                Improve Writing
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                <TrendingUp className="h-4 w-4 mr-2" />
                Check Tone
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                <Target className="h-4 w-4 mr-2" />
                Generate Ideas
              </Button>
              <p className="text-xs text-muted-foreground mt-2">AI features coming soon!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
