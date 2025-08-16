import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1]?.content || ''
    
    // Count how many times user has asked for direct answers
    const userInsistCount = messages.filter(msg => 
      msg.role === 'user' && 
      (msg.content.toLowerCase().includes('just tell me') || 
       msg.content.toLowerCase().includes('give me the answer') ||
       msg.content.toLowerCase().includes('stop asking questions'))
    ).length

    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    let response: string

    if (userInsistCount >= 3) {
      // After 3+ insists, offer a short definition then ask follow-up
      response = "Alright, here's a brief definition: [concept] is [simple definition]. Now, what's one example of this that you've seen in your own life?"
    } else {
      // Generate Socratic questions based on the user's message
      const questions = [
        "That's an interesting point! What makes you think that?",
        "Hmm, let me ask you something: how would you define that concept?",
        "Interesting perspective! Can you give me an example of what you mean?",
        "That's a great question to explore. What evidence do you have for that?",
        "I'm curious about your reasoning. Can you walk me through your thought process?",
        "What do you think would happen if the opposite were true?",
        "How does this connect to other things you've learned?",
        "What questions does this raise for you?",
        "Can you think of a counter-example to that?",
        "What assumptions are you making here?"
      ]
      
      response = questions[Math.floor(Math.random() * questions.length)]
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        response,
        role: 'assistant',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Socratic API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
