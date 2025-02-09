import { type NextRequest, NextResponse } from "next/server";
import { getPDFInfo } from "~/server/utils/pdf-parse";
import { parseResumeWithAI } from "~/server/utils/ai-parse";
import { writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { db } from "~/server/db";
import { auth } from "~/server/auth";

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const resumeId = formData.get("resumeId") as string;

    if (!file || !resumeId) {
      return NextResponse.json(
        { error: "No file or resumeId provided" },
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
    
    // Parse the content with AI
    const parsedResume = await parseResumeWithAI(pdfInfo.text);

    // Update the resume with extracted content and structured sections
    await db.resume.update({
      where: { id: resumeId },
      data: {
        rawContent: pdfInfo.text,
        sections: {
          create: [
            {
              type: "personal_info",
              title: "Personal Information",
              content: JSON.stringify(parsedResume.personalInfo),
              order: 0
            },
            {
              type: "education",
              title: "Education",
              content: JSON.stringify(parsedResume.education),
              order: 1
            },
            {
              type: "experience",
              title: "Experience",
              content: JSON.stringify(parsedResume.experience),
              order: 2
            },
            {
              type: "skills",
              title: "Skills",
              content: JSON.stringify(parsedResume.skills),
              order: 3
            },
            ...(parsedResume.projects ? [{
              type: "projects",
              title: "Projects",
              content: JSON.stringify(parsedResume.projects),
              order: 4
            }] : [])
          ]
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      parsedContent: parsedResume,
      rawText: pdfInfo.text 
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
} 