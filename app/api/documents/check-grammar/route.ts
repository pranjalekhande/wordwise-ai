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
You are a professional writing assistant. Analyze the following text for grammar, spelling, and style issues. 

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
      "originalText": "text with issue",
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

Rules:
1. Find all grammar, spelling, and style issues
2. Provide accurate character positions for start and end
3. Give 1-3 suggestions for each issue
4. Use clear, concise messages
5. Only suggest improvements that genuinely enhance the text
6. Be conservative with style suggestions - focus on clarity and correctness
7. Return valid JSON only
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
      
      // Add unique IDs if not provided
      grammarCheckResult.issues = grammarCheckResult.issues.map((issue, index) => ({
        ...issue,
        id: issue.id || `issue-${index}`
      }))

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