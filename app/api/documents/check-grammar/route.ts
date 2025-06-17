import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { requireAuth } from "@/lib/auth"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface GrammarIssue {
  id: string
  type: "grammar" | "spelling" | "style"
  severity: "low" | "medium" | "high"
  message: string
  start: number
  end: number
  originalText: string
  suggestions: string[]
  explanation?: string
}

export interface GrammarCheckResponse {
  issues: GrammarIssue[]
  correctedText?: string
  summary: {
    totalIssues: number
    grammarIssues: number
    spellingIssues: number
    styleIssues: number
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    
    const { text, checkType = "all" } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OpenAI API key not configured" 
      }, { status: 500 })
    }

    // Create a prompt for grammar and spell checking
    const prompt = `
You are a professional writing assistant. Analyze the following text ONLY for grammar, spelling, and style issues. 

Text to analyze:
"${text}"

Please provide a JSON response with the following structure:
{
  "issues": [
    {
      "id": "unique_id",
      "type": "grammar|spelling|style",
      "severity": "low|medium|high",
      "message": "Brief description of the issue",
      "start": number (character position),
      "end": number (character position),
      "originalText": "exact text with issue",
      "suggestions": ["suggestion1", "suggestion2"],
      "explanation": "Optional detailed explanation"
    }
  ],
  "correctedText": "The fully corrected version of the text",
  "summary": {
    "totalIssues": number,
    "grammarIssues": number,
    "spellingIssues": number,
    "styleIssues": number
  }
}

CRITICAL CLASSIFICATION RULES:

**GRAMMAR issues** (type: "grammar") - ONLY these types:
- Subject-verb disagreement (e.g., "He don't" → "He doesn't")
- Incorrect verb tenses (e.g., "I have went" → "I have gone")
- Wrong pronoun usage (e.g., "Me and him" → "He and I")
- Article errors (e.g., "a apple" → "an apple")
- Preposition mistakes (e.g., "different than" → "different from")
- Comma splices and run-on sentences
- Incorrect word forms (e.g., "good" vs "well")

**SPELLING issues** (type: "spelling") - ONLY these:
- Misspelled words (e.g., "ultiple" → "multiple")
- Typos (e.g., "teh" → "the")
- Wrong word entirely due to spelling (e.g., "there" vs "their")

**STYLE issues** (type: "style") - Everything else including:
- Sentence fragments
- Unclear or awkward phrasing
- Wordiness or redundancy
- Passive voice suggestions
- Tone or clarity improvements
- Word choice recommendations
- Flow and readability suggestions

IMPORTANT: 
- If it's about sentence structure, clarity, or readability → type: "style"
- If it's about correct grammar rules → type: "grammar"  
- If it's a misspelled word → type: "spelling"
- Be VERY conservative with grammar classification
- Most "consider rephrasing" suggestions should be "style"
- Sentence fragments are "style", not "grammar"

OTHER RULES:
1. The "originalText" field MUST contain the EXACT text from the document
2. For spelling: only the misspelled word
3. For grammar: the specific phrase with the error
4. For style: the phrase that could be improved
5. Calculate positions by counting from start (0-based)
6. Ensure positions exactly match "originalText"
7. Give 1-3 suggestions per issue
8. Use clear, concise messages
9. Return valid JSON only

Examples:
- Text: "He don't like it" → type: "grammar", originalText: "don't", suggestions: ["doesn't"]
- Text: "I have ultiple cats" → type: "spelling", originalText: "ultiple", suggestions: ["multiple"]
- Text: "Which is good." → type: "style", originalText: "Which is good.", suggestions: ["This is good."]
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional writing assistant that provides grammar, spelling, and style suggestions. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    })

    const responseContent = completion.choices[0]?.message?.content

    if (!responseContent) {
      return NextResponse.json({ 
        error: "No response from OpenAI" 
      }, { status: 500 })
    }

    try {
      // Parse the JSON response from OpenAI
      const grammarCheckResult: GrammarCheckResponse = JSON.parse(responseContent)
      
      // Validate and fix issues
      grammarCheckResult.issues = grammarCheckResult.issues
        .map((issue, index) => {
          // Add unique ID if not provided
          const validatedIssue = {
            ...issue,
            id: issue.id || `issue-${index}`
          }

          // Reclassify issues that were incorrectly categorized
          const message = issue.message.toLowerCase()
          
          // Style indicators that should NOT be grammar
          const styleIndicators = [
            'sentence fragment',
            'consider rephrasing',
            'unclear',
            'awkward',
            'wordy',
            'passive voice',
            'flow',
            'readability',
            'clarity',
            'tone',
            'word choice',
            'redundant',
            'verbose',
            'concise',
            'better to',
            'might be better',
            'could be improved',
            'consider using',
            'sounds better',
            'more natural'
          ]
          
          // If marked as grammar but contains style indicators, reclassify as style
          if (issue.type === 'grammar' && styleIndicators.some(indicator => message.includes(indicator))) {
            console.log(`Reclassifying "${issue.message}" from grammar to style`)
            validatedIssue.type = 'style'
          }
          
          // Grammar indicators that should stay as grammar
          const grammarIndicators = [
            'subject-verb',
            'verb tense',
            'pronoun',
            'article',
            'preposition',
            'comma splice',
            'run-on',
            'agreement',
            'conjugation',
            'should be',
            'incorrect use of',
            'wrong form'
          ]
          
          // If marked as style but contains grammar indicators, reclassify as grammar
          if (issue.type === 'style' && grammarIndicators.some(indicator => message.includes(indicator))) {
            console.log(`Reclassifying "${issue.message}" from style to grammar`)
            validatedIssue.type = 'grammar'
          }

          // Validate that originalText matches the text at the specified positions
          if (issue.start >= 0 && issue.end > issue.start && issue.end <= text.length) {
            const textAtPosition = text.substring(issue.start, issue.end)
            
            // If originalText doesn't match the position, try to find the correct text
            if (issue.originalText && issue.originalText !== textAtPosition) {
              console.warn(`Position mismatch for issue ${validatedIssue.id}:`)
              console.warn(`Expected: "${issue.originalText}"`)
              console.warn(`Found at position: "${textAtPosition}"`)
              
              // Try to find the originalText in the document
              const correctIndex = text.indexOf(issue.originalText)
              if (correctIndex !== -1) {
                validatedIssue.start = correctIndex
                validatedIssue.end = correctIndex + issue.originalText.length
                console.warn(`Corrected positions: ${validatedIssue.start}-${validatedIssue.end}`)
              } else {
                // If we can't find the originalText, use the text at the given position
                console.warn(`Using text at position instead: "${textAtPosition}"`)
                validatedIssue.originalText = textAtPosition
              }
            } else if (!issue.originalText) {
              // If no originalText provided, use the text at the position
              validatedIssue.originalText = textAtPosition
            }
          } else {
            // Invalid positions, try to find the originalText
            if (issue.originalText) {
              const correctIndex = text.indexOf(issue.originalText)
              if (correctIndex !== -1) {
                validatedIssue.start = correctIndex
                validatedIssue.end = correctIndex + issue.originalText.length
              } else {
                console.warn(`Invalid positions and originalText not found for issue ${validatedIssue.id}`)
                return null // Filter out this issue
              }
            } else {
              console.warn(`Invalid positions and no originalText for issue ${validatedIssue.id}`)
              return null // Filter out this issue
            }
          }

          return validatedIssue
        })
        .filter(Boolean) as GrammarIssue[] // Remove null issues

      // Recalculate summary based on corrected classifications
      const correctedSummary = {
        totalIssues: grammarCheckResult.issues.length,
        grammarIssues: grammarCheckResult.issues.filter(issue => issue.type === 'grammar').length,
        spellingIssues: grammarCheckResult.issues.filter(issue => issue.type === 'spelling').length,
        styleIssues: grammarCheckResult.issues.filter(issue => issue.type === 'style').length
      }
      
      grammarCheckResult.summary = correctedSummary

      return NextResponse.json(grammarCheckResult)
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError)
      console.error("Response content:", responseContent)
      
      return NextResponse.json({ 
        error: "Invalid response format from OpenAI",
        details: responseContent 
      }, { status: 500 })
    }

  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error in grammar check:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
} 