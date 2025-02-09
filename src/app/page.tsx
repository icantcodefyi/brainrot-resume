'use client';

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useId, useState } from "react";

interface PDFInfo {
  text: string;
  numPages: number;
  numRendered: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version: string;
}

interface APIResponse {
  error?: string;
  text?: string;
  numPages?: number;
  numRendered?: number;
  info?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  version?: string;
}

export default function Home() {
  const id = useId();
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError("");
    setPdfInfo(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json() as APIResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to process PDF");
      }

      if (!data.text) {
        throw new Error("No text content found in PDF");
      }

      setPdfInfo({
        text: data.text,
        numPages: data.numPages ?? 0,
        numRendered: data.numRendered ?? 0,
        info: data.info ?? {},
        metadata: data.metadata ?? {},
        version: data.version ?? ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
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
  );
}
