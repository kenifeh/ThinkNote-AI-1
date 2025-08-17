import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { uploadFile, generateAudioKey } from '@/lib/s3'
import { prisma } from '@/lib/prisma'
import { generateId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists in database
    let user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      // Create user if they don't exist
      user = await prisma.user.create({
        data: {
          id: userId,
        }
      })
      console.log('Created new user:', userId)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const tags = formData.get('tags') as string

    if (!file || !title) {
      return NextResponse.json(
        { error: 'File and title are required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp4', 'audio/m4a', 'audio/ogg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only audio files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 50MB allowed.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Generate unique key for DO Spaces
    const fileKey = generateAudioKey(userId, file.name)
    
    // Temporarily bypass DigitalOcean upload for testing
    let fileUrl = "temp://" + fileKey; // Temporary URL for testing
    
    try {
      // Try to upload to DigitalOcean Spaces
      fileUrl = await uploadFile(fileKey, buffer, file.type)
    } catch (uploadError) {
      console.error('DigitalOcean upload failed, using temporary URL:', uploadError)
      // Continue with temporary URL for testing transcription
    }

    // Process audio for transcript and summary using our new system
    let transcript = ""
    let summary = ""
    
    try {
      // Create a FormData to send to our transcription endpoint
      const transcriptionFormData = new FormData()
      transcriptionFormData.append('audio', new Blob([buffer], { type: file.type }), file.name)
      transcriptionFormData.append('summarize', 'true')

      // Call our transcription endpoint
      const transcriptionResponse = await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/audio/transcribe-summarize`, {
        method: 'POST',
        body: transcriptionFormData,
      })

      if (transcriptionResponse.ok) {
        const transcriptionResult = await transcriptionResponse.json()
        console.log('Transcription response:', transcriptionResult)
        transcript = transcriptionResult.transcript || "Transcription completed but no text generated."
        summary = transcriptionResult.summary || "Summary generation completed but no summary generated."
        console.log('Extracted transcript:', transcript)
        console.log('Extracted summary:', summary)
      } else {
        throw new Error(`Transcription failed: ${transcriptionResponse.statusText}`)
      }
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError)
      transcript = "Transcription failed. Please try again."
      summary = "Summary generation failed. Please try again."
    }

    // Parse tags
    const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : []

    // Create ArchiveItem record
    const archiveItem = await prisma.archiveItem.create({
      data: {
        userId,
        title: title.trim(),
        tags: tagArray,
        transcript,
        summary,
        audioUrl: fileUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        wordCount: transcript.split(/\s+/).length,
      },
    })

    return NextResponse.json({
      success: true,
      archiveItem: {
        id: archiveItem.id,
        title: archiveItem.title,
        tags: archiveItem.tags,
        transcript,
        summary,
        audioUrl: archiveItem.audioUrl,
        createdAt: archiveItem.createdAt,
      },
      wordCount: transcript.split(/\s+/).length,
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload and process file' },
      { status: 500 }
    )
  }
}
