import { GoogleGenAI, Type } from "@google/genai";
import { Trip, ActivityType } from '../types';
import { v4 as uuidv4 } from 'uuid'; // Note: In a real env without uuid lib, we use a helper. Since I can't add deps, I'll use a helper below.

const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateItinerary = async (destination: string, days: number, budget: string, interests: string): Promise<Trip> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prompt logic
  const prompt = `Create a detailed ${days}-day travel itinerary for a trip to ${destination}. 
  Budget level: ${budget}. 
  Interests: ${interests}.
  The start date should be tomorrow.
  Provide structured data including specific activities, times, and types.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          destination: { type: Type.STRING },
          startDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayNumber: { type: Type.INTEGER },
                date: { type: Type.STRING, description: "YYYY-MM-DD format" },
                activities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING, description: "e.g. 09:00 AM" },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      type: { type: Type.STRING, enum: Object.values(ActivityType) },
                      location: { type: Type.STRING }
                    },
                    required: ["time", "title", "type"]
                  }
                }
              },
              required: ["dayNumber", "date", "activities"]
            }
          }
        },
        required: ["destination", "startDate", "days"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  const data = JSON.parse(text);

  // Hydrate with IDs since AI doesn't generate UUIDs reliably
  const trip: Trip = {
    id: generateId(),
    destination: data.destination,
    cities: [data.destination], // Default to destination
    startDate: data.startDate,
    endDate: data.days[data.days.length - 1].date,
    budgetBRL: 0, // Placeholder
    currencies: [{ code: 'USD', rateToBRL: 5.5 }], // Default currency
    expenses: [],
    documents: [],
    notes: `Generated itinerary for ${destination} (${budget} budget). Interests: ${interests}`,
    days: data.days.map((d: any) => ({
      ...d,
      id: generateId(),
      activities: d.activities.map((a: any) => ({
        ...a,
        id: generateId()
      }))
    }))
  };

  return trip;
};