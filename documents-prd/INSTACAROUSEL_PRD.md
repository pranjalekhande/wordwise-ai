# **InstaCarousel Creator - Simplified PRD**

## **Core Concept**
Transform your existing "Projects" into "InstaCarousels" - simple, document-driven Instagram carousel creation tool.

---

## **Phase 1: Rebranding & Simplification (Week 1)**

### **1.1 Rename Everything**
- [ ] Change "Project" → "InstaCarousel" throughout codebase
- [ ] Update database: `carousel_projects` → `insta_carousels`
- [ ] Update all UI labels and navigation
- [ ] Change URLs: `/projects/` → `/carousels/`
- [ ] Update API endpoints: `/api/projects/` → `/api/carousels/`

### **1.2 Streamline Data Model**
- [ ] Remove unnecessary fields from carousel table:
  - Remove `project_id` complexity
  - Keep: `id`, `user_id`, `title`, `description`, `document_id`, `template_type`, `status`
- [ ] Add simple `template_type` enum: `NEWS`, `STORY`, `PRODUCT`
- [ ] Add `source_text` field for storing input content (min 50 chars)

---

## **Phase 2: Simple Document-to-Carousel Flow (Week 2)**

### **2.1 Enhanced Carousel Creation**
- [ ] Modify existing "New Project" dialog to "New InstaCarousel"
- [ ] Add simple form fields:
  - **Title**: Carousel name
  - **Source Text**: Large textarea (min 50 chars validation)
  - **Template Type**: Simple dropdown (NEWS/STORY/PRODUCT)
  - **Number of Slides**: Number input (3-10 range)
- [ ] Remove complex template selection UI

### **2.2 Document Integration**
- [ ] Add "Create Carousel from Document" button to document list
- [ ] Pre-populate source text from selected document
- [ ] Link carousel back to source document (`document_id`)

---

## **Phase 3: Simple AI Generation (Week 3)**

### **3.1 Basic Content Generation**
- [ ] Create simple AI endpoint: `/api/generate-slides`
- [ ] Input: `source_text`, `template_type`, `slide_count`
- [ ] Output: Array of slide contents
- [ ] Simple template logic:
  - **NEWS**: Break into: Hook → Key Points → Facts → Conclusion → CTA
  - **STORY**: Break into: Hook → Setup → Challenge → Resolution → Takeaway
  - **PRODUCT**: Break into: Problem → Solution → Features → Benefits → CTA

### **3.2 Fallback to Manual**
- [ ] If AI generation fails, create empty slides
- [ ] User can manually fill content using existing slide editor
- [ ] Keep existing slide editing functionality as-is

---

## **Phase 4: UI Updates (Week 4)**

### **4.1 Dashboard Updates**
- [ ] Change "Projects" section to "InstaCarousels"
- [ ] Update project cards to show:
  - Carousel title
  - Template type badge (NEWS/STORY/PRODUCT)
  - Slide count
  - Source document name (if linked)
- [ ] Keep existing filtering and search

### **4.2 Creation Flow**
- [ ] Single-step creation dialog (no wizard complexity)
- [ ] Form fields:
  ```
  Title: [text input]
  Source Text: [large textarea with char counter]
  Template: [simple dropdown: NEWS | STORY | PRODUCT]
  Slides: [number input: 3-10]
  [Create Carousel] [Cancel]
  ```
- [ ] Show loading state during generation
- [ ] Redirect to slide editor after creation

### **4.3 Editor Updates**
- [ ] Keep existing slide editor functionality
- [ ] Update breadcrumbs: "Back to Carousels"
- [ ] Show template type in header
- [ ] Add "Regenerate All Slides" button (optional)

---

## **Phase 5: Enhanced Features (Week 5)**

### **5.1 Simple Optimizations**
- [ ] Add Instagram character count guidelines per slide (150-200 chars optimal)
- [ ] Basic hashtag suggestions based on content
- [ ] Simple readability indicators

### **5.2 Export Features**
- [ ] Export as text file (one slide per section)
- [ ] Copy individual slides to clipboard
- [ ] Simple PDF export (optional)

---

## **Implementation Priority:**

**Week 1-2: Core Rename & Basic Flow**
1. Rename everything from "Project" to "InstaCarousel"
2. Add source text input to creation flow
3. Add template type selection

**Week 3: Simple AI Integration**
1. Basic content splitting based on template type
2. Fallback to manual editing

**Week 4: Polish & Launch**
1. UI cleanup and testing
2. Basic optimizations

---

## **Simplified User Flow:**

1. **User clicks "New InstaCarousel"**
2. **Fills simple form:**
   - Title
   - Paste/type text (50+ chars)
   - Select template (NEWS/STORY/PRODUCT)
   - Choose slide count
3. **Clicks "Create"** → AI generates slides
4. **Redirected to existing slide editor** (your current functionality)
5. **User edits/exports as needed**

---

## **Database Changes (Minimal):**

```sql
-- Just rename and add a few fields to existing structure
ALTER TABLE carousel_projects RENAME TO insta_carousels;
ALTER TABLE insta_carousels ADD COLUMN source_text TEXT;
ALTER TABLE insta_carousels ADD COLUMN template_type VARCHAR(20) DEFAULT 'STORY';
```

---

## **Key Benefits of This Approach:**

1. **Leverages 90% of existing functionality** - minimal rewrite needed
2. **Simple user experience** - no complex wizards or previews
3. **Document-driven** - builds on your existing document system
4. **Focused scope** - clear Instagram carousel use case
5. **Quick implementation** - can be done in 4-5 weeks

---

## **Success Metrics:**

- [ ] User can create carousel from text in under 2 minutes
- [ ] 80% of users successfully generate slides on first try
- [ ] Generated content requires minimal editing
- [ ] Users can export/copy content easily

This approach turns your existing project system into a focused, simple Instagram carousel creation tool while maintaining all the good functionality you've already built. 