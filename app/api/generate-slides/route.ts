import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Template structures
const templateStructures = {
  NEWS: {
    1: { type: "hook", prompt: "Create an attention-grabbing headline that summarizes the main news" },
    2: { type: "key_points", prompt: "Extract 3-4 main facts, statistics, or key points as bullet points" },
    3: { type: "context", prompt: "Provide background information and context" },
    4: { type: "implications", prompt: "Explain what this means and why it matters" },
    5: { type: "cta", prompt: "Create a call-to-action encouraging engagement" }
  },
  STORY: {
    1: { type: "hook", prompt: "Create a compelling opening scene or question" },
    2: { type: "setup", prompt: "Set the scene with context, background, and setting" },
    3: { type: "challenge", prompt: "Describe the main problem, conflict, or obstacle" },
    4: { type: "resolution", prompt: "Explain how the challenge was solved or overcome" },
    5: { type: "takeaway", prompt: "Share the key lesson learned or insight gained" }
  },
  PRODUCT: {
    1: { type: "problem", prompt: "Identify the pain point or need your audience faces" },
    2: { type: "solution", prompt: "Explain how your product solves this problem" },
    3: { type: "features", prompt: "Highlight key product capabilities and features" },
    4: { type: "benefits", prompt: "Focus on concrete benefits users will experience" },
    5: { type: "cta", prompt: "Create a compelling call-to-action for purchase/signup" }
  }
}

// Instagram character limits
const instagramLimits = {
  title: 60,
  content: 180,
  hashtags: 30,
  total: 2200
}

// Split text intelligently
function intelligentTextSplit(text: string, slideCount: number): string[] {
  const cleanText = text.trim().replace(/\s+/g, ' ')
  const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim())
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim())
  
  if (paragraphs.length >= slideCount) {
    // Distribute paragraphs
    const segments = []
    const itemsPerSlide = Math.ceil(paragraphs.length / slideCount)
    
    for (let i = 0; i < slideCount; i++) {
      const start = i * itemsPerSlide
      const end = Math.min(start + itemsPerSlide, paragraphs.length)
      segments.push(paragraphs.slice(start, end).join('\n\n'))
    }
    return segments
  } else {
    // Group sentences
    const targetLength = Math.floor(cleanText.length / slideCount)
    const segments = []
    let currentSegment = ""
    
    sentences.forEach((sentence) => {
      if (currentSegment.length + sentence.length > targetLength && currentSegment.length > 0) {
        segments.push(currentSegment.trim())
        currentSegment = sentence
      } else {
        currentSegment += (currentSegment ? '. ' : '') + sentence
      }
    })
    
    if (currentSegment) {
      segments.push(currentSegment.trim())
    }
    
    // Ensure we have exactly slideCount segments
    while (segments.length < slideCount) {
      segments.push(segments[segments.length - 1] || cleanText)
    }
    
    return segments.slice(0, slideCount)
  }
}

// Generate slide content using OpenAI
async function generateSlideContent(
  prompt: string,
  sourceText: string,
  templateType: string,
  slideNumber: number,
  totalSlides: number
): Promise<{ title: string; content: string }> {
  try {
    const systemPrompt = `You are an expert Instagram carousel content creator. Generate engaging, concise content optimized for Instagram.

IMPORTANT CONSTRAINTS:
- Title: Maximum ${instagramLimits.title} characters
- Content: Maximum ${instagramLimits.content} characters
- Use emojis appropriately
- Make content engaging and actionable
- Keep sentences short and punchy

Template type: ${templateType}
Slide ${slideNumber} of ${totalSlides}`

    const userPrompt = `${prompt}

Source content: "${sourceText}"

Generate:
1. A catchy title (max ${instagramLimits.title} chars)
2. Main content (max ${instagramLimits.content} chars)

Format your response as JSON:
{
  "title": "Your title here",
  "content": "Your content here"
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const response = completion.choices[0]?.message?.content?.trim()
    if (!response) {
      throw new Error("No response from OpenAI")
    }

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(response)
      return {
        title: parsed.title?.substring(0, instagramLimits.title) || `Slide ${slideNumber}`,
        content: parsed.content?.substring(0, instagramLimits.content) || "Content generated here..."
      }
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.warn("Failed to parse OpenAI JSON response, using fallback")
      return {
        title: `Slide ${slideNumber}`,
        content: response.substring(0, instagramLimits.content)
      }
    }
  } catch (error) {
    console.error("Error generating slide content:", error)
    // Return fallback content
    return {
      title: `Slide ${slideNumber}`,
      content: `Generated content for ${templateType.toLowerCase()} slide ${slideNumber}...`
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    
    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { source_text, template_type, slide_count, project_id } = body

    // Validation
    if (!source_text || typeof source_text !== 'string' || source_text.trim().length < 50) {
      return NextResponse.json({ error: "Source text must be at least 50 characters long" }, { status: 400 })
    }

    if (!template_type || !['NEWS', 'STORY', 'PRODUCT'].includes(template_type)) {
      return NextResponse.json({ error: "Template type must be NEWS, STORY, or PRODUCT" }, { status: 400 })
    }

    if (!slide_count || typeof slide_count !== 'number' || slide_count < 3 || slide_count > 10) {
      return NextResponse.json({ error: "Slide count must be between 3 and 10" }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured")
      return NextResponse.json({ 
        error: "AI service not configured", 
        message: "Please configure OpenAI API key" 
      }, { status: 500 })
    }

    console.log(`Generating ${slide_count} slides for ${template_type} template...`)

    // Split source text into segments
    const textSegments = intelligentTextSplit(source_text, slide_count)
    const templateStructure = templateStructures[template_type as keyof typeof templateStructures]
    
    // Generate slides
    const slides = []
    for (let i = 1; i <= slide_count; i++) {
      const slideInfo = templateStructure[i as keyof typeof templateStructure] || templateStructure[5] // Fallback to CTA
      const relevantText = textSegments[i - 1] || source_text
      
      const { title, content } = await generateSlideContent(
        slideInfo.prompt,
        relevantText,
        template_type,
        i,
        slide_count
      )
      
      slides.push({
        slide_number: i,
        title,
        content,
        slide_type: slideInfo.type
      })
    }

    console.log(`Successfully generated ${slides.length} slides`)

    return NextResponse.json({ 
      slides,
      success: true,
      message: `Generated ${slides.length} slides for ${template_type} template`
    })

  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error in POST /api/generate-slides:", error)
    return NextResponse.json({ 
      error: "Failed to generate slides", 
      message: "An error occurred during slide generation",
      success: false,
      details: process.env.NODE_ENV === 'development' ? error : undefined 
    }, { status: 500 })
  }
} 