import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const query = (url.searchParams.get("query") || "").trim()
  const tag = (url.searchParams.get("tag") || "all").trim().toLowerCase()
  const sortBy = (url.searchParams.get("sortBy") || "newest").toLowerCase()
  const page = Math.max(1, Number(url.searchParams.get("page") || 1))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)))
  const skip = (page - 1) * limit

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Build where clause safely
    const where: any = { userId }
    if (query) {
      // Search in title, summary, transcript
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { summary: { contains: query, mode: "insensitive" } },
        { transcript: { contains: query, mode: "insensitive" } },
      ]
    }
    if (tag && tag !== "all") {
      // tags is a string[]; use has to match one tag
      where.tags = { has: tag }
    }

    // Sort
    const orderBy =
      sortBy === "oldest"
        ? { createdAt: "asc" as const }
        : sortBy === "updated"
        ? { updatedAt: "desc" as const }
        : { createdAt: "desc" as const }

    const [items, total] = await Promise.all([
      prisma.ArchiveItem.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          tags: true,
          summary: true,
          transcript: true,
          wordCount: true,
          createdAt: true,
          updatedAt: true,
          audioUrl: true,
          expiresAt: true,
        },
      }),
      prisma.archiveItem.count({ where }),
    ])

    // Hide expired audio on response
    const now = new Date()
    const sanitized = items.map((it: any) => {
      const audioOk = it.audioUrl && it.expiresAt && new Date(it.expiresAt) > now
      return {
        ...it,
        audioUrl: audioOk ? it.audioUrl : null,
      }
    })

    // Get all unique tags from the database for this user
    const allUserItems = await prisma.archiveItem.findMany({
      where: { userId },
      select: { tags: true }
    })
    
    const allTags = new Set<string>()
    allUserItems.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => allTags.add(tag))
      }
    })

    return NextResponse.json({
      documents: sanitized,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      filters: {
        availableTags: Array.from(allTags),
        currentTag: tag,
        currentSort: sortBy,
        currentQuery: query
      }
    })
  } catch (err: any) {
    console.error("GET /api/archive failed:", {
      message: err?.message,
      stack: err?.stack,
    })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, tags, transcript, summary, audioUrl, wordCount, audioExpiresAt } = await req.json()

    if (!title || !transcript || !summary || !wordCount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create new archive item
    const archiveItem = await prisma.archiveItem.create({
      data: {
        userId,
        title,
        tags: tags || [],
        transcript,
        summary,
        audioUrl,
        wordCount,
        expiresAt: audioExpiresAt ? new Date(audioExpiresAt) : null,
      },
    })

    return NextResponse.json({
      success: true,
      archiveItem,
    })
  } catch (error) {
    console.error("POST /api/archive failed:", error)
    return NextResponse.json(
      { error: "Failed to create archive item" },
      { status: 500 }
    )
  }
}
