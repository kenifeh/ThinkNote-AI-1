import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, format = 'pdf' } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
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
            wordCount: true,
          },
        },
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

    if (format === 'pdf') {
      // Generate PDF export
      const doc = new PDFDocument()
      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => {})

      // Add title
      doc.fontSize(24)
        .text('ThinkNote AI - Study Session Export', { align: 'center' })
        .moveDown()

      // Add session details
      doc.fontSize(14)
        .text(`Session ID: ${session.id}`)
        .text(`Mode: ${session.mode.charAt(0).toUpperCase() + session.mode.slice(1)}`)
        .text(`Input: ${session.inputType.charAt(0).toUpperCase() + session.inputType.slice(1)}`)
        .text(`Output: ${session.outputType.charAt(0).toUpperCase() + session.outputType.slice(1)}`)
        .text(`Created: ${session.createdAt.toLocaleDateString()}`)
        .moveDown()

      // Add transcript if available
      if (session.transcript) {
        doc.fontSize(16)
          .text('Study Material', { underline: true })
          .moveDown()
        doc.fontSize(12)
          .text(`Word Count: ${session.transcript.wordCount}`)
          .moveDown()
        doc.fontSize(10)
          .text(session.transcript.content.substring(0, 1000) + '...')
          .moveDown()
      }

      // Add conversation
      doc.fontSize(16)
        .text('Conversation', { underline: true })
        .moveDown()

      session.messages.forEach((message: any) => {
        const role = message.isUser ? 'You' : 'AI Assistant'
        const timestamp = message.createdAt.toLocaleTimeString()
        
        doc.fontSize(12)
          .text(`${role} (${timestamp}):`, { underline: true })
          .moveDown()
        doc.fontSize(10)
          .text(message.content)
          .moveDown()
      })

      doc.end()

      const pdfBuffer = Buffer.concat(chunks)

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="thinkspace-session-${session.id}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      })
    } else if (format === 'txt') {
      // Generate text export
      let textContent = 'ThinkNote AI - Study Session Export\n'
      textContent += '=====================================\n\n'
      textContent += `Session ID: ${session.id}\n`
      textContent += `Mode: ${session.mode}\n`
      textContent += `Input: ${session.inputType}\n`
      textContent += `Output: ${session.outputType}\n`
      textContent += `Created: ${session.createdAt.toLocaleDateString()}\n\n`

      if (session.transcript) {
        textContent += 'Study Material:\n'
        textContent += `Word Count: ${session.transcript.wordCount}\n\n`
        textContent += session.transcript.content.substring(0, 1000) + '...\n\n'
      }

      textContent += 'Conversation:\n'
      textContent += '=============\n\n'

      session.messages.forEach((message: any) => {
        const role = message.isUser ? 'You' : 'AI Assistant'
        const timestamp = message.createdAt.toLocaleTimeString()
        
        textContent += `${role} (${timestamp}):\n`
        textContent += message.content + '\n\n'
      })

      return new NextResponse(textContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="thinkspace-session-${session.id}.txt"`,
        },
      })
    } else {
      return NextResponse.json(
        { error: 'Unsupported export format. Use "pdf" or "txt"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export session' },
      { status: 500 }
    )
  }
}
