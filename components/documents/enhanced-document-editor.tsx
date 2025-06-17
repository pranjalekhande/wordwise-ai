"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { calculateReadabilityScore } from "@/lib/utils"
import { generateUntitledName } from "@/lib/document-utils"
import { useGrammarCheck } from "@/hooks/use-grammar-check"
import { GrammarHighlight } from "@/components/documents/grammar-highlight-simple"
import type { Document } from "@/lib/types"

interface EnhancedDocumentEditorProps {
  document?: Document | null
  isNewDocument?: boolean
}

export function EnhancedDocumentEditor({ document, isNewDocument = false }: EnhancedDocumentEditorProps) {
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
  const [grammarCheckEnabled, setGrammarCheckEnabled] = useState(true)
  
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Smart auto-save state
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedContentRef = useRef<string>("")
  const lastSavedTitleRef = useRef<string>("")
  const isTypingRef = useRef<boolean>(false)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastAutoSaveTimeRef = useRef<number>(0)

  // Grammar checking hook with smart checking
  const {
    issues,
    isChecking,
    error: grammarError,
    summary,
    debouncedCheck,
    smartCheck,
    checkGrammar,
    dismissIssue,
    applySuggestion,
  } = useGrammarCheck({
    autoCheck: grammarCheckEnabled,
    debounceMs: 3000, // Longer delay for document editing
    minTextLength: 30, // Check shorter texts in document editor
    pauseDetectionMs: 1500, // Shorter pause detection for document editing
  })

  // Initialize title and content
  useEffect(() => {
    const initializeDocument = async () => {
      if (document && !isNewDocument) {
        setTitle(document.title)
        setContent(document.content)
        setCurrentDocumentId(document.id)
        setHasUnsavedChanges(false)
        // Initialize smart auto-save tracking with existing document
        lastSavedContentRef.current = document.content
        lastSavedTitleRef.current = document.title
        lastAutoSaveTimeRef.current = Date.now()
        setIsInitialized(true)
      } else if (isNewDocument) {
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
          setError("Unable to connect to database. Running in offline mode.")
        }
        setContent("")
        setCurrentDocumentId(null)
        setHasUnsavedChanges(false)
        setIsInitialized(true)
      }
    }

    initializeDocument()
  }, [document, isNewDocument])

  // Track typing activity for smart auto-save
  const trackTyping = useCallback(() => {
    isTypingRef.current = true
    
    // Clear existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Mark as not typing after pause period
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
    }, 2000) // 2 seconds to detect pause
  }, [])

  // Check if content/title changes are meaningful enough to warrant auto-save
  const shouldAutoSaveContent = useCallback((newTitle: string, newContent: string): boolean => {
    // Don't save if user is actively typing
    if (isTypingRef.current) {
      return false
    }
    
    // Don't save empty documents
    if (!newTitle.trim() && !newContent.trim()) {
      return false
    }
    
    // Don't save if no meaningful changes since last save
    const titleDiff = Math.abs(newTitle.length - lastSavedTitleRef.current.length)
    const contentDiff = Math.abs(newContent.length - lastSavedContentRef.current.length)
    const minChangeThreshold = 5 // At least 5 characters difference
    
    if (titleDiff < minChangeThreshold && contentDiff < minChangeThreshold) {
      // Check if the text is actually different (not just same length)
      if (newTitle === lastSavedTitleRef.current && newContent === lastSavedContentRef.current) {
        return false
      }
    }
    
    // Don't save too frequently (minimum 10 seconds between auto-saves)
    const timeSinceLastSave = Date.now() - lastAutoSaveTimeRef.current
    if (timeSinceLastSave < 10000) {
      return false
    }
    
    // Check for natural stopping points (end of sentence, paragraph, etc.)
    const endsWithSentence = /[.!?]\s*$/.test(newContent.trim())
    const endsWithParagraph = /\n\s*\n\s*$/.test(newContent)
    const hasMinimumContent = newContent.trim().length >= 20
    
    return (endsWithSentence || endsWithParagraph || hasMinimumContent) && 
           (titleDiff >= minChangeThreshold || contentDiff >= minChangeThreshold)
  }, [])

  // Smart auto-save function
  const smartAutoSave = useCallback((newTitle: string, newContent: string) => {
    // Track that user is typing
    trackTyping()

    // Clear existing timeouts
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
    }

    // Set up pause detection - only save after user stops typing
    pauseTimeoutRef.current = setTimeout(() => {
      if (!isTypingRef.current && shouldAutoSaveContent(newTitle, newContent)) {
                 // Additional delay before actual save to ensure user is truly done
         autoSaveTimeoutRef.current = setTimeout(() => {
           handleAutoSave() // handleAutoSave already includes shouldAutoSave check
         }, 1000) // Short additional delay after pause detection
      }
         }, 5000) // 5 seconds as requested
   }, [trackTyping, shouldAutoSaveContent])

  // Update word count (separated from auto-save logic)
  useEffect(() => {
    if (!isInitialized) return

    const words = content.split(/\s+/).filter((word) => word.length > 0).length
    setWordCount(words)
    setCharCount(content.length)

    if (content.trim() || (title.trim() && title !== "Untitled")) {
      setHasUnsavedChanges(true)
    }
  }, [content, title, isInitialized])

  // Separate effect for smart auto-save
  useEffect(() => {
    if (!isInitialized) return

    // Only trigger smart auto-save when content or title changes
    smartAutoSave(title, content)

    // Cleanup on unmount
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [content, title, isInitialized, smartAutoSave])

  // Separate effect for smart grammar checking to avoid over-triggering
  useEffect(() => {
    if (!isInitialized || !grammarCheckEnabled) return

    // Only trigger smart check when content changes
    if (content.trim()) {
      smartCheck(content)
    }
  }, [content, isInitialized, grammarCheckEnabled, smartCheck])

  const shouldAutoSave = (): boolean => {
    if (!hasUnsavedChanges) return false
    if (!title.trim() && !content.trim()) return false
    if (!currentDocumentId && !content.trim()) return false
    return title.trim().length > 0 && (content.trim().length > 0 || Boolean(currentDocumentId))
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
        
        // Update smart auto-save tracking
        lastSavedContentRef.current = contentToSave
        lastSavedTitleRef.current = titleToSave
        lastAutoSaveTimeRef.current = Date.now()

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
    if (!title.trim() && !content.trim()) {
      setError("Please add a title or content before saving")
      return
    }

    setHasUnsavedChanges(true)
    await handleAutoSave()
    
    // Update smart save tracking for manual saves too
    lastSavedContentRef.current = content.trim()
    lastSavedTitleRef.current = title.trim() || "Untitled"
    lastAutoSaveTimeRef.current = Date.now()
  }

  const handleManualGrammarCheck = () => {
    if (content.trim()) {
      // Force check regardless of smart check rules
      checkGrammar(content, true)
    }
  }

  const handleApplySuggestion = (issueId: string, suggestion: string) => {
    const newContent = applySuggestion(issueId, suggestion, content)
    setContent(newContent)
    setHasUnsavedChanges(true)
    
    // Smart check will automatically trigger for the corrected text based on intelligent rules
    // No need for forced immediate re-check as the smart system will handle it appropriately
  }

  const readabilityScore = calculateReadabilityScore(content)
  const dailyGoal = 500

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
          {/* Grammar Check Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isChecking ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking...
              </>
            ) : summary.totalIssues > 0 ? (
              <>
                <AlertCircle className="h-3 w-3 text-orange-500" />
                {summary.totalIssues} issues
              </>
            ) : content.length > 10 ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                No issues
              </>
            ) : null}
          </div>

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
      {(error || grammarError) && (
        <div className="p-4 border-b">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || grammarError}</AlertDescription>
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
                    Grammar Check
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={grammarCheckEnabled}
                      onCheckedChange={setGrammarCheckEnabled}
                      id="grammar-check"
                    />
                    <label htmlFor="grammar-check" className="text-sm">
                      Smart grammar checking
                    </label>
                  </div>
                  <div className="text-sm text-muted-foreground">{wordCount} words</div>
                </div>
              </div>

              {/* Tab Content */}
              <TabsContent value="ai" className="px-6 py-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualGrammarCheck}
                    disabled={isChecking || !content.trim()}
                  >
                    {isChecking ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Force Check
                  </Button>
                  {summary.totalIssues > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{summary.grammarIssues + summary.spellingIssues} grammar & spelling,</span>
                      <span>{summary.styleIssues} paraphrase suggestions</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Auto-checks when you pause writing
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Auto-saves after 5s pause
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Writing Area */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto relative">
              {/* Background highlights for grammar issues */}
              {grammarCheckEnabled && issues.length > 0 && (
                <div className="absolute inset-0 pointer-events-none z-0">
                  <GrammarHighlight
                    text={content}
                    issues={issues}
                    onApplySuggestion={handleApplySuggestion}
                    onDismissIssue={dismissIssue}
                    className="min-h-[600px] text-base leading-relaxed"
                  />
                </div>
              )}
              
              {/* Main textarea - always visible and functional */}
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type or paste (⌘+V) your text here or upload a document."
                className="min-h-[600px] border-none resize-none text-base leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 p-0 bg-transparent relative z-10"
              />

              {content.length === 0 && (
                <div className="absolute bottom-20 right-20 text-center space-y-2 pointer-events-none">
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
          {/* Grammar & Spelling Check */}
          {grammarCheckEnabled && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Grammar Check
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isChecking ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking grammar...
                  </div>
                ) : (() => {
                  const grammarSpellingIssues = issues.filter(issue => issue.type === "grammar" || issue.type === "spelling")
                  return grammarSpellingIssues.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Issues found:</span>
                        <span className="font-medium">{grammarSpellingIssues.length}</span>
                      </div>
                      
                      {/* Individual Issues */}
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {grammarSpellingIssues.slice(0, 5).map((issue) => (
                          <div key={issue.id} className="p-2 border rounded-sm bg-muted/30">
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-xs font-medium capitalize text-muted-foreground">
                                {issue.type}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0"
                                onClick={() => dismissIssue(issue.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              "{content.substring(issue.start, issue.end)}"
                            </p>
                            <p className="text-xs mb-2">{issue.message}</p>
                            {issue.suggestions.length > 0 && (
                              <div className="space-y-1">
                                {issue.suggestions.slice(0, 2).map((suggestion, idx) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    className="h-6 w-full text-xs justify-start"
                                    onClick={() => handleApplySuggestion(issue.id, suggestion)}
                                  >
                                    "{suggestion}"
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {grammarSpellingIssues.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{grammarSpellingIssues.length - 5} more issues
                          </p>
                        )}
                      </div>
                    </div>
                  ) : content.length > 10 ? (
                    <div className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      No grammar or spelling issues found
                    </div>
                  ) : null
                })()}
              </CardContent>
            </Card>
          )}

          {/* Consider Paraphrase (Style Issues) */}
          {grammarCheckEnabled && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Consider Paraphrase
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isChecking ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analyzing style...
                  </div>
                ) : (() => {
                  const styleIssues = issues.filter(issue => issue.type === "style")
                  return styleIssues.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Suggestions:</span>
                        <span className="font-medium">{styleIssues.length}</span>
                      </div>
                      
                      {/* Individual Style Issues */}
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {styleIssues.slice(0, 5).map((issue) => (
                          <div key={issue.id} className="p-2 border rounded-sm bg-blue-50/50 border-blue-200">
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-xs font-medium text-blue-600">
                                Style Suggestion
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0"
                                onClick={() => dismissIssue(issue.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              "{content.substring(issue.start, issue.end)}"
                            </p>
                            <p className="text-xs mb-2 text-blue-700">{issue.message}</p>
                            {issue.suggestions.length > 0 && (
                              <div className="space-y-1">
                                {issue.suggestions.slice(0, 2).map((suggestion, idx) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    className="h-6 w-full text-xs justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleApplySuggestion(issue.id, suggestion)}
                                  >
                                    "{suggestion}"
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {styleIssues.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{styleIssues.length - 5} more suggestions
                          </p>
                        )}
                      </div>
                    </div>
                  ) : content.length > 10 ? (
                    <div className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      No style suggestions
                    </div>
                  ) : null
                })()}
              </CardContent>
            </Card>
          )}

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
              <Progress value={Math.min(100, (wordCount / dailyGoal) * 100)} className="h-2" />
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
        </div>
      </div>
    </div>
  )
} 