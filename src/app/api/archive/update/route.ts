import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId, title, tags } = await request.json()

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Verify archive item ownership
    const archiveItem = await prisma.archiveItem.findFirst({
      where: { id: documentId, userId },
    })

    if (!archiveItem) {
      return NextResponse.json(
        { error: 'Archive item not found' },
        { status: 404 }
      )
    }

    // Update archive item title if provided
    if (title !== undefined && title !== archiveItem.title) {
      await prisma.archiveItem.update({
        where: { id: documentId },
        data: { title: title.trim() },
      })
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Validate tags array
      if (Array.isArray(tags)) {
        const validTags = tags
          .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
          .map(tag => tag.trim())
        
        await prisma.archiveItem.update({
          where: { id: documentId },
          data: { tags: validTags },
        })
      }
    }

    // Fetch updated archive item
    const updatedItem = await prisma.archiveItem.findFirst({
      where: { id: documentId },
    })

    return NextResponse.json({
      success: true,
      archiveItem: updatedItem,
    })

  } catch (error) {
    console.error('Archive update error:', error)
    return NextResponse.json(
      { error: 'Failed to update archive item' },
      { status: 500 }
    )
  }
}
