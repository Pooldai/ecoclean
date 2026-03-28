import { GoogleGenAI } from "@google/genai";

/**
 * Analyzes an image of waste using Gemini 3 Flash to identify type and priority.
 * Always initializes a new instance before use as per guidelines for reliable API key access.
 */
export const analyzeWasteImage = async (base64Image: string): Promise<string> => {
  const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY as string) || (process.env as any).VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY is not defined");
    return "Analysis failed: API Key missing.";
  }

  // Use direct fetch to bypass SDK issues
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Does this image contain litter, trash, or garbage in a public space? If NO, respond ONLY with the exact word 'NOT_GARBAGE'. If YES, briefly identify the type of waste, volume (e.g., small pile), and priority (Low, Medium, High). Keep the description under 20 words." },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image.split(",")[1] || base64Image,
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API request failed");
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text && text.includes("NOT_GARBAGE")) return "NOT_GARBAGE";
    return text || "No analysis available.";
  } catch (error: any) {
    console.error("Gemini fetch error:", error);
    return `Analysis failed: ${error.message || "Unknown error"}. Please check your network connection.`;
  }
};
