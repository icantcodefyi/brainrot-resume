'use client';

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useId, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { useUploadThing } from "~/utils/uploadthing";

interface PDFInfo {
  text: string;
  numPages: number;
  numRendered: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version: string;
}

interface APIResponse {
  success?: boolean;
  error?: string;
  resumeId?: string;
  fileUrl?: string;
  parsedContent?: unknown;
  rawText?: string;
}

interface UploadResponse {
  url: string;
}

export default function Home() {
  const { data: session } = useSession();
  const id = useId();
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { startUpload } = useUploadThing("resumeUploader", {
    onClientUploadComplete: () => {
      console.log("Upload completed");
    },
    onUploadError: (error: Error) => {
      console.error("Upload error:", error);
      setError(error.message);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError("");
    setPdfInfo(null);

    try {
      // 1. Upload file to UploadThing first
      const uploadResponse = await startUpload([file]) as UploadResponse[] | undefined;
      
      if (!uploadResponse?.[0]?.url) {
        throw new Error("Failed to upload file");
      }

      // 2. Send file and URL to our API for processing
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileUrl", uploadResponse[0].url);

      const response = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json() as APIResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Failed to process PDF");
      }

      if (data.parsedContent && data.rawText) {
        setPdfInfo({
          text: data.rawText,
          numPages: 1, // We'll update these later if needed
          numRendered: 1,
          info: {},
          metadata: {},
          version: "1.0",
        });
      }
    } catch (err) {
      console.error("Error processing PDF:", err);
      setError(err instanceof Error ? err.message : "Failed to process PDF");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="fixed top-0 right-0 p-4">
        {session ? (
          <Avatar className="w-10 h-10">
            <AvatarImage src={session.user?.image ?? ''} alt={session.user?.name ?? ''} />
            <AvatarFallback>{session.user?.name?.[0] ?? '?'}</AvatarFallback>
          </Avatar>
        ) : (
          <Button variant="outline" onClick={() => signIn('google')}>
            Sign in
          </Button>
        )}
      </div>

      <div className="flex flex-col items-center justify-center pt-16">
        <div className="space-y-6 w-full max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor={id}>Upload PDF</Label>
            <Input
              id={id}
              className="p-0 pe-3 file:me-3 file:border-0 file:border-e"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </div>

          {isLoading && (
            <div className="text-center">Processing PDF...</div>
          )}

          {error && (
            <div className="text-red-500 text-center">{error}</div>
          )}

          {pdfInfo && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>PDF Information:</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Number of Pages:</div>
                  <div>{pdfInfo.numPages}</div>
                  <div>Version:</div>
                  <div>{pdfInfo.version}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Extracted Text:</Label>
                <div className="p-4 border rounded-lg bg-gray-50 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                  {pdfInfo.text}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
