
import { GoogleGenAI } from "@google/genai";

// Always initialize GoogleGenAI with the process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeWasteImage = async (base64Image: string): Promise<string> => {
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
    // Use the .text property to access the generated text content.
    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Analysis failed.";
  }
};
