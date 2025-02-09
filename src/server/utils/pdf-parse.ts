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
 * Extracts text content from a PDF file
 * @param filePath Path to the PDF file
 * @returns Promise containing the extracted text
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
    try {
        // Read the PDF file
        const dataBuffer = readFileSync(filePath);
        
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
 * Extended version that returns more PDF information
 * @param filePath Path to the PDF file
 * @returns Promise containing PDF data including text, number of pages, metadata, etc.
 */
export async function getPDFInfo(filePath: string) {
    try {
        const dataBuffer = readFileSync(filePath);
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
