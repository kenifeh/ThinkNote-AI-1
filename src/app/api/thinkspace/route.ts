import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { generateId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mode, inputType, outputType, transcriptId } = await request.json()

    if (!mode || !inputType || !outputType) {
      return NextResponse.json(
        { error: 'Mode, inputType, and outputType are required' },
        { status: 400 }
      )
    }

    // Validate mode
    if (!['socratic', 'study'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "socratic" or "study"' },
        { status: 400 }
      )
    }

    // Validate input/output types
    if (!['text', 'voice'].includes(inputType) || !['text', 'voice'].includes(outputType)) {
      return NextResponse.json(
        { error: 'Invalid input/output type. Must be "text" or "voice"' },
        { status: 400 }
      )
    }

    // Verify transcript belongs to user if provided
    if (transcriptId) {
      const transcript = await prisma.transcript.findFirst({
        where: { id: transcriptId, userId },
      })
      if (!transcript) {
        return NextResponse.json(
          { error: 'Transcript not found' },
          { status: 404 }
        )
      }
    }

    // Create study session
    const session = await prisma.studySession.create({
      data: {
        id: generateId(),
        mode,
        inputType,
        outputType,
        userId,
        transcriptId: transcriptId || null,
      },
    })

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        mode: session.mode,
        inputType: session.inputType,
        outputType: session.outputType,
        transcriptId: session.transcriptId,
        createdAt: session.createdAt,
      },
    })

  } catch (error) {
    console.error('ThinkSpace session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create study session' },
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

    if (sessionId) {
      // Get specific session with messages
      const session = await prisma.studySession.findFirst({
        where: { id: sessionId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
          transcript: {
            include: {
              summaries: true,
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

      return NextResponse.json({
        success: true,
        session: {
          id: session.id,
          mode: session.mode,
          inputType: session.inputType,
          outputType: session.outputType,
          transcriptId: session.transcriptId,
          createdAt: session.createdAt,
          messages: session.messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            isUser: msg.isUser,
            createdAt: msg.createdAt,
          })),
          transcript: session.transcript ? {
            content: session.transcript.content,
            wordCount: session.transcript.wordCount,
            summary: session.transcript.summaries[0]?.content,
          } : null,
        },
      })
    } else {
      // Get user's recent sessions
      const sessions = await prisma.studySession.findMany({
        where: { userId },
        include: {
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      })

      return NextResponse.json({
        success: true,
        sessions: sessions.map(session => ({
          id: session.id,
          mode: session.mode,
          inputType: session.inputType,
          outputType: session.outputType,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messageCount: session._count.messages,
        })),
      })
    }

  } catch (error) {
    console.error('ThinkSpace fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ThinkSpace data' },
      { status: 500 }
    )
  }
}
