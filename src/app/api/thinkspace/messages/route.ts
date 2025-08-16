import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { generateId } from '@/lib/utils'
import { generateStudyQuestions } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, message, mode } = await request.json()

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      )
    }

    // Verify session ownership
    const session = await prisma.studySession.findFirst({
      where: { id: sessionId, userId },
      include: {
        transcript: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Create user message
    const userMessage = await prisma.studyMessage.create({
      data: {
        id: generateId(),
        content: message.trim(),
        isUser: true,
        sessionId,
      },
    })

    // Generate AI response based on mode
    let aiResponse = ''
    
    if (mode === 'socratic') {
      // Socratic mode: Generate questions to explore the topic
      if (session.transcriptId && session.transcript) {
        // Use transcript context for Socratic questioning
        aiResponse = await generateStudyQuestions(session.transcript.content, 'socratic')
      } else {
        // General Socratic questioning without context
        aiResponse = `That's an interesting question! Let me help you explore this further. What specific aspects of "${message}" would you like to understand better? Consider:\n\n- What assumptions underlie this idea?\n- How does this connect to what you already know?\n- What evidence would support or challenge this?\n- What are the implications of this concept?`
      }
    } else {
      // Study mode: Provide educational guidance
      if (session.transcriptId && session.transcript) {
        // Use transcript context for study guidance
        aiResponse = `Based on the study material, here's what I understand about "${message}":\n\n${session.transcript.content.substring(0, 200)}...\n\nWould you like me to:\n- Explain specific concepts in more detail?\n- Generate practice questions?\n- Create a summary of key points?\n- Help you connect this to other topics?`
      } else {
        // General study guidance without context
        aiResponse = `Great question for study mode! To help you learn effectively, I'd recommend:\n\n- Breaking down the concept into smaller parts\n- Looking for real-world examples\n- Practicing with similar problems\n- Testing your understanding with questions\n\nWhat specific aspect would you like to focus on?`
      }
    }

    // Create AI response message
    const aiMessage = await prisma.studyMessage.create({
      data: {
        id: generateId(),
        content: aiResponse,
        isUser: false,
        sessionId,
      },
    })

    return NextResponse.json({
      success: true,
      messages: [
        {
          id: userMessage.id,
          content: userMessage.content,
          isUser: userMessage.isUser,
          createdAt: userMessage.createdAt,
        },
        {
          id: aiMessage.id,
          content: aiMessage.content,
          isUser: aiMessage.isUser,
          createdAt: aiMessage.createdAt,
        },
      ],
    })

  } catch (error) {
    console.error('Message creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Verify session ownership
    const session = await prisma.studySession.findFirst({
      where: { id: sessionId, userId },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get messages for the session
    const messages = await prisma.studyMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      messages,
    })

  } catch (error) {
    console.error('Message fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
