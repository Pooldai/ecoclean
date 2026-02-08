import { GoogleGenAI } from "@google/genai";

/**
 * Analyzes an image of waste using Gemini 3 Flash to identify type and priority.
 * Always initializes a new instance before use as per guidelines for reliable API key access.
 */
export const analyzeWasteImage = async (base64Image: string): Promise<string> => {
  // Always use the named parameter and process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image
            }
          },
          {
            text: "Identify the type of waste in this image (e.g., plastic, organic, construction, e-waste) and estimate the volume (small pile, large overflow, etc.). Suggest a priority level (Low, Medium, High). Keep it very brief, under 30 words."
          }
        ]
      }
    });
    
    // Access the .text property directly (not a method) as per SDK requirements
    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Analysis failed. Please check your network connection.";
  }
};
