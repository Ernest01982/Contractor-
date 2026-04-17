import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
// The API key is automatically injected by AI Studio into process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseVoiceToQuote(transcript: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Act as a quantity surveyor. Parse this text into a JSON list of quote items.
      Text: "${transcript}"`,
      config: {
        systemInstruction: "You are a quantity surveyor. Extract job items from the text. Return a JSON array of objects. Each object should have: job_type ('Painting', 'Tiling', 'Plumbing', 'Electrical', 'General'), description (string), length (number, optional), width (number, optional), height (number, optional), sqm (number, optional), quantity (number, default 1), rate (number, optional), unit_price (number, optional), surface_type ('Wall', 'Floor', 'Ceiling/Roof', optional).",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              job_type: { type: Type.STRING },
              description: { type: Type.STRING },
              length: { type: Type.NUMBER },
              width: { type: Type.NUMBER },
              height: { type: Type.NUMBER },
              sqm: { type: Type.NUMBER },
              quantity: { type: Type.NUMBER },
              rate: { type: Type.NUMBER },
              unit_price: { type: Type.NUMBER },
              surface_type: { type: Type.STRING }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response for voice", e);
    throw e;
  }
}

export async function parseReceiptImage(base64Image: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Image.split(',')[1] // remove data:image/jpeg;base64,
            }
          },
          {
            text: "You are an expert accountant. Extract the following from this receipt image and return ONLY a valid JSON object:\n- store_name: Name of the business.\n- date: YYYY-MM-DD.\n- total_amount: The final total as a number.\n- vat_amount: The tax/VAT amount as a number (if visible, else 0).\n- category: Choose the MOST ACCURATE category from this exact list: ['Materials', 'Fuel', 'Tools', 'Subcontractors', 'Stationery', 'Meals', 'Vehicle', 'Other']."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            store_name: { type: Type.STRING },
            date: { type: Type.STRING, description: "YYYY-MM-DD format" },
            total_amount: { type: Type.NUMBER },
            vat_amount: { type: Type.NUMBER },
            category: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response for receipt", e);
    throw e;
  }
}
