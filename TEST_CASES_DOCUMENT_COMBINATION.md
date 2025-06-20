# Test Cases: Document + Text Combination Feature

## Manual Testing Checklist

### Prerequisites
- [ ] App is running locally
- [ ] At least 3 documents exist in the system with varying content lengths
- [ ] User is authenticated

### Test Case 1: Document Only Mode
**Objective**: Verify document-only carousel creation works correctly

**Steps**:
1. Navigate to dashboard
2. Click "New InstaCarousel" 
3. Enter carousel title: "Test Document Only"
4. Select a document from dropdown (>50 characters)
5. Leave "Source Text" textarea empty
6. Select template type: "STORY"
7. Set slide count: 5
8. Click "Create Carousel"

**Expected Results**:
- [ ] Green indicator shows document content loaded
- [ ] Character count shows document length only
- [ ] Placeholder text shows: "Add additional context or instructions (optional)..."
- [ ] Submit button is enabled (if document >50 chars)
- [ ] Carousel created successfully
- [ ] Generated slides use document content only

### Test Case 2: Text Only Mode  
**Objective**: Verify manual text input works correctly

**Steps**:
1. Navigate to dashboard
2. Click "New InstaCarousel"
3. Enter carousel title: "Test Text Only"
4. Leave document selection as "No document" 
5. Enter >50 characters in "Source Text" textarea
6. Select template type: "NEWS"
7. Set slide count: 4
8. Click "Create Carousel"

**Expected Results**:
- [ ] No document indicator shown
- [ ] Character count shows manual text length only
- [ ] Placeholder text shows: "Paste your content here (minimum 50 characters)..."
- [ ] Submit button enabled when text >50 chars
- [ ] Carousel created successfully
- [ ] Generated slides use manual text only

### Test Case 3: Combined Mode (Test Condition)
**Objective**: Verify document + additional text combination works correctly

**Steps**:
1. Navigate to dashboard
2. Click "New InstaCarousel"
3. Enter carousel title: "Test Combined Mode"
4. Select a document from dropdown
5. Enter additional text in "Source Text" textarea: "Focus on Instagram engagement and use emojis"
6. Select template type: "PRODUCT"
7. Set slide count: 6
8. Click "Create Carousel"

**Expected Results**:
- [ ] Blue "Test Condition" indicator appears
- [ ] Shows both document and additional text character counts
- [ ] Label shows: "Source Text + Document Content (XXX chars)"
- [ ] Combined character count displayed
- [ ] Submit button enabled when combined length >50 chars
- [ ] Carousel created successfully
- [ ] Generated slides use combined format:
  ```
  [Document Content]
  
  ---
  
  Additional Context:
  [Additional Text]
  ```

### Test Case 4: Validation - Insufficient Content
**Objective**: Verify validation prevents submission with insufficient content

**Steps**:
1. Navigate to dashboard
2. Click "New InstaCarousel"
3. Enter carousel title: "Test Validation"
4. Try these scenarios:
   a. No document, <50 chars text
   b. Document with <50 chars, no additional text
   c. Short document + short text (combined <50 chars)

**Expected Results**:
- [ ] Submit button disabled for scenario (a)
- [ ] Submit button disabled for scenario (b)  
- [ ] Submit button disabled for scenario (c)
- [ ] Error message shows: "Need X more characters (minimum 50 required)"
- [ ] Character counts update in real-time

### Test Case 5: Document Loading and Error Handling
**Objective**: Verify document loading and error handling

**Steps**:
1. Navigate to dashboard
2. Click "New InstaCarousel"
3. Select different documents from dropdown
4. Observe loading behavior
5. Try with documents of different sizes

**Expected Results**:
- [ ] Document content loads automatically on selection
- [ ] Character count updates when document selected
- [ ] UI updates smoothly without flickering
- [ ] Works with small and large documents
- [ ] No console errors during document loading

### Test Case 6: Form Reset and State Management
**Objective**: Verify form state management works correctly

**Steps**:
1. Navigate to dashboard
2. Click "New InstaCarousel"
3. Select a document
4. Add additional text
5. Change document selection
6. Clear document selection
7. Cancel dialog and reopen

**Expected Results**:
- [ ] Document content updates when selection changes
- [ ] Additional text remains when changing documents
- [ ] Document content clears when "No document" selected
- [ ] Form resets completely when dialog closed and reopened
- [ ] No lingering state from previous sessions

### Test Case 7: API Integration
**Objective**: Verify API receives correct combined content

**Steps**:
1. Open browser dev tools, Network tab
2. Create carousel with combined mode
3. Inspect API request to `/api/projects`
4. Check `source_text` field in request body

**Expected Results**:
- [ ] API request contains combined content in correct format
- [ ] Document content appears first
- [ ] Separator line "---" present
- [ ] Additional context section included
- [ ] No duplicate content or formatting issues

### Test Case 8: Edge Cases
**Objective**: Test edge cases and boundary conditions

**Steps**:
1. Test with very long documents (>5000 chars)
2. Test with minimal documents (exactly 50 chars)
3. Test with special characters in content
4. Test with empty documents
5. Test rapid document selection changes

**Expected Results**:
- [ ] Large documents handled correctly
- [ ] Minimal content meets validation
- [ ] Special characters preserved
- [ ] Empty documents handled gracefully
- [ ] No race conditions with rapid changes

### Test Case 9: User Experience
**Objective**: Verify overall user experience is smooth

**Steps**:
1. Complete full workflow as new user
2. Try different combinations of inputs
3. Read all UI text and indicators
4. Test on different screen sizes

**Expected Results**:
- [ ] Instructions are clear and helpful
- [ ] Visual indicators are intuitive
- [ ] Color coding is consistent (green=good, blue=test, red=error)
- [ ] Layout works on mobile and desktop
- [ ] No confusing or ambiguous states

## Automated Testing

### API Tests
```javascript
// Test combined content format
test('API receives combined content in correct format', async () => {
  const documentContent = "This is document content.";
  const additionalText = "This is additional context.";
  const expectedCombined = `${documentContent}\n\n---\n\nAdditional Context:\n${additionalText}`;
  
  // Mock API call
  const response = await createCarousel({
    title: "Test",
    source_text: expectedCombined,
    template_type: "STORY"
  });
  
  expect(response.ok).toBe(true);
});
```

### Component Tests  
```javascript
// Test combined text calculation
test('getCombinedSourceText combines content correctly', () => {
  const component = render(<NewProjectDialog />);
  // Test logic for combining document + text
});
```

## Performance Testing

### Load Testing
- [ ] Test with 50+ documents in dropdown
- [ ] Test with very large documents (10MB+)
- [ ] Test rapid document selection changes
- [ ] Monitor memory usage during testing

### Network Testing
- [ ] Test with slow network connections
- [ ] Test with network interruptions during document loading
- [ ] Verify graceful degradation

## Bug Report Template

When reporting issues with this feature:

```
**Test Case**: [Which test case from above]
**Environment**: [Browser, OS, etc.]
**Steps to Reproduce**: [Detailed steps]
**Expected Result**: [What should happen]
**Actual Result**: [What actually happened]
**Screenshots**: [If applicable]
**Console Errors**: [Any JavaScript errors]
**Additional Context**: [Any other relevant info]
```

## Success Criteria

Feature is considered ready when:
- [ ] All manual test cases pass
- [ ] No console errors during normal usage
- [ ] UI is responsive and intuitive
- [ ] API integration works correctly
- [ ] Performance is acceptable
- [ ] Edge cases handled gracefully 