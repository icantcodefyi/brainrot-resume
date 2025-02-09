import { type NextRequest, NextResponse } from "next/server";
import { getPDFInfo } from "~/server/utils/pdf-parse";
import { writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Check if file is PDF
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    // Create a temporary file path
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save to temporary file
    const tempPath = join(tmpdir(), `upload-${Date.now()}.pdf`);
    await writeFile(tempPath, buffer);

    // Extract text from PDF
    const pdfInfo = await getPDFInfo(tempPath);

    return NextResponse.json(pdfInfo);
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
} 


