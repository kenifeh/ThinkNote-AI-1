import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileType, fileSize } = await request.json();

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    if (fileSize > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Generate unique key for the file
    const key = `uploads/${userId}/${Date.now()}-${fileName}`;

    // Create the command for uploading
    const command = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
      Metadata: {
        userId,
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Generate signed URL (valid for 1 hour)
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return NextResponse.json({
      signedUrl,
      key,
      fields: {
        key,
        "Content-Type": fileType,
        "Content-Length": fileSize,
      },
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
