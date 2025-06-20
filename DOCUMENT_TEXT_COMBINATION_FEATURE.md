# Document + Text Combination Feature

## Overview
This feature allows users to create Instagram carousels by combining existing document content with additional text input, providing maximum flexibility for content creation.

## Feature Description

### Three Input Modes

1. **Document Only Mode**
   - User selects an existing document
   - System uses document content as source text
   - Minimum 50 characters validation applied to document content

2. **Text Only Mode** 
   - User manually enters text in the textarea
   - Traditional text input workflow
   - Minimum 50 characters validation applied to manual text

3. **Combined Mode (Test Condition)**
   - User selects a document AND adds additional text
   - System combines both sources with clear separation
   - Total combined length must meet 50 character minimum

### Combined Text Format
When both document and additional text are provided:
```
[Document Content]

---

Additional Context:
[User Additional Text]
```

## Implementation Details

### Frontend Components

#### New State Variables
```typescript
const [selectedDocumentContent, setSelectedDocumentContent] = useState<string>("")
```

#### Key Functions
```typescript
// Handle document selection and content fetching
const handleDocumentChange = async (value: string) => {
  setDocumentId(value)
  if (value && value !== "none") {
    await fetchDocumentContent(value)
  } else {
    setSelectedDocumentContent("")
  }
}

// Calculate combined source text
const getCombinedSourceText = () => {
  const hasDocument = selectedDocumentContent.trim().length > 0
  const hasTextInput = sourceText.trim().length > 0
  
  if (hasDocument && hasTextInput) {
    // Test condition: Both document and text input provided
    return `${selectedDocumentContent.trim()}\n\n---\n\nAdditional Context:\n${sourceText.trim()}`
  } else if (hasDocument) {
    return selectedDocumentContent.trim()
  } else if (hasTextInput) {
    return sourceText.trim()
  }
  return ""
}
```

## Usage Instructions

### Test Scenarios

1. **Document Only**:
   - Select a document from dropdown
   - Leave text area empty
   - Create carousel

2. **Text Only**:
   - Leave document selection as "No document"
   - Enter text in textarea (minimum 50 chars)
   - Create carousel

3. **Combined Mode (Test Condition)**:
   - Select a document from dropdown
   - Add additional text in textarea
   - Blue indicator will appear showing test condition is active
   - Create carousel with combined content

## API Integration

The `source_text` field now contains the combined content when both sources are provided.

## Files Modified

1. `components/dashboard/new-project-dialog.tsx`
   - Added document content fetching
   - Added combined text calculation
   - Enhanced UI with indicators and validation
   - Updated form submission logic

## Benefits

- **Flexibility**: Use existing documents as base content
- **Enhancement**: Add Instagram-specific context to documents  
- **Efficiency**: Don't retype existing content
- **Clear feedback**: Visual indicators for all input modes 