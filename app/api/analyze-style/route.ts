import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { requireAuth } from "@/lib/auth"
import type { StyleSuggestion } from "@/lib/types"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface StyleAnalysisResponse {
  suggestions: StyleSuggestion[]
  summary: {
    totalSuggestions: number
    emphasisSuggestions: number
    hashtagSuggestions: number
    emojiSuggestions: number
    mentionSuggestions: number
    structureSuggestions: number
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    
    const { content, template_type = "STORY" } = await request.json()

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Content is required and must be at least 10 characters long" },
        { status: 400 }
      )
    }

    if (content.trim().length < 10) {
      return NextResponse.json({ error: "Content too short for analysis" }, { status: 400 })
    }

    // Validate template_type
    if (template_type && !['NEWS', 'STORY', 'PRODUCT'].includes(template_type)) {
      return NextResponse.json({ error: "Invalid template_type. Must be NEWS, STORY, or PRODUCT" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OpenAI API key not configured" 
      }, { status: 500 })
    }

    const templateGuidelines = {
      NEWS: {
        focus: "breaking news format with hook, facts, context, and implications",
        style: "professional, authoritative, clear",
        hashtags: "news-related, current events, trending topics",
        structure: "headline → key facts → context → implications"
      },
      STORY: {
        focus: "narrative storytelling with hook, setup, challenge, resolution",
        style: "engaging, relatable, emotional connection",
        hashtags: "story-related, personal development, inspiration",
        structure: "hook → setup → challenge → resolution → takeaway"
      },
      PRODUCT: {
        focus: "problem-solution format with features, benefits, and CTA",
        style: "persuasive, benefit-focused, action-oriented",
        hashtags: "product-related, problem-solving, benefits",
        structure: "problem → solution → features → benefits → call-to-action"
      }
    }

    const guidelines = templateGuidelines[template_type as keyof typeof templateGuidelines] || templateGuidelines.STORY

    const prompt = `Analyze this Instagram carousel slide content and provide specific styling suggestions to improve engagement and readability.

CONTENT TO ANALYZE:
"${content}"

TEMPLATE TYPE: ${template_type}
FOCUS: ${guidelines.focus}
STYLE: ${guidelines.style}
HASHTAG STRATEGY: ${guidelines.hashtags}
STRUCTURE: ${guidelines.structure}

INSTAGRAM OPTIMIZATION GUIDELINES:
- Character limit: 180 characters optimal for readability
- Use **bold** for key emphasis (markdown format)
- Use *italic* for subtle emphasis
- Hashtags should be relevant and specific
- Emojis should enhance, not overwhelm
- Structure should guide the reader's eye

PROVIDE SUGGESTIONS IN THIS EXACT JSON FORMAT:
{
  "suggestions": [
    {
      "id": "unique-id",
      "type": "emphasis|hashtag|emoji|mention|structure",
      "original": "exact text from content",
      "suggestion": "improved version",
      "reason": "explanation of why this improves engagement",
      "confidence": 0.0-1.0,
      "position": { "start": 0, "end": 10 }
    }
  ]
}

SUGGESTION TYPES:
1. **emphasis** - Bold/italic formatting for key phrases
2. **hashtag** - Relevant hashtags to add
3. **emoji** - Strategic emoji placement
4. **mention** - @mentions for engagement
5. **structure** - Line breaks, spacing, or reordering

RULES:
- Provide 2-5 specific suggestions
- Focus on ${template_type} template optimization
- Suggest hashtags relevant to the content theme
- Suggest emojis that match the tone
- Only suggest realistic improvements
- Confidence should reflect how certain you are the suggestion will improve engagement

Analyze the content and provide actionable suggestions:`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert Instagram content strategist specializing in ${template_type} template optimization. You analyze content and provide specific, actionable styling suggestions that improve engagement and readability. Always respond with valid JSON matching the exact format requested.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const responseContent = completion.choices[0]?.message?.content

    if (!responseContent) {
      return NextResponse.json(
        { error: "Failed to generate style suggestions" },
        { status: 500 }
      )
    }

    try {
      // Parse the JSON response from OpenAI
      const styleAnalysisResult = JSON.parse(responseContent)
      
      // Validate and enhance suggestions
      const validatedSuggestions = (styleAnalysisResult.suggestions || [])
        .map((suggestion: any, index: number) => ({
          id: suggestion.id || `suggestion-${Date.now()}-${index}`,
          type: suggestion.type || "structure",
          suggestion: suggestion.suggestion || "",
          original: suggestion.original || "",
          reason: suggestion.reason || "Improves engagement",
          confidence: Math.min(Math.max(suggestion.confidence || 0.7, 0.1), 1.0),
          position: suggestion.position || { start: 0, end: 0 }
        }))
        .filter((suggestion: StyleSuggestion) => 
          suggestion.suggestion && suggestion.original && suggestion.reason
        )
        .slice(0, 5) // Limit to 5 suggestions max

      // Calculate summary
      const summary = {
        totalSuggestions: validatedSuggestions.length,
        emphasisSuggestions: validatedSuggestions.filter((s: StyleSuggestion) => s.type === 'emphasis').length,
        hashtagSuggestions: validatedSuggestions.filter((s: StyleSuggestion) => s.type === 'hashtag').length,
        emojiSuggestions: validatedSuggestions.filter((s: StyleSuggestion) => s.type === 'emoji').length,
        mentionSuggestions: validatedSuggestions.filter((s: StyleSuggestion) => s.type === 'mention').length,
        structureSuggestions: validatedSuggestions.filter((s: StyleSuggestion) => s.type === 'structure').length,
      }

      const response: StyleAnalysisResponse = {
        suggestions: validatedSuggestions,
        summary
      }

      return NextResponse.json(response)
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError)
      console.error("Raw response:", responseContent)
      
      return NextResponse.json(
        { error: "Failed to parse style analysis results" },
        { status: 500 }
      )
    }

  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Style analysis error:", error)
    return NextResponse.json(
      { error: "Failed to analyze style" },
      { status: 500 }
    )
  }
} 