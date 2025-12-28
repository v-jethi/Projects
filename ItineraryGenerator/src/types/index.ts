// Type definitions for our itinerary system

export interface ItineraryInput {
  destination: string;
  duration: number; // number of days (required)
  startDate?: string; // ISO date string (YYYY-MM-DD) - optional
  endDate?: string; // ISO date string (YYYY-MM-DD) - optional
  budget?: {
    min: number;
    max: number;
    currency: string; // e.g., "USD", "EUR", "JPY"
  };
  flightDetails?: {
    arrival: string; // ISO datetime string
    departure: string; // ISO datetime string
    airport: string;
  };
  dietaryRestrictions?: string[]; // e.g., ["vegetarian", "vegan", "halal"]
  allergies?: string[]; // e.g., ["peanuts", "shellfish"]
  interests?: string[]; // e.g., ["history", "food", "nature", "art"]
  travelStyle?: 'budget' | 'mid-range' | 'luxury';
  groupSize?: number;
  accessibility?: string[]; // e.g., ["wheelchair accessible"]
  comments?: string; // Add this line
}

export interface Activity {
  id: string;
  name: string;
  type: 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'event';
  location: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  duration: number; // in minutes
  cost: number; // in the specified currency
  description: string;
  rating?: number; // 1-5
  imageUrl?: string;
  notes?: string;
}

export interface DayPlan {
  date: string; // ISO date string
  dayNumber: number;
  activities: Activity[];
  totalCost: number;
  totalTravelTime: number; // in minutes
  notes?: string;
}

export interface Itinerary {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: DayPlan[];
  totalBudget: number;
  estimatedCost: number;
  createdAt: string;
  userPreferences: ItineraryInput;
}

