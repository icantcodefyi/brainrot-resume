import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

const f = createUploadthing();

export const uploadRouter = {
  resumeUploader: f({ pdf: { maxFileSize: "8MB" } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new Error("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Create the resume record in the database
      const resume = await db.resume.create({
        data: {
          userId: metadata.userId,
          title: file.name,
          resumeUrl: file.url,
          rawContent: "",
        },
      });

      return { resumeId: resume.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter; 