/**
 * API Route: Generate Itinerary
 * 
 * This is a Next.js API route that handles POST requests to generate
 * travel itineraries using AI.
 * 
 * Endpoint: /api/generate-itinerary
 * Method: POST
 * Body: ItineraryInput (JSON)
 * Response: Itinerary (JSON)
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

import OpenAI from 'openai';
import { validateAPIKey, generateItinerary } from '@/lib/ai';
import { itineraryToPdf, textToPdf } from '@/lib/pdf';
import { ItineraryInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Step 1: Validate API key is set
    try {
      validateAPIKey();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'API key not configured',
          message: error instanceof Error ? error.message : 'OPENAI_API_KEY is not set in environment variables'
        },
        { status: 500 }
      );
    }

    // Step 2: Parse the request body (user input)
    let input: ItineraryInput;
    try {
      const body = await request.json();
      input = body;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // If caller provided rawText (already generated AI response), we allow bypassing duration validation
    const bodyAny = input as any;
    const hasRawText = Boolean(bodyAny && typeof bodyAny.rawText === 'string' && bodyAny.rawText.length > 0);

    // Validate duration only when rawText is not provided
    if (!hasRawText) {
      if (!input.duration || input.duration < 1) {
        return NextResponse.json(
          { error: 'Missing or invalid duration. Please provide a number of days (1 or more).' },
          { status: 400 }
        );
      }
    }

    // If the client requests a PDF (format=pdf), generate structured itinerary and return PDF
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || '';

    if (format.toLowerCase() === 'pdf' || request.headers.get('accept')?.includes('application/pdf')) {
      // If client supplied the raw AI text, render that directly into the PDF
      if (hasRawText) {
        const raw = (input as any).rawText as string;
        const title = (input as any).destination || 'Itinerary';
        const pdfBuffer = await textToPdf(raw, title);

        return new Response(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Length': String(pdfBuffer.length),
            'Content-Disposition': `attachment; filename="${((title || 'itinerary').split(',')[0].trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-]/g, '') || 'itinerary')}-itinerary.pdf"`,
          },
        });
      }

      // Otherwise, use structured generator to create an itinerary and render it
      const itinerary = await generateItinerary(input as ItineraryInput);
      const pdfBuffer = await itineraryToPdf(itinerary);

      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': String(pdfBuffer.length),
          'Content-Disposition': `attachment; filename="${((itinerary.destination || 'itinerary').split(',')[0].trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-]/g, '') || 'itinerary')}-itinerary.pdf"`,
        },
      });
    }

    // Otherwise, continue returning a plain-text version for quick display
    console.log(`Generating plain-text itinerary for ${input.destination} (${input.duration} days)...`);

    // Build a simple plain-text prompt from user input
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = buildPlainTextPrompt(input);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner. Create clear, human-readable itineraries as plain text. Do NOT use JSON, code blocks, or markdown, just formatted text and make the text easy to read and understand. Format the text such that each day is seperated into categories, such as Food, Sightseeing, and any other Interests that the input has specifcally mentioned.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const text = completion.choices[0].message.content || '';
    console.log('Plain-text itinerary response:', text);

    // Return plain text so the frontend can display it directly
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Error generating itinerary:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      // Check if it's an OpenAI API error
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            error: 'OpenAI API error',
            message: 'Invalid or missing API key. Please check your OPENAI_API_KEY in .env.local'
          },
          { status: 401 }
        );
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.'
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to generate itinerary',
          message: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Build a simple plain-text prompt using the user's input
function buildPlainTextPrompt(input: ItineraryInput): string {
  const lines: string[] = [];

  lines.push(`Create a detailed, realistic travel itinerary as plain text.`);
  lines.push(`Destination: ${input.destination}`);
  lines.push(`Number of days: ${input.duration}`);

  if (input.budget) {
    lines.push(
      `Budget range: ${input.budget.currency} ${input.budget.min} - ${input.budget.max}`
    );
  }

  if (input.travelStyle) {
    lines.push(`Travel style: ${input.travelStyle}`);
  }

  if (input.groupSize) {
    lines.push(`Group size: ${input.groupSize} ${input.groupSize === 1 ? 'person' : 'people'}`);
  }

  if (input.dietaryRestrictions && input.dietaryRestrictions.length > 0) {
    lines.push(`Dietary restrictions: ${input.dietaryRestrictions.join(', ')}`);
  }

  if (input.allergies && input.allergies.length > 0) {
    lines.push(`Allergies (avoid these): ${input.allergies.join(', ')}`);
  }

  if (input.interests && input.interests.length > 0) {
    lines.push(`Interests and preferences: ${input.interests.join(', ')}`);
  }

  if (input.comments && input.comments.trim().length > 0) {
    lines.push(`Additional comments and special requests: ${input.comments.trim()}`);
  }

  lines.push('');
  lines.push(`IMPORTANT: You MUST create a detailed itinerary for ALL ${input.duration} days. Do not skip any days.`);
  lines.push('');
  lines.push('Formatting requirements:');
  lines.push('- Return ONLY plain text, no JSON, no code blocks, no markdown.');
  lines.push(`- Organize the itinerary day by day (Day 1 through Day ${input.duration}).`);
  lines.push(`- You MUST cover all ${input.duration} days with detailed activities.`);
  lines.push('- For each day, include morning, afternoon, and evening activities.');
  lines.push('- Mention approximate times (e.g., 9:00 AM, 2:00 PM).');
  lines.push('- Include short descriptions and why each spot is interesting.');
  lines.push('- Include at least one food/restaurant suggestion per day that respects dietary restrictions and allergies.');
  lines.push('- Consider realistic travel time between places and avoid jumping across the city too much.');
  lines.push('- Stay within the budget range when suggesting activities and food.');

  return lines.join('\n');
}

// Handle GET requests (for testing/health check)
export async function GET() {
  return NextResponse.json({
    message: 'Itinerary Generator API',
    endpoint: '/api/generate-itinerary',
    method: 'POST',
    requiredFields: ['destination', 'duration'],
    optionalFields: ['budget', 'flightDetails', 'dietaryRestrictions', 'allergies', 'interests', 'travelStyle', 'groupSize', 'accessibility']
  });
}

