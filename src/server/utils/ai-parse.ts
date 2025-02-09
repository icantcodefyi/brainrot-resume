import { generateObject } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';

const model = google('gemini-2.0-flash');

// Define our resume schema using Zod
const resumeSchema = z.object({
  personalInfo: z.object({
    name: z.string().describe('Full name of the person'),
    email: z.string().describe('Email address of the person'),
    phone: z.string().optional().describe('Phone number if available'),
    location: z.string().optional().describe('Location/address if available'),
    linkedIn: z.string().optional().describe('LinkedIn profile URL if available')
  }).describe('Personal information section'),
  
  education: z.array(z.object({
    institution: z.string().describe('Name of the educational institution'),
    degree: z.string().describe('Degree or certification obtained'),
    date: z.string().describe('Date of graduation or period of study'),
    gpa: z.string().optional().describe('GPA if available')
  })).describe('Education history'),
  
  experience: z.array(z.object({
    company: z.string().describe('Company name'),
    position: z.string().describe('Job title/position'),
    startDate: z.string().describe('Start date of employment'),
    endDate: z.string().describe('End date of employment or "Present"'),
    highlights: z.array(z.string()).describe('Key achievements and responsibilities')
  })).describe('Work experience history'),
  
  skills: z.object({
    technical: z.array(z.string()).describe('Technical/hard skills'),
    soft: z.array(z.string()).describe('Soft/interpersonal skills')
  }).describe('Skills section'),
  
  projects: z.array(z.object({
    name: z.string().describe('Project name'),
    description: z.string().describe('Project description'),
    technologies: z.array(z.string()).describe('Technologies used in the project')
  })).optional().describe('Notable projects')
});

export type ParsedResume = z.infer<typeof resumeSchema>;

export async function parseResumeWithAI(content: string): Promise<ParsedResume> {
  try {
    const { object, experimental_providerMetadata } = await generateObject({
      model,
      schema: resumeSchema,
      prompt: `Parse the following resume content into structured data. Extract all relevant information including personal details, education, work experience, skills, and projects if available. Make sure to maintain chronological order for education and experience sections.

Resume content:
${content}`,
      schemaName: 'Resume',
      schemaDescription: 'A structured representation of a resume with personal information, education, experience, skills, and projects.'
    });

    // Validate the object against our schema
    const parsed = resumeSchema.parse(object);

    // Log safety ratings if available
    if (experimental_providerMetadata?.google) {
      console.log('Safety Ratings:', experimental_providerMetadata.google.safetyRatings);
    }

    return parsed;
  } catch (error) {
    console.error("Error parsing resume with AI:", error);
    throw new Error("Failed to parse resume content");
  }
} 