import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { mode } = await request.json();

    if (!["study", "socratic"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Use 'study' or 'socratic'" },
        { status: 400 }
      );
    }

    // Fetch the archive item
    const archiveItem = await prisma.ArchiveItem.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        title: true,
        tags: true,
        transcript: true,
        summary: true,
        wordCount: true,
        createdAt: true,
      },
    });

    if (!archiveItem) {
      return NextResponse.json({ error: "Archive item not found" }, { status: 404 });
    }

    // Create a ThinkSpace session with the archive content
    let sessionData: any = {
      userId,
      title: `Study Session: ${archiveItem.title}`,
      mode,
      sourceArchiveId: id,
      createdAt: new Date(),
    };

    if (mode === "study") {
      // Study mode: include full transcript and summary
      sessionData.content = {
        transcript: archiveItem.transcript,
        summary: archiveItem.summary,
        tags: archiveItem.tags,
        wordCount: archiveItem.wordCount,
      };
    } else {
      // Socratic mode: include only title and keywords
      sessionData.content = {
        title: archiveItem.title,
        tags: archiveItem.tags,
        keywords: archiveItem.tags.join(", "),
      };
    }

    // TODO: Create ThinkSpace session in database
    // For now, just return success with the prepared data
    console.log("Preparing ThinkSpace session:", sessionData);

    return NextResponse.json({
      success: true,
      sessionData,
      message: `Content sent to ThinkSpace in ${mode} mode`,
    });
  } catch (error) {
    console.error("POST /api/archive/[id]/send-to-thinkspace failed:", error);
    return NextResponse.json(
      { error: "Failed to send to ThinkSpace" },
      { status: 500 }
    );
  }
}
