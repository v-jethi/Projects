/**
 * AI Itinerary Generator
 * 
 * This file handles communication with OpenAI's GPT-4 model to generate
 * personalized travel itineraries based on user input.
 * 
 * IMPORTANT: We're NOT training an AI here. Instead, we're using OpenAI's
 * pre-trained GPT-4 model via their API. This is much more practical and
 * doesn't require massive datasets or computing power.
 */

import OpenAI from 'openai';
import { ItineraryInput, Itinerary, DayPlan, Activity } from '@/types';

// Initialize the OpenAI client
// This will use the OPENAI_API_KEY from your environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Main function to generate an itinerary using AI
 * 
 * @param input - User's travel preferences and requirements
 * @returns A complete itinerary with day-by-day plans
 */
export async function generateItinerary(input: ItineraryInput): Promise<Itinerary> {
  // Step 1: Build a detailed prompt for the AI
  const prompt = buildDetailedPrompt(input);
  
  console.log('Sending request to OpenAI...');
  
  // Step 2: Send the prompt to OpenAI's GPT-4 model
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", // Using GPT-4 Turbo for best results
    messages: [
      {
        role: "system",
        content: `You are an expert travel planner with deep knowledge of destinations worldwide. 
Your job is to create detailed, realistic, and practical travel itineraries.

IMPORTANT GUIDELINES:
- Always consider actual travel time between locations
- Respect opening hours and operating times
- Account for meal times and rest periods
- Consider the user's budget constraints
- Respect dietary restrictions and allergies
- Make activities realistic and not overly packed
- Include specific addresses and locations
- Provide accurate time estimates
- Consider the travel style (budget/mid-range/luxury)
- Make each day balanced and enjoyable

Return ONLY valid JSON matching the exact structure specified.`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    // Request JSON format for structured output
    response_format: { type: "json_object" },
    temperature: 0.7, // Balance between creativity (1.0) and consistency (0.0)
    max_tokens: 2000, // Maximum response length
  });

  console.log('Received response from OpenAI');
  
  // Step 3: Parse the AI's response
  const rawContent = response.choices[0].message.content;
  
  if (!rawContent) {
    throw new Error('No response from AI');
  }

  // Clean up the response to extract a valid JSON string
  const cleanedContent = cleanJsonString(rawContent);

  let itineraryData: any;
  try {
    itineraryData = JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error);
    console.error('Raw response content:', rawContent);
    console.error('Cleaned response content:', cleanedContent);
    throw new Error('AI returned data in an unexpected format. Please try again.');
  }

  // Step 4: Transform the AI's response into our structured format
  const itinerary = transformAIResponse(itineraryData, input);
  
  return itinerary;
}

/**
 * Builds a detailed prompt for the AI based on user input
 * The better the prompt, the better the AI's response!
 */
function buildDetailedPrompt(input: ItineraryInput): string {
  const parts: string[] = [];

  // Basic trip information
  parts.push(`Create a detailed ${input.duration}-day travel itinerary for ${input.destination}.`);
  parts.push(`\nTrip Dates: ${input.startDate} to ${input.endDate}`);

  // Budget information
  if (input.budget) {
    parts.push(`\nBudget: ${input.budget.currency} ${input.budget.min.toLocaleString()} - ${input.budget.max.toLocaleString()}`);
    parts.push(`Please ensure the total estimated cost stays within this range.`);
  } else {
    parts.push(`\nBudget: Flexible (but please provide cost estimates for all activities)`);
  }

  // Travel style
  if (input.travelStyle) {
    parts.push(`\nTravel Style: ${input.travelStyle}`);
    if (input.travelStyle === 'budget') {
      parts.push(`- Focus on free/low-cost activities, budget accommodations, and local food`);
    } else if (input.travelStyle === 'luxury') {
      parts.push(`- Include premium experiences, high-end restaurants, and luxury accommodations`);
    }
  }

  // Group size
  if (input.groupSize) {
    parts.push(`\nGroup Size: ${input.groupSize} ${input.groupSize === 1 ? 'person' : 'people'}`);
  }

  // Flight details
  if (input.flightDetails) {
    parts.push(`\nFlight Information:`);
    parts.push(`- Arrival: ${input.flightDetails.arrival} at ${input.flightDetails.airport}`);
    parts.push(`- Departure: ${input.flightDetails.departure} from ${input.flightDetails.airport}`);
    parts.push(`- Plan Day 1 activities considering arrival time and potential jet lag`);
    parts.push(`- Plan the last day considering departure time`);
  }

  // Dietary restrictions
  if (input.dietaryRestrictions && input.dietaryRestrictions.length > 0) {
    parts.push(`\nDietary Restrictions: ${input.dietaryRestrictions.join(', ')}`);
    parts.push(`- All restaurant recommendations must accommodate these restrictions`);
  }

  // Allergies
  if (input.allergies && input.allergies.length > 0) {
    parts.push(`\nFood Allergies: ${input.allergies.join(', ')}`);
    parts.push(`- CRITICAL: Avoid any restaurants or foods containing these allergens`);
  }

  // Interests
  if (input.interests && input.interests.length > 0) {
    parts.push(`\nInterests: ${input.interests.join(', ')}`);
    parts.push(`- Prioritize activities and attractions that match these interests`);
  }

  // Accessibility
  if (input.accessibility && input.accessibility.length > 0) {
    parts.push(`\nAccessibility Requirements: ${input.accessibility.join(', ')}`);
    parts.push(`- Ensure all recommended locations are accessible`);
  }

  // Output format requirements
  parts.push(`\n\nOUTPUT REQUIREMENTS:`);
  parts.push(`Return a JSON object with this exact structure:`);
  parts.push(`{
  "destination": "${input.destination}",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dayNumber": 1,
      "activities": [
        {
          "name": "Activity name",
          "type": "attraction|restaurant|hotel|transport|event",
          "location": {
            "name": "Location name",
            "address": "Full address"
          },
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "duration": 120,
          "cost": 0,
          "description": "Detailed description",
          "notes": "Optional notes"
        }
      ],
      "totalCost": 0,
      "totalTravelTime": 0,
      "notes": "Day overview"
    }
  ],
  "estimatedCost": 0
}`);

  parts.push(`\nIMPORTANT:`);
  parts.push(`- Include realistic times (consider opening hours, travel time between locations)`);
  parts.push(`- Provide specific addresses for all locations`);
  parts.push(`- Calculate accurate costs in ${input.budget?.currency || 'USD'}`);
  parts.push(`- Make sure activities flow logically (don't jump across the city randomly)`);
  parts.push(`- Include meal times (breakfast, lunch, dinner)`);
  parts.push(`- Allow time for rest and flexibility`);
  parts.push(`- For Day 1, account for arrival time and potential fatigue`);
  parts.push(`- For the last day, account for departure time`);

  return parts.join('\n');
}

/**
 * Transforms the AI's JSON response into our structured Itinerary type
 * This adds IDs, validates data, and ensures proper formatting
 */
function transformAIResponse(aiData: any, input: ItineraryInput): Itinerary {
  // Generate a unique ID for this itinerary
  const itineraryId = `itinerary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Transform days
  const days: DayPlan[] = (aiData.days || []).map((day: any, index: number) => {
    // Transform activities
    const activities: Activity[] = (day.activities || []).map((activity: any) => ({
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: activity.name || 'Unnamed Activity',
      type: activity.type || 'attraction',
      location: {
        name: activity.location?.name || 'Unknown Location',
        address: activity.location?.address || 'Address not provided',
        coordinates: activity.location?.coordinates,
      },
      startTime: activity.startTime || '09:00',
      endTime: activity.endTime || '10:00',
      duration: activity.duration || 60,
      cost: activity.cost || 0,
      description: activity.description || '',
      rating: activity.rating,
      imageUrl: activity.imageUrl,
      notes: activity.notes,
    }));

    return {
      date: day.date || input.startDate,
      dayNumber: day.dayNumber || index + 1,
      activities,
      totalCost: day.totalCost || activities.reduce((sum: number, a: Activity) => sum + a.cost, 0),
      totalTravelTime: day.totalTravelTime || 0,
      notes: day.notes,
    };
  });

  // Calculate total estimated cost
  const estimatedCost = aiData.estimatedCost || 
    days.reduce((sum, day) => sum + day.totalCost, 0);

  return {
    id: itineraryId,
    destination: aiData.destination || input.destination,
    startDate: input.startDate,
    endDate: input.endDate,
    days,
    totalBudget: input.budget?.max || 0,
    estimatedCost,
    createdAt: new Date().toISOString(),
    userPreferences: input,
  };
}

/**
 * Attempts to extract a valid JSON object string from an AI response.
 * Handles cases where the model wraps JSON in markdown code fences
 * or includes extra text before/after the JSON.
 */
function cleanJsonString(content: string): string {
  let text = content.trim();

  // If wrapped in markdown code fences ```json ... ``` or ``` ... ```
  if (text.startsWith('```')) {
    // Remove leading ```json or ``` and trailing ```
    text = text.replace(/^```json\s*/i, '');
    text = text.replace(/^```\s*/i, '');
    text = text.replace(/```$/i, '').trim();
  }

  // Try to extract the substring from first { to last }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }

  return text;
}

/**
 * Helper function to validate that we have an API key
 */
export function validateAPIKey(): boolean {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is not set in environment variables. ' +
      'Please create a .env.local file with: OPENAI_API_KEY=your_key_here'
    );
  }
  return true;
}

