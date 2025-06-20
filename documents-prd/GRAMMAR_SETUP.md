# Grammar Checking Setup Guide

This guide will help you set up the Grammarly-like grammar checking functionality in your WordWise AI application.

## Prerequisites

1. **Node.js Version**: You need Node.js v18.12 or higher for the OpenAI package to work properly.
2. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

## Installation Steps

### 1. Update Node.js (if needed)
```bash
# Check your current Node.js version
node --version

# If you're using nvm, update to the latest LTS version
nvm install --lts
nvm use --lts

# Or download from https://nodejs.org/
```

### 2. Install Dependencies
After updating Node.js, install the OpenAI package:
```bash
pnpm install
# or if you prefer npm
npm install
```

### 3. Environment Variables
Create a `.env.local` file in your project root and add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Features Included

### ✅ Real-time Grammar Checking
- Automatically checks grammar, spelling, and style as you type
- Debounced checking (waits 2 seconds after you stop typing)
- Can be toggled on/off with a switch

### ✅ Visual Highlighting
- **Red underline**: High severity issues (critical grammar/spelling errors)
- **Yellow underline**: Medium severity issues (style suggestions)
- **Blue underline**: Low severity issues (minor improvements)

### ✅ Interactive Suggestions
- Click on highlighted text to see suggestions
- One-click to apply suggestions
- Dismiss issues you want to ignore
- Detailed explanations for complex issues

### ✅ Grammar Summary Sidebar
- Real-time issue count
- Breakdown by type (grammar, spelling, style)
- Manual check button for immediate analysis

## How to Use

### 1. Using the Enhanced Editor
The enhanced document editor includes all grammar checking features:

```typescript
import { EnhancedDocumentEditor } from "@/components/documents/enhanced-document-editor"

// Use in your page components
<EnhancedDocumentEditor document={document} isNewDocument={isNew} />
```

### 2. Grammar Check Controls
- **Auto-check toggle**: Enable/disable real-time checking
- **Manual check button**: Force immediate grammar analysis
- **Issue navigation**: Click highlighted text to see details and suggestions

### 3. API Endpoint
The grammar checking API is available at:
```
POST /api/documents/check-grammar
```

Request body:
```json
{
  "text": "Your text to check",
  "checkType": "all" // or "grammar", "spelling", "style"
}
```

## Components Architecture

### Main Components
1. **`EnhancedDocumentEditor`**: Full document editor with grammar checking
2. **`GrammarHighlight`**: Text highlighting component with issue overlays
3. **`useGrammarCheck`**: Custom hook for grammar checking logic

### API Structure
- **Route**: `app/api/documents/check-grammar/route.ts`
- **Types**: Grammar checking types in `lib/types.ts`
- **Hook**: Grammar checking logic in `hooks/use-grammar-check.tsx`

## Customization Options

### Adjust Checking Frequency
Modify the debounce timing in the hook:
```typescript
const grammarCheck = useGrammarCheck({
  debounceMs: 3000, // Check after 3 seconds of inactivity
  autoCheck: true
})
```

### Customize Issue Severity Colors
Edit the `getSeverityColor` function in `GrammarHighlight` component:
```typescript
const getSeverityColor = (severity: GrammarIssue["severity"]) => {
  switch (severity) {
    case "high": return "border-b-2 border-red-500 bg-red-50"
    case "medium": return "border-b-2 border-yellow-500 bg-yellow-50"
    case "low": return "border-b-2 border-blue-500 bg-blue-50"
  }
}
```

### Modify OpenAI Prompt
Update the grammar checking prompt in the API route to customize the analysis style:
```typescript
const prompt = `
You are a professional writing assistant. Analyze the following text...
// Customize the instructions here
`
```

## Performance Notes

- The OpenAI API calls are debounced to avoid excessive requests
- Grammar checking only occurs for text longer than 10 characters
- Uses GPT-4-mini for cost-effective analysis
- API responses are cached to improve performance

## Troubleshooting

### Common Issues

1. **"Cannot find module 'openai'"**
   - Ensure Node.js version is 18.12+
   - Run `pnpm install` or `npm install`

2. **"OpenAI API key not configured"**
   - Add `OPENAI_API_KEY` to your `.env.local` file
   - Restart your development server

3. **Grammar check not working**
   - Check browser console for API errors
   - Verify your OpenAI API key has sufficient credits
   - Ensure the toggle is enabled in the editor

4. **Highlighting not showing**
   - Check that grammar check is enabled
   - Try manual check with the "Check Now" button
   - Verify text is longer than 10 characters

## Cost Management

- Uses GPT-4-mini model for cost efficiency
- Debounced requests reduce API calls
- Consider implementing user usage limits for production

## Future Enhancements

Potential improvements you could add:
- Grammar rules customization
- Multiple language support
- Offline spell checking
- Custom dictionary management
- Writing style preferences
- Team/organization grammar standards

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure your OpenAI API key has credits
4. Check that Node.js version is compatible

---

Happy writing with enhanced grammar checking! ✨ 