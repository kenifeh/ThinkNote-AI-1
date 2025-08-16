import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateSummary } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transcript, type = 'academic' } = await request.json()

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }

    // Validate summary type
    const allowedTypes = ['academic', 'bullet_points', 'key_concepts']
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid summary type' },
        { status: 400 }
      )
    }

    // Generate summary
    const summary = await generateSummary(transcript, type as any)

    return NextResponse.json({
      success: true,
      summary,
      type,
      wordCount: summary.split(/\s+/).length,
    })

  } catch (error) {
    console.error('Summarization error:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
