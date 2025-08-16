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
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "txt";

    if (!["txt", "pdf"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use 'txt' or 'pdf'" },
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
        updatedAt: true,
      },
    });

    if (!archiveItem) {
      return NextResponse.json({ error: "Archive item not found" }, { status: 404 });
    }

    if (format === "txt") {
      // Generate TXT content
      const content = `${archiveItem.title}\n\nCreated: ${new Date(archiveItem.createdAt).toLocaleDateString()}\nUpdated: ${new Date(archiveItem.updatedAt).toLocaleDateString()}\nTags: ${archiveItem.tags.join(", ")}\nWords: ${archiveItem.wordCount}\n\nTRANSCRIPT:\n${archiveItem.transcript}\n\nSUMMARY:\n${archiveItem.summary}`;
      
      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${archiveItem.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt"`,
        },
      });
    }

    if (format === "pdf") {
      // Generate PDF content
      try {
        const { PDFDocument, rgb, StandardFonts } = await import("pdfkit");
        
        const doc = new PDFDocument({
          size: "A4",
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          },
        });

        // Set up fonts
        const titleFont = StandardFonts.HelveticaBold;
        const bodyFont = StandardFonts.Helvetica;

        // Add title
        doc.font(titleFont).fontSize(24).text(archiveItem.title, { align: "center" });
        doc.moveDown(0.5);

        // Add metadata
        doc.font(bodyFont).fontSize(10).text(`Created: ${new Date(archiveItem.createdAt).toLocaleDateString()}`, { align: "left" });
        doc.text(`Updated: ${new Date(archiveItem.updatedAt).toLocaleDateString()}`, { align: "left" });
        doc.text(`Tags: ${archiveItem.tags.join(", ")}`, { align: "left" });
        doc.text(`Words: ${archiveItem.wordCount}`, { align: "left" });
        doc.moveDown(1);

        // Add transcript
        doc.font(titleFont).fontSize(16).text("TRANSCRIPT", { align: "left" });
        doc.moveDown(0.5);
        doc.font(bodyFont).fontSize(12).text(archiveItem.transcript, { align: "justify" });
        doc.moveDown(1);

        // Add summary
        doc.font(titleFont).fontSize(16).text("SUMMARY", { align: "left" });
        doc.moveDown(0.5);
        doc.font(bodyFont).fontSize(12).text(archiveItem.summary, { align: "justify" });

        // Add page numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.font(bodyFont).fontSize(10).text(
            `Page ${i + 1} of ${pages.count}`,
            doc.page.width - 100,
            doc.page.height - 50,
            { align: "center" }
          );
        }

        // Finalize PDF
        doc.end();

        // Get the PDF buffer
        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        
        return new Promise<NextResponse>((resolve) => {
          doc.on("end", () => {
            const buffer = Buffer.concat(chunks);
            resolve(
              new NextResponse(buffer, {
                headers: {
                  "Content-Type": "application/pdf",
                  "Content-Disposition": `attachment; filename="${archiveItem.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf"`,
                },
              })
            );
          });
        });
      } catch (pdfError) {
        console.error("PDF generation failed:", pdfError);
        return NextResponse.json(
          { error: "PDF generation failed" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Unsupported format" },
      { status: 400 }
    );
  } catch (error) {
    console.error("GET /api/archive/[id]/export failed:", error);
    return NextResponse.json(
      { error: "Failed to export archive item" },
      { status: 500 }
    );
  }
}
