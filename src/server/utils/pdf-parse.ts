import { readFileSync } from 'fs';
import pdfParse from 'pdf-parse';

interface PDFInfo {
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    version: string;
}

/**
 * Extracts text content from a PDF file or buffer
 * @param input Path to PDF file, URL, or Buffer containing PDF data
 * @returns Promise containing the extracted text
 */
export async function extractTextFromPDF(input: string | Buffer): Promise<string> {
    try {
        const dataBuffer = await getDataBuffer(input);
        
        // Parse the PDF
        const data = await pdfParse(dataBuffer) as PDFInfo;
        
        // Return the extracted text
        return data.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Helper function to get buffer from various input types
 */
async function getDataBuffer(input: string | Buffer): Promise<Buffer> {
    if (Buffer.isBuffer(input)) {
        return input;
    }

    if (input.startsWith('http://') || input.startsWith('https://')) {
        const response = await fetch(input);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF from URL: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    // Assume it's a local file path
    return readFileSync(input);
}

/**
 * Extended version that returns more PDF information
 * @param input Path to PDF file, URL, or Buffer containing PDF data
 * @returns Promise containing PDF data including text, number of pages, metadata, etc.
 */
export async function getPDFInfo(input: string | Buffer) {
    try {
        const dataBuffer = await getDataBuffer(input);
        const data = await pdfParse(dataBuffer) as PDFInfo;
        
        return {
            text: data.text,
            numPages: data.numpages,
            numRendered: data.numrender,
            info: data.info,
            metadata: data.metadata,
            version: data.version
        };
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
