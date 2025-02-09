import { type NextRequest, NextResponse } from "next/server";
import { getPDFInfo } from "~/server/utils/pdf-parse";
import { parseResumeWithAI } from "~/server/utils/ai-parse";
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
    const file = formData.get("file");
    const fileUrl = formData.get("fileUrl");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 }
      );
    }

    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json(
        { error: "No file URL provided" },
        { status: 400 }
      );
    }

    // 1. Get the file buffer for parsing
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 2. Extract text from PDF using the buffer
    const pdfInfo = await getPDFInfo(fileBuffer);
    
    // 3. Parse the content with AI
    const parsedResume = await parseResumeWithAI(pdfInfo.text);

    // 4. Create a new resume record with parsed content
    const resume = await db.resume.create({
      data: {
        userId: session.user.id,
        resumeUrl: fileUrl,
        title: parsedResume.personalInfo?.name ?? file.name ?? "Untitled Resume",
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
      resumeId: resume.id,
      fileUrl: fileUrl,
      parsedContent: parsedResume,
      rawText: pdfInfo.text 
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process PDF";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 