import { GoogleGenAI } from "@google/genai";

export const analyzeWasteImage = async (base64Image: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API key is missing.");
    return "API Key missing. Please configure environment variables.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
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
    
    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Analysis failed. Please check your API key and network connection.";
  }
};