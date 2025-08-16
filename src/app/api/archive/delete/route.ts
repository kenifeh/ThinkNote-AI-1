import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId } = await request.json()

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

    // Delete from database
    await prisma.archiveItem.delete({
      where: { id: documentId },
    })

    return NextResponse.json({
      success: true,
      message: 'Archive item deleted successfully',
    })

  } catch (error) {
    console.error('Archive delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete archive item' },
      { status: 500 }
    )
  }
}
