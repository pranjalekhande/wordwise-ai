# **Phase 3.2: Enhanced Content Sources PRD**

## **Overview**
Expand InstaCarousel content input from simple text/document selection to a flexible multi-source system that supports text input, document linking, web URLs, file uploads, and hybrid content combinations.

**Current State:** Users limited to manual text input or existing document selection ❌  
**Target State:** Users can source content from multiple inputs with smart processing ✅

---

## **Core Problem**
- Users are restricted to typing text manually or selecting existing documents
- No way to import content from web articles, PDFs, or uploaded files
- Cannot combine multiple content sources for richer carousels
- **Result:** Content creation is limited and time-consuming

## **Solution**
Implement a flexible content source system with tabbed input options, smart content extraction, and hybrid source combining capabilities.

---

## **Technical Implementation**

### **Task 1: Content Source Type System**
**File:** `lib/types.ts` + `lib/content-sources.ts`  
**Time:** 30 minutes  
**Priority:** Foundation Critical

#### **Type Definitions:**
```typescript
// Content source types
export type ContentSource = 
  | { type: 'text', content: string }
  | { type: 'document', documentId: string }
  | { type: 'url', url: string, title?: string }
  | { type: 'upload', file: File, fileName: string }
  | { type: 'hybrid', sources: ContentSource[], combineMethod: 'concat' | 'merge' | 'balanced' }

// Enhanced carousel creation request
export interface EnhancedCarouselRequest {
  title: string
  content_sources: ContentSource[]
  template_type: "NEWS" | "STORY" | "PRODUCT"
  slide_count: number
  
  // Content processing options
  content_priority?: 'first' | 'merge' | 'balanced'
  max_content_length?: number
  auto_summarize?: boolean
  
  // Existing fields
  template_id?: string
  target_audience?: string
  description?: string
}

// Content extraction result
export interface ExtractedContent {
  content: string
  wordCount: number
  charCount: number
  sources: string[]
  extractionMethod: string
  metadata?: {
    url?: string
    fileName?: string
    documentTitle?: string
    extractedAt: string
  }
}
```

#### **Acceptance Criteria:**
- [ ] Type system supports all content source types
- [ ] Proper validation for each source type
- [ ] Metadata tracking for content origin
- [ ] Extensible for future source types

---

### **Task 2: File Upload Processing**
**File:** `lib/file-processors.ts` + `app/api/upload/route.ts`  
**Time:** 45 minutes  
**Priority:** High User Value

#### **File Type Support:**
```typescript
// Supported file types
export const SUPPORTED_FILE_TYPES = {
  'text/plain': { extensions: ['.txt'], processor: 'text' },
  'text/markdown': { extensions: ['.md'], processor: 'markdown' },
  'application/pdf': { extensions: ['.pdf'], processor: 'pdf' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { 
    extensions: ['.docx'], 
    processor: 'docx' 
  },
  'text/csv': { extensions: ['.csv'], processor: 'csv' }
} as const

// File processing functions
export const processTextFile = async (file: File): Promise<string> => {
  return await file.text()
}

export const processMarkdownFile = async (file: File): Promise<string> => {
  const content = await file.text()
  // Strip markdown formatting for plain text
  return content.replace(/[#*_`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

export const processPDFFile = async (file: File): Promise<string> => {
  // TODO: Implement PDF text extraction
  // Options: pdf-parse, pdf2pic + OCR, or external service
  throw new Error('PDF processing not implemented yet')
}

export const processFile = async (file: File): Promise<ExtractedContent> => {
  const fileType = file.type
  const processor = SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES]
  
  if (!processor) {
    throw new Error(`Unsupported file type: ${fileType}`)
  }
  
  let content: string
  switch (processor.processor) {
    case 'text':
      content = await processTextFile(file)
      break
    case 'markdown':
      content = await processMarkdownFile(file)
      break
    case 'pdf':
      content = await processPDFFile(file)
      break
    default:
      throw new Error(`No processor for type: ${processor.processor}`)
  }
  
  return {
    content: content.trim(),
    wordCount: content.split(/\s+/).length,
    charCount: content.length,
    sources: [file.name],
    extractionMethod: processor.processor,
    metadata: {
      fileName: file.name,
      extractedAt: new Date().toISOString()
    }
  }
}
```

#### **Upload API Endpoint:**
```typescript
// POST /api/upload
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }
    
    // Process file
    const extractedContent = await processFile(file)
    
    // Validate minimum content length
    if (extractedContent.content.length < 50) {
      return NextResponse.json({ 
        error: 'File content too short (minimum 50 characters)' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true, 
      extractedContent 
    })
    
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ 
      error: 'Failed to process file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

#### **Acceptance Criteria:**
- [ ] Supports .txt, .md file uploads
- [ ] File size validation (5MB limit)
- [ ] Content length validation (50+ chars)
- [ ] Proper error handling for unsupported files
- [ ] Metadata extraction and tracking
- [ ] PDF support ready for future implementation

---

### **Task 3: Web URL Content Extraction**
**File:** `lib/web-scraper.ts` + `app/api/extract-url/route.ts`  
**Time:** 60 minutes  
**Priority:** Medium (Future Enhancement)

#### **Web Scraping Implementation:**
```typescript
// Web content extraction
export const extractWebContent = async (url: string): Promise<ExtractedContent> => {
  try {
    // Validate URL
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid URL protocol')
    }
    
    // Fetch page content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'InstaCarousel Bot 1.0',
      },
      timeout: 10000
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    
    // Extract main content (simple implementation)
    const content = extractMainContent(html)
    
    return {
      content: content.trim(),
      wordCount: content.split(/\s+/).length,
      charCount: content.length,
      sources: [url],
      extractionMethod: 'web-scraping',
      metadata: {
        url,
        extractedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    throw new Error(`Failed to extract content from URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Simple content extraction (can be enhanced with libraries like Cheerio)
const extractMainContent = (html: string): string => {
  // Remove scripts and styles
  let content = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  
  // Extract text from common content tags
  const contentRegex = /<(?:p|div|article|section|h[1-6])[^>]*>([\s\S]*?)<\/(?:p|div|article|section|h[1-6])>/gi
  const matches = content.match(contentRegex) || []
  
  // Clean up extracted text
  return matches
    .map(match => match.replace(/<[^>]*>/g, '').trim())
    .filter(text => text.length > 20)
    .join('\n\n')
}
```

#### **URL Extraction API:**
```typescript
// POST /api/extract-url
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const { url } = await request.json()
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL required' }, { status: 400 })
    }
    
    const extractedContent = await extractWebContent(url)
    
    if (extractedContent.content.length < 50) {
      return NextResponse.json({ 
        error: 'Extracted content too short (minimum 50 characters)' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true, 
      extractedContent 
    })
    
  } catch (error) {
    console.error('URL extraction error:', error)
    return NextResponse.json({ 
      error: 'Failed to extract content from URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

#### **Acceptance Criteria:**
- [ ] Basic HTML content extraction
- [ ] URL validation and error handling
- [ ] Timeout protection (10s limit)
- [ ] Content cleaning and formatting
- [ ] Metadata tracking for source URL
- [ ] Rate limiting for scraping requests

---

### **Task 4: Enhanced UI with Tabbed Content Input**
**File:** `components/dashboard/enhanced-project-dialog.tsx`  
**Time:** 75 minutes  
**Priority:** User Experience Critical

#### **Tabbed Interface Design:**
```typescript
type ContentInputTab = 'text' | 'document' | 'upload' | 'url' | 'hybrid'

export function EnhancedProjectDialog({ ...props }) {
  const [activeTab, setActiveTab] = useState<ContentInputTab>('text')
  const [contentSources, setContentSources] = useState<ContentSource[]>([])
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null)
  
  // Tab content components
  const renderTabContent = () => {
    switch (activeTab) {
      case 'text':
        return <TextInputTab onContentChange={handleTextContent} />
      case 'document':
        return <DocumentSelectTab onDocumentSelect={handleDocumentSelect} />
      case 'upload':
        return <FileUploadTab onFileUpload={handleFileUpload} />
      case 'url':
        return <URLInputTab onURLExtract={handleURLExtract} />
      case 'hybrid':
        return <HybridSourcesTab sources={contentSources} onSourcesChange={setContentSources} />
      default:
        return null
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New InstaCarousel</DialogTitle>
          <DialogDescription>
            Choose your content source and let AI generate your Instagram carousel
          </DialogDescription>
        </DialogHeader>
        
        {/* Content Source Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentInputTab)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="text" className="text-xs">📝 Text</TabsTrigger>
            <TabsTrigger value="document" className="text-xs">📄 Document</TabsTrigger>
            <TabsTrigger value="upload" className="text-xs">📎 Upload</TabsTrigger>
            <TabsTrigger value="url" className="text-xs">🔗 URL</TabsTrigger>
            <TabsTrigger value="hybrid" className="text-xs">🔄 Mix</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            {renderTabContent()}
          </div>
        </Tabs>
        
        {/* Content Preview */}
        {extractedContent && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Content Preview</h4>
            <p className="text-xs text-muted-foreground mb-1">
              {extractedContent.wordCount} words • {extractedContent.charCount} characters
            </p>
            <p className="text-sm line-clamp-3">{extractedContent.content}</p>
          </div>
        )}
        
        {/* Settings (Template, Slide Count, etc.) */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Existing template and slide count inputs */}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={!extractedContent || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isLoading ? loadingStage : "Create Carousel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

#### **Individual Tab Components:**
```typescript
// File Upload Tab
function FileUploadTab({ onFileUpload }: { onFileUpload: (content: ExtractedContent) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const handleFileSelect = async (file: File) => {
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }
      
      const { extractedContent } = await response.json()
      onFileUpload(extractedContent)
    } catch (error) {
      console.error('File upload error:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }
  
  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files)
        if (files[0]) handleFileSelect(files[0])
      }}
    >
      {isProcessing ? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Processing file...</span>
        </div>
      ) : (
        <>
          <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Drop your file here</p>
          <p className="text-sm text-muted-foreground mb-4">
            Supports: .txt, .md files (max 5MB)
          </p>
          <Button variant="outline" onClick={() => document.getElementById('file-input')?.click()}>
            Browse Files
          </Button>
          <input
            id="file-input"
            type="file"
            accept=".txt,.md"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />
        </>
      )}
    </div>
  )
}

// URL Input Tab
function URLInputTab({ onURLExtract }: { onURLExtract: (content: ExtractedContent) => void }) {
  const [url, setUrl] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  
  const handleExtract = async () => {
    if (!url.trim()) return
    
    setIsExtracting(true)
    try {
      const response = await fetch('/api/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }
      
      const { extractedContent } = await response.json()
      onURLExtract(extractedContent)
    } catch (error) {
      console.error('URL extraction error:', error)
      alert(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExtracting(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="url-input">Article or Blog URL</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="url-input"
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
          />
          <Button 
            onClick={handleExtract} 
            disabled={!url.trim() || isExtracting}
          >
            {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Extract'}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Extract content from articles, blog posts, and web pages
      </p>
    </div>
  )
}
```

#### **Acceptance Criteria:**
- [ ] Tabbed interface with 5 content source options
- [ ] Drag-and-drop file upload with visual feedback
- [ ] URL input with real-time extraction
- [ ] Content preview with word/character counts
- [ ] Seamless switching between input methods
- [ ] Loading states for all async operations

---

### **Task 5: Content Processing Pipeline**
**File:** `lib/content-processor.ts` + Update `app/api/projects/route.ts`  
**Time:** 45 minutes  
**Priority:** Integration Critical

#### **Unified Content Processing:**
```typescript
// Main content processing function
export const processContentSources = async (sources: ContentSource[]): Promise<ExtractedContent> => {
  const processedContents: ExtractedContent[] = []
  
  for (const source of sources) {
    let extracted: ExtractedContent
    
    switch (source.type) {
      case 'text':
        extracted = {
          content: source.content,
          wordCount: source.content.split(/\s+/).length,
          charCount: source.content.length,
          sources: ['manual-input'],
          extractionMethod: 'text-input'
        }
        break
        
      case 'document':
        const document = await getDocumentById(source.documentId)
        extracted = {
          content: document.content,
          wordCount: document.word_count,
          charCount: document.char_count,
          sources: [document.title],
          extractionMethod: 'document-link',
          metadata: { documentTitle: document.title }
        }
        break
        
      case 'url':
        extracted = await extractWebContent(source.url)
        break
        
      case 'upload':
        extracted = await processFile(source.file)
        break
        
      case 'hybrid':
        // Recursively process hybrid sources
        const subContents = await processContentSources(source.sources)
        extracted = combineContents([subContents], source.combineMethod || 'concat')
        break
        
      default:
        throw new Error(`Unsupported content source type`)
    }
    
    processedContents.push(extracted)
  }
  
  // Combine all content
  return combineContents(processedContents, 'concat')
}

// Content combination strategies
const combineContents = (contents: ExtractedContent[], method: 'concat' | 'merge' | 'balanced'): ExtractedContent => {
  switch (method) {
    case 'concat':
      const combinedContent = contents.map(c => c.content).join('\n\n---\n\n')
      return {
        content: combinedContent,
        wordCount: contents.reduce((sum, c) => sum + c.wordCount, 0),
        charCount: combinedContent.length,
        sources: contents.flatMap(c => c.sources),
        extractionMethod: 'combined-sources'
      }
      
    case 'merge':
      // TODO: Implement smart content merging (remove duplicates, etc.)
      return combineContents(contents, 'concat')
      
    case 'balanced':
      // TODO: Implement balanced content distribution
      return combineContents(contents, 'concat')
      
    default:
      return combineContents(contents, 'concat')
  }
}
```

#### **Updated Project Creation:**
```typescript
// Enhanced project creation with flexible content sources
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    
    const { 
      title, 
      content_sources, 
      template_type, 
      slide_count,
      template_id,
      target_audience,
      description 
    } = body
    
    // Validate content sources
    if (!content_sources || !Array.isArray(content_sources) || content_sources.length === 0) {
      return NextResponse.json({ error: "At least one content source is required" }, { status: 400 })
    }
    
    // Process all content sources
    const extractedContent = await processContentSources(content_sources)
    
    if (extractedContent.content.length < 50) {
      return NextResponse.json({ error: "Combined content too short (minimum 50 characters)" }, { status: 400 })
    }
    
    // Continue with existing project creation logic using extractedContent.content
    // ... rest of project creation
    
  } catch (error) {
    // ... error handling
  }
}
```

#### **Acceptance Criteria:**
- [ ] Processes all content source types correctly
- [ ] Handles multiple sources with proper combination
- [ ] Validates minimum content requirements
- [ ] Maintains metadata and source tracking
- [ ] Integrates seamlessly with existing AI generation

---

## **Testing Strategy**

### **Test Cases:**

**1. File Upload Test:**
```
Test File: sample-article.txt (200 words)
Expected: Successful upload, content extraction, carousel generation
```

**2. URL Extraction Test:**
```
Test URL: https://example-blog.com/article
Expected: Content extracted, cleaned, ready for generation
```

**3. Hybrid Content Test:**
```
Sources: Text input + Document + URL
Expected: All content combined, proper source attribution
```

**4. Error Handling Test:**
```
Scenarios: Large files, invalid URLs, unsupported formats
Expected: Clear error messages, graceful degradation
```

### **Edge Cases:**
- [ ] Empty files or URLs with no extractable content
- [ ] Very large content sources (>10,000 words)
- [ ] Mixed language content
- [ ] Malformed URLs or protected content
- [ ] File upload failures and network errors

---

## **Success Metrics**

### **Technical Metrics:**
- [ ] File processing time < 5 seconds for text files
- [ ] URL extraction success rate > 80%
- [ ] Content combination accuracy and formatting
- [ ] Error handling coverage for all failure scenarios

### **User Experience Metrics:**
- [ ] Users successfully upload files on first try
- [ ] Reduced content input time by 50%
- [ ] Increased content source diversity per carousel
- [ ] User satisfaction with content flexibility

---

## **Rollout Plan**

### **Phase A: File Upload Foundation (Week 1)**
- [ ] Implement file upload API and processing
- [ ] Add file upload tab to dialog
- [ ] Support .txt and .md files
- [ ] Test with various file sizes and formats

### **Phase B: URL Content Extraction (Week 2)**
- [ ] Implement web scraping functionality
- [ ] Add URL input tab
- [ ] Test with popular content sites
- [ ] Add rate limiting and error handling

### **Phase C: Hybrid Sources & Polish (Week 3)**
- [ ] Implement content combination logic
- [ ] Add hybrid sources tab
- [ ] Integrate with existing AI generation
- [ ] Comprehensive testing and optimization

### **Phase D: Advanced Features (Future)**
- [ ] PDF processing support
- [ ] Social media post extraction
- [ ] Content summarization options
- [ ] Advanced content merging strategies

---

## **Risk Mitigation**

### **File Processing Failures:**
- **Risk:** Uploaded files fail to process or extract content
- **Mitigation:** Robust error handling, file validation, fallback to manual input
- **Detection:** File processing success rate monitoring

### **Web Scraping Issues:**
- **Risk:** Sites block scraping or return protected content
- **Mitigation:** Respect robots.txt, implement rate limiting, provide clear error messages
- **Detection:** URL extraction success rate tracking

### **Content Quality Issues:**
- **Risk:** Extracted content is poorly formatted or irrelevant
- **Mitigation:** Content cleaning algorithms, preview before generation, user editing options
- **Detection:** User feedback and content quality metrics

### **Performance Impact:**
- **Risk:** File processing or web scraping slows down carousel creation
- **Mitigation:** Async processing, progress indicators, reasonable timeouts
- **Detection:** Response time monitoring and user drop-off analysis

---

## **Post-Launch Enhancements**

### **Future Improvements:**
- [ ] PDF and DOCX file support
- [ ] Intelligent content summarization
- [ ] Social media post URL extraction (Twitter, LinkedIn)
- [ ] Bulk content processing
- [ ] Content similarity detection and deduplication
- [ ] Advanced web scraping with JavaScript rendering

### **Analytics to Track:**
- [ ] Most popular content source types
- [ ] File upload success rates by type
- [ ] URL extraction success rates by domain
- [ ] Content combination preferences
- [ ] User workflow patterns across source types

---

## **Conclusion**

This enhancement transforms InstaCarousel from a limited text-input system to a flexible, multi-source content platform. Users can now source content from files, web articles, existing documents, or combine multiple sources for richer carousel creation.

**Impact:** Reduces content sourcing time, increases content quality options, and provides greater flexibility for diverse user workflows and content types.

---

## **✅ IMPLEMENTATION PRIORITIES**

### **🎯 Immediate Value (Phase A)**
- **File Upload System** - Easy win, high user value
- **Text/Markdown Processing** - Covers 80% of use cases
- **Enhanced UI with Tabs** - Better user experience

### **🚀 Medium Term (Phase B)**
- **URL Content Extraction** - Expands content sources significantly  
- **Content Preview System** - Improves user confidence
- **Error Handling Polish** - Professional user experience

### **🔮 Future Enhancements (Phase C+)**
- **PDF/DOCX Support** - Enterprise content support
- **Hybrid Content Mixing** - Advanced use cases
- **Social Media Integration** - Modern content workflows

**Start with file uploads for immediate impact, then expand to web content extraction for maximum flexibility.** 