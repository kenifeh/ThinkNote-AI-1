import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

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
        updatedAt: true,
        audioUrl: true,
        expiresAt: true,
      },
    });

    if (!archiveItem) {
      return NextResponse.json({ error: "Archive item not found" }, { status: 404 });
    }

    // Check if audio is still valid
    const now = new Date();
    const audioOk = archiveItem.audioUrl && archiveItem.expiresAt && new Date(archiveItem.expiresAt) > now;
    
    const sanitizedItem = {
      ...archiveItem,
      audioUrl: audioOk ? archiveItem.audioUrl : null,
    };

    return NextResponse.json(sanitizedItem);
  } catch (error) {
    console.error("GET /api/archive/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch archive item" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { title, tags } = await request.json();

    if (!title && !tags) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingItem = await prisma.ArchiveItem.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Archive item not found" }, { status: 404 });
    }

    // Update the item
    const updatedItem = await prisma.ArchiveItem.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(tags && { tags: Array.isArray(tags) ? tags : [] }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        tags: true,
        transcript: true,
        summary: true,
        wordCount: true,
        createdAt: true,
        updatedAt: true,
        audioUrl: true,
        expiresAt: true,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("PATCH /api/archive/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update archive item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Verify ownership
    const existingItem = await prisma.ArchiveItem.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        audioUrl: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Archive item not found" }, { status: 404 });
    }

    // Delete from DigitalOcean Spaces if audio exists
    if (existingItem.audioUrl) {
      try {
        // Extract key from URL
        const urlParts = existingItem.audioUrl.split('/');
        const key = urlParts.slice(-2).join('/'); // Get the last two parts for uploads/userId/filename

        // Import s3Client dynamically to avoid build issues
        const { s3Client } = await import("@/lib/s3");
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.DO_SPACES_BUCKET!,
            Key: key,
          })
        );
      } catch (s3Error) {
        console.warn(`Failed to delete S3 object for item ${id}:`, s3Error);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    // Delete from database
    await prisma.ArchiveItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/archive/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete archive item" },
      { status: 500 }
    );
  }
}
