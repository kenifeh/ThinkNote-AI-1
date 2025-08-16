import { NextRequest, NextResponse } from 'next/server'
import type { Flashcard } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { messages, context, options } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    if (!context || !context.transcript || !context.summary) {
      return NextResponse.json(
        { success: false, error: 'Study context required' },
        { status: 400 }
      )
    }

    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    const lastUserMessage = messages[messages.length - 1]?.content || ''
    const generateFlashcards = options?.generateFlashcards || false

    let response: string
    let flashcards: Flashcard[] = []

    // Extract keywords/themes from context (mock implementation)
    const keywords = ['learning', 'understanding', 'concepts', 'knowledge', 'study']
    
    // Generate contextual response
    if (lastUserMessage.toLowerCase().includes('flashcard') || generateFlashcards) {
      response = "I've analyzed your study material and generated some flashcards to help you review. Here are the key concepts:"
      
      flashcards = [
        {
          id: '1',
          question: 'What are the main themes discussed in this material?',
          answer: 'The material covers learning strategies, understanding concepts, and effective study methods.',
          context: context.sourceFile || 'Study Material'
        },
        {
          id: '2',
          question: 'How can you apply these concepts to your own learning?',
          answer: 'Consider how these strategies relate to your current study habits and areas for improvement.',
          context: context.sourceFile || 'Study Material'
        },
        {
          id: '3',
          question: 'What questions do you still have about this topic?',
          answer: 'Reflect on what aspects need clarification and what you would like to explore further.',
          context: context.sourceFile || 'Study Material'
        }
      ]
    } else {
      // Generate contextual questions based on the material
      const contextualQuestions = [
        `Based on what you've shared about ${context.sourceFile}, what's your biggest insight so far?`,
        `Looking at this material, how does it connect to what you already know?`,
        `From the context you provided, what questions does this raise for you?`,
        `Based on your study materials, what's one thing you'd like to explore further?`,
        `From what you've shared, how would you explain this concept to someone else?`
      ]
      
      response = contextualQuestions[Math.floor(Math.random() * contextualQuestions.length)]
      
      // Add checkpoint every ~3 turns
      if (messages.length % 3 === 0) {
        response += "\n\nPause—what's your biggest insight so far?"
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        response,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        flashcards: generateFlashcards ? flashcards : undefined,
        keywords
      }
    })
  } catch (error) {
    console.error('Study API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
