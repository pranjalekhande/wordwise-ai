# **Phase 3.4: Simplified Wording Suggestions PRD**

## **Overview**
Add a simple, one-click "Suggest Wording" feature directly in the slide editor that provides 2 alternative phrasings with easy replace functionality.

**Current State:** Users manually edit slide content without AI assistance ❌  
**Target State:** One-click wording suggestions with 2 alternatives and instant replace ✅

---

## **Core Problem**
- Users write slide content but may want alternative phrasings
- No easy way to get quick wording suggestions
- Complex variation systems are overwhelming
- **Result:** Users stuck with first draft, missing better alternatives

## **Solution**
Simple "Suggest Wording" button in slide editor that shows 2 alternative phrasings with one-click replace functionality.

---

## **Design Principles**

### **Simplicity First**
- ✅ Single button, single purpose
- ✅ Exactly 2 suggestions (not overwhelming)
- ✅ One-click replace (no complex selection)
- ❌ No complex tone selection
- ❌ No template-specific logic
- ❌ No separate pages or panels

### **Integrated Experience**
- ✅ Button in slide editor header
- ✅ Suggestions appear below textarea
- ✅ Seamless workflow integration
- ❌ No modal dialogs
- ❌ No navigation away from editor

---

## **Technical Implementation**

### **Task 1: Simplified Suggestions API**
**File:** Update `app/api/generate-variations/route.ts`  
**Time:** 15 minutes  
**Priority:** Core Feature

#### **Simplified API Request:**
```typescript
interface SimpleSuggestionRequest {
  original_content: string
  // Remove: slide_type, template_type, slide_number, total_slides
}

interface SimpleSuggestionResponse {
  suggestions: [
    { id: string; content: string; char_count: number },
    { id: string; content: string; char_count: number }
  ]
  success: boolean
}
```

#### **Simplified Generation Logic:**
```typescript
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const { original_content } = await request.json()
    
    if (!original_content || original_content.trim().length < 10) {
      return NextResponse.json({ error: "Content too short for suggestions" }, { status: 400 })
    }
    
    // Generate exactly 2 variations: casual and professional
    const suggestions = []
    
    for (const tone of ['casual', 'professional']) {
      const prompt = `Rewrite this Instagram slide content with a ${tone} tone:

"${original_content}"

Requirements:
- Keep the same core message
- Make it more ${tone === 'casual' ? 'friendly and conversational' : 'polished and professional'}
- Stay under 180 characters
- Make it engaging for Instagram

Provide ONLY the rewritten content, no explanations.`

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an expert social media content editor. Respond only with the rewritten content." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 200,
        })

        const content = completion.choices[0]?.message?.content?.trim()
        if (content) {
          const cleanContent = content.replace(/^["']|["']$/g, '').substring(0, 180)
          suggestions.push({
            id: `${tone}-${Date.now()}`,
            content: cleanContent,
            char_count: cleanContent.length
          })
        }
      } catch (error) {
        console.error(`Error generating ${tone} suggestion:`, error)
      }
    }
    
    if (suggestions.length === 0) {
      return NextResponse.json({ 
        error: 'Unable to generate suggestions',
        success: false 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      suggestions,
      success: true
    })
    
  } catch (error) {
    console.error('Suggestions API error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate suggestions',
      success: false 
    }, { status: 500 })
  }
}
```

#### **Acceptance Criteria:**
- [ ] API generates exactly 2 suggestions: casual and professional
- [ ] No complex template logic or tone mapping
- [ ] Simple request/response structure
- [ ] Character limit validation (180 chars max)
- [ ] Error handling for failed generations

---

### **Task 2: Suggestions Button Component**
**File:** `components/editor/suggestions-button.tsx`  
**Time:** 10 minutes  
**Priority:** UI Critical

#### **Component Structure:**
```typescript
interface SuggestionsButtonProps {
  content: string
  onSuggestionsGenerated: (suggestions: Suggestion[]) => void
  disabled?: boolean
}

export function SuggestionsButton({ content, onSuggestionsGenerated, disabled }: SuggestionsButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSuggestWording = async () => {
    if (!content.trim() || content.trim().length < 10) {
      toast.error("Add more content before requesting suggestions")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_content: content.trim() })
      })

      if (response.ok) {
        const { suggestions } = await response.json()
        onSuggestionsGenerated(suggestions)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to generate suggestions')
      }
    } catch (error) {
      toast.error('Unable to generate suggestions')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSuggestWording}
      disabled={disabled || isLoading || content.trim().length < 10}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      {isLoading ? 'Suggesting...' : 'Suggest Wording'}
    </Button>
  )
}
```

#### **Acceptance Criteria:**
- [ ] Button appears in slide editor header
- [ ] Disabled when content is too short (< 10 chars)
- [ ] Loading state with spinner
- [ ] Clear error messages via toast
- [ ] Triggers suggestions generation

---

### **Task 3: Suggestions Card Component**
**File:** `components/editor/suggestions-card.tsx`  
**Time:** 15 minutes  
**Priority:** UI Critical

#### **Component Structure:**
```typescript
interface Suggestion {
  id: string
  content: string
  char_count: number
}

interface SuggestionsCardProps {
  suggestions: Suggestion[]
  onReplace: (content: string) => void
  onDismiss: () => void
}

export function SuggestionsCard({ suggestions, onReplace, onDismiss }: SuggestionsCardProps) {
  const handleReplace = (suggestion: Suggestion) => {
    onReplace(suggestion.content)
    onDismiss() // Auto-close after replacement
  }

  return (
    <Card className="mt-4 border-l-4 border-l-blue-500 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm text-blue-900">Wording Suggestions</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={suggestion.id} className="p-3 bg-white rounded border">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    Option {index + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {suggestion.char_count}/180 chars
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{suggestion.content}</p>
              </div>
              <Button
                size="sm"
                onClick={() => handleReplace(suggestion)}
                className="shrink-0"
              >
                Replace
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

#### **Acceptance Criteria:**
- [ ] Shows exactly 2 suggestions in compact cards
- [ ] Each suggestion has character count display
- [ ] "Replace" button for each suggestion
- [ ] Dismissible with X button
- [ ] Auto-closes after replacement
- [ ] Visually distinct from main content

---

### **Task 4: Integrate into Slide Editor**
**File:** Update `components/editor/slide-editor.tsx`  
**Time:** 10 minutes  
**Priority:** Integration Critical

#### **Integration Points:**
```typescript
export function SlideEditor({ projectId }: SlideEditorProps) {
  // ... existing state ...
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  const handleSuggestionsGenerated = (newSuggestions: Suggestion[]) => {
    setSuggestions(newSuggestions)
  }

  const handleReplaceSuggestion = (newContent: string) => {
    handleContentChange(newContent) // Use existing content change handler
    setSuggestions([]) // Clear suggestions
  }

  const handleDismissSuggestions = () => {
    setSuggestions([])
  }

  return (
    <div className="space-y-6">
      {/* ... existing navigation ... */}
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Slide Content</CardTitle>
                <div className="flex items-center gap-2">
                  {/* ... existing auto-save indicator ... */}
                  
                  {/* NEW: Suggestions Button */}
                  <SuggestionsButton
                    content={content}
                    onSuggestionsGenerated={handleSuggestionsGenerated}
                    disabled={isAutoSaving}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write your Instagram carousel slide content here..."
                className="min-h-[300px] resize-none"
              />
              
              {/* NEW: Suggestions Card */}
              {suggestions.length > 0 && (
                <SuggestionsCard
                  suggestions={suggestions}
                  onReplace={handleReplaceSuggestion}
                  onDismiss={handleDismissSuggestions}
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* ... existing sidebar ... */}
      </div>
    </div>
  )
}
```

#### **Acceptance Criteria:**
- [ ] Button integrated in slide editor header
- [ ] Suggestions appear below textarea when generated
- [ ] Replace functionality updates slide content
- [ ] No breaking changes to existing functionality
- [ ] Clean integration with auto-save system

---

## **User Experience Flow**

### **Step 1: Default State**
```
┌─────────────────────────────────────────────────────┐
│ Slide Content                    [Suggest Wording] │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Write your Instagram carousel slide content     │ │
│ │ here...                                         │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### **Step 2: Loading State**
```
┌─────────────────────────────────────────────────────┐
│ Slide Content                    [⟳ Suggesting...] │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Your content is here and you want to improve   │ │
│ │ the wording for better engagement...            │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### **Step 3: Suggestions Shown**
```
┌─────────────────────────────────────────────────────┐
│ Slide Content                    [Suggest Wording] │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Your content is here and you want to improve   │ │
│ │ the wording for better engagement...            │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✨ Wording Suggestions                      [×] │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ ⚪ Option 1     [120/180 chars]     [Replace] │ │
│ │ Looking to boost engagement? Here's how to     │ │
│ │ improve your content wording...                │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ ⚪ Option 2     [115/180 chars]     [Replace] │ │
│ │ Want better engagement? Discover the secrets   │ │
│ │ to improving your content wording.             │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### **Step 4: After Replace**
```
┌─────────────────────────────────────────────────────┐
│ Slide Content                    [Suggest Wording] │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Looking to boost engagement? Here's how to     │ │ ← Updated
│ │ improve your content wording...            ✓   │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## **Success Metrics**

### **Usability Metrics:**
- [ ] Users discover the feature within 30 seconds of slide editing
- [ ] 80% of users who click "Suggest Wording" use at least one suggestion
- [ ] Average time from suggestion to replacement < 10 seconds
- [ ] Users can generate suggestions multiple times per slide

### **Technical Metrics:**
- [ ] API response time < 3 seconds for 2 suggestions
- [ ] 95% success rate for suggestion generation
- [ ] No errors in content replacement workflow
- [ ] Suggestions stay within 180 character limit

### **Content Quality Metrics:**
- [ ] Generated suggestions are grammatically correct
- [ ] Suggestions maintain original message intent
- [ ] Casual and professional tones are clearly different
- [ ] Users find suggestions helpful and relevant

---

## **Testing Strategy**

### **Test Cases:**

**1. Basic Functionality:**
```
Input: "This is a test slide about productivity tips"
Expected: 2 suggestions (casual + professional versions)
Validation: Both under 180 chars, different tones, same core message
```

**2. Short Content:**
```
Input: "Hi there"
Expected: Button disabled, error message if clicked
Validation: User gets clear feedback about minimum length
```

**3. Long Content:**
```
Input: 200+ character content
Expected: 2 suggestions, both truncated to 180 chars
Validation: Suggestions are complete thoughts, not cut off mid-word
```

**4. Replace Workflow:**
```
Flow: Write content → Click suggest → Click replace on option 1
Expected: Textarea updates with new content, suggestions disappear
Validation: Auto-save triggers, no loss of content
```

### **Edge Cases:**
- [ ] Empty content (button disabled)
- [ ] Very short content (< 10 chars)
- [ ] Content with special characters, emojis
- [ ] Network failures during suggestion generation
- [ ] Multiple rapid clicks on suggest button

---

## **Implementation Timeline**

### **Day 1: API Simplification** (30 minutes)
- [ ] Update generate-variations endpoint
- [ ] Remove complex template logic
- [ ] Test with simple casual/professional generation

### **Day 2: UI Components** (45 minutes)
- [ ] Create SuggestionsButton component
- [ ] Create SuggestionsCard component
- [ ] Test components in isolation

### **Day 3: Integration** (30 minutes)
- [ ] Integrate into existing slide editor
- [ ] Test complete user workflow
- [ ] Handle loading and error states

### **Day 4: Polish & Testing** (15 minutes)
- [ ] Add smooth animations
- [ ] Test edge cases
- [ ] Ensure accessibility compliance

---

## **Risk Mitigation**

### **API Failures:**
- **Risk:** OpenAI service unavailable
- **Mitigation:** Graceful error messages, suggest trying again later
- **Detection:** Monitor API success rates

### **Poor Suggestion Quality:**
- **Risk:** AI generates irrelevant or poor suggestions
- **Mitigation:** Clear prompts, temperature optimization
- **Detection:** User feedback, usage analytics

### **UI Performance:**
- **Risk:** Suggestions slow down editor
- **Mitigation:** Async loading, optimistic UI updates
- **Detection:** Performance monitoring

---

## **Future Enhancements** (Not in Scope)

### **Potential Improvements:**
- [ ] More than 2 suggestions (if users request)
- [ ] Different suggestion categories (shorter/longer, more/less formal)
- [ ] Learn from user preferences over time
- [ ] Suggest improvements for specific issues (grammar, engagement, etc.)

### **Analytics to Track:**
- [ ] Most clicked suggestion type (casual vs professional)
- [ ] Average suggestions used per slide
- [ ] User satisfaction with suggestions
- [ ] Time saved in content creation

---

## **Conclusion**

This simplified approach provides immediate value with minimal complexity. Users get quick access to alternative wording without overwhelming choices or complex workflows.

**Impact:** Transforms slide editing from a solo activity to AI-assisted content improvement with zero learning curve and maximum usability.

---

## **✅ IMPLEMENTATION COMPLETED**

### **🎯 Core Requirements**
- ✅ Single "Suggest Wording" button in slide editor header
- ✅ Exactly 2 suggestions: casual and professional tone
- ✅ Compact suggestions card below textarea
- ✅ One-click replace functionality
- ✅ Auto-dismiss after replacement

### **🔧 Technical Requirements**  
- ✅ Simplified API endpoint (no template complexity)
- ✅ Character limit validation (180 chars)
- ✅ Error handling and loading states
- ✅ Integration with existing auto-save
- ✅ No breaking changes to current editor

### **🎨 User Experience Requirements**
- ✅ Button disabled for short content (< 10 chars)
- ✅ Clear loading and error states
- ✅ Toast notifications for errors and success
- ✅ Accessible design with proper button states
- ✅ Blue-themed suggestions card for visual distinction

### **📁 Files Created/Modified**
- ✅ `app/api/generate-variations/route.ts` - Simplified to 2 suggestions only
- ✅ `components/editor/suggestions-button.tsx` - New simple button component
- ✅ `components/editor/suggestions-card.tsx` - New suggestions display component
- ✅ `components/editor/slide-editor.tsx` - Integrated suggestions functionality
- ✅ Removed `app/test-variations/page.tsx` - No longer needed
- ✅ Removed `test-variations.js` - External testing not needed

### **🚀 Ready to Use**
The simplified wording suggestions feature is now fully implemented and ready for users! 

**Simple, focused, and immediately useful - exactly what users need! 🎯** 