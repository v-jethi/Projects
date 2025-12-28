/**
 * EXAMPLE: How to use the AI itinerary generator
 * 
 * This file shows you exactly how to call the AI and get an itinerary.
 * You can use this as a reference or test it directly.
 * 
 * To test this:
 * 1. Make sure you have OPENAI_API_KEY in your .env.local file
 * 2. Run: npx ts-node src/lib/ai-example.ts
 * (You may need to install ts-node: npm install -D ts-node)
 */

import { generateItinerary, validateAPIKey } from './ai';
import { ItineraryInput } from '@/types';

async function example() {
  try {
    // Step 1: Validate that we have an API key
    console.log('Validating API key...');
    validateAPIKey();
    console.log('✅ API key found\n');

    // Step 2: Create example input (this is what a user would provide)
    const userInput: ItineraryInput = {
      destination: 'Tokyo, Japan',
      startDate: '2024-06-01',
      endDate: '2024-06-05',
      duration: 5,
      budget: {
        min: 500,
        max: 1500,
        currency: 'USD'
      },
      travelStyle: 'mid-range',
      groupSize: 2,
      interests: ['food', 'culture', 'technology'],
      dietaryRestrictions: ['vegetarian'],
      allergies: ['shellfish'],
      flightDetails: {
        arrival: '2024-06-01T10:00:00',
        departure: '2024-06-05T18:00:00',
        airport: 'Narita International Airport'
      }
    };

    console.log('Generating itinerary for:', userInput.destination);
    console.log('This may take 30-60 seconds...\n');

    // Step 3: Call the AI to generate the itinerary
    const itinerary = await generateItinerary(userInput);

    // Step 4: Display the results
    console.log('✅ Itinerary Generated Successfully!\n');
    console.log('='.repeat(60));
    console.log(`Destination: ${itinerary.destination}`);
    console.log(`Duration: ${itinerary.days.length} days`);
    console.log(`Estimated Cost: ${userInput.budget?.currency} ${itinerary.estimatedCost}`);
    console.log('='.repeat(60));
    console.log('\n');

    // Show each day
    itinerary.days.forEach(day => {
      console.log(`\n📅 Day ${day.dayNumber} - ${day.date}`);
      console.log(`Total Cost: ${userInput.budget?.currency} ${day.totalCost}`);
      console.log('-'.repeat(60));
      
      day.activities.forEach(activity => {
        console.log(`\n  ${activity.startTime} - ${activity.endTime} | ${activity.name}`);
        console.log(`  Type: ${activity.type}`);
        console.log(`  Location: ${activity.location.name}`);
        console.log(`  Address: ${activity.location.address}`);
        console.log(`  Cost: ${userInput.budget?.currency} ${activity.cost}`);
        if (activity.description) {
          console.log(`  Description: ${activity.description.substring(0, 100)}...`);
        }
      });
    });

    console.log('\n\n✅ Example completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
  }
}

// Uncomment the line below to run this example
// example();

export { example };

