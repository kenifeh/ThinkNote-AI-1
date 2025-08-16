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

    const { mode, title, contextId } = await request.json()

    if (!mode) {
      return NextResponse.json(
        { error: 'Mode is required' },
        { status: 400 }
      )
    }

    // Validate mode
    if (!['SOCRATIC', 'STUDY'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "SOCRATIC" or "STUDY"' },
        { status: 400 }
      )
    }

    // Get user from database using clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify lecture ownership if contextId is provided
    if (contextId) {
      const lecture = await prisma.lecture.findFirst({
        where: { id: contextId, userId: user.id },
      })
      if (!lecture) {
        return NextResponse.json(
          { error: 'Lecture not found' },
          { status: 404 }
        )
      }
    }

    // Create new thinkspace session
    const session = await prisma.thinkspaceSession.create({
      data: {
        id: generateId(),
        mode: mode as 'SOCRATIC' | 'STUDY',
        title: title || null,
        contextId: contextId || null,
        userId: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      session,
    })

  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create thinkspace session' },
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
    const mode = searchParams.get('mode')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    // Get user from database using clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (sessionId) {
      // Get specific session with messages
      const session = await prisma.thinkspaceSession.findFirst({
        where: { id: sessionId, userId: user.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
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
        session,
      })
    }

    // Get recent sessions
    const where: any = { userId: user.id }
    if (mode && ['SOCRATIC', 'STUDY'].includes(mode)) {
      where.mode = mode
    }

    const sessions = await prisma.thinkspaceSession.findMany({
      where,
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      sessions: sessions.map((session: any) => ({
        ...session,
        messageCount: session._count.messages,
      })),
    })

  } catch (error) {
    console.error('Session fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
