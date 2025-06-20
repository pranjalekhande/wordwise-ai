import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { requireAuth } from "@/lib/auth"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Simplified suggestion interface
export interface Suggestion {
  id: string
  content: string
  char_count: number
  tone?: string
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const { original_content } = await request.json()
    
    if (!original_content || original_content.trim().length < 10) {
      return NextResponse.json({ error: "Content too short for suggestions" }, { status: 400 })
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OpenAI API key not configured" 
      }, { status: 500 })
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
            char_count: cleanContent.length,
            tone: tone
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