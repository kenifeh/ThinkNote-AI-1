import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { uploadFile, generateAudioKey } from '@/lib/s3'
import { transcribeAudio, generateSummary } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { generateId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    
    // Upload to DigitalOcean Spaces
    const fileUrl = await uploadFile(fileKey, buffer, file.type)

    // Process audio for transcript using OpenAI Whisper
    let transcript = ""
    try {
      transcript = await transcribeAudio(buffer)
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError)
      transcript = "Transcription failed. Please try again."
    }

    // Generate academic summary using OpenAI
    let summary = ""
    try {
      summary = await generateSummary(transcript, 'academic')
    } catch (summaryError) {
      console.error('Summary generation error:', summaryError)
      summary = "Summary generation failed. Please try again."
    }

    // Parse tags
    const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : []

    // Create ArchiveItem record
    const archiveItem = await prisma.archiveItem.create({
      data: {
        id: generateId(),
        userId,
        title: title.trim(),
        tags: tagArray,
        transcript,
        summary,
        audioUrl: fileUrl,
        audioExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
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
