import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

// This endpoint can be called by Vercel cron or external cron services
export async function GET() {
  try {
    const now = new Date();

    // Find expired audio files
    const expiredItems = await prisma.ArchiveItem.findMany({
      where: {
        audioUrl: { not: null },
        expiresAt: { lt: now },
      },
      select: {
        id: true,
        audioUrl: true,
      },
    });

    let deletedCount = 0;
    let errorCount = 0;

    for (const item of expiredItems) {
      try {
        if (item.audioUrl) {
          // Extract key from URL
          const urlParts = item.audioUrl.split('/');
          const key = urlParts.slice(-2).join('/'); // Get the last two parts for uploads/userId/filename

          // Delete from DigitalOcean Spaces
          try {
            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: process.env.DO_SPACES_BUCKET!,
                Key: key,
              })
            );
          } catch (s3Error) {
            console.warn(`Failed to delete S3 object ${key}:`, s3Error);
            // Continue with database update even if S3 deletion fails
          }

          // Update database to remove audioUrl
          await prisma.ArchiveItem.update({
            where: { id: item.id },
            data: { audioUrl: null },
          });

          deletedCount++;
        }
      } catch (error) {
        console.error(`Error processing item ${item.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      errorCount,
      totalProcessed: expiredItems.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error during cleanup:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
