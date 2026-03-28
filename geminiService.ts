import { GoogleGenAI } from "@google/genai";

/**
 * Analyzes an image of waste using Gemini 3 Flash to identify type and priority.
 * Always initializes a new instance before use as per guidelines for reliable API key access.
 */
export const analyzeWasteImage = async (base64Image: string): Promise<string> => {
  // Use import.meta.env or process.env fallback for Vite compatibility
  const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY as string) || (process.env as any).VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY is not defined in env");
    return "Analysis failed: API Key missing.";
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image
            }
          },
          {
            text: "Does this image contain litter, trash, or garbage in a public space? If NO, respond ONLY with the exact word 'NOT_GARBAGE'. If YES, briefly identify the type of waste, volume (e.g., small pile), and priority (Low, Medium, High). Keep the description under 20 words."
          }
        ]
      }
    });
    
    const text = response.text;
    if (text && text.includes('NOT_GARBAGE')) return 'NOT_GARBAGE';
    return text || "No analysis available.";
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    return `Analysis failed: ${error.message || "Unknown error"}. Please check your network connection.`;
  }
};
