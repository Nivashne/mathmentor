import { GoogleGenAI } from "@google/genai";
import { fileToBase64 } from '../utils';

const SYSTEM_INSTRUCTION = `You are MathGPT, a friendly and expert math tutor AI. Your goal is to help users understand and solve math problems. When a user provides a math problem (either as text or in an image), provide a clear, step-by-step solution. Break down the problem into smaller, easy-to-understand parts. Explain the underlying concepts and formulas used. Always explain the 'why' behind each step, not just the 'how'. Your goal is to teach, not just to give answers. Format your response using clear headings, bullet points, and newlines for readability. For equations, represent them clearly on new lines. Do not use complex Markdown that requires a special renderer; use plain text formatting that is easy to read.`;

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

// FIX: Added TextPart interface to correctly type text-based parts for the Gemini API.
interface TextPart {
  text: string;
}

interface ImagePart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

export const solveMathProblem = async (prompt: string, imageFile?: File): Promise<string> => {
  try {
    // FIX: Corrected the type of the 'parts' array. For multipart content, each part must be an object.
    // The previous type '(string | ImagePart)[]' was incorrect because `{ text: prompt }` is not a string.
    const parts: (TextPart | ImagePart)[] = [{ text: prompt }];

    if (imageFile) {
      const base64Data = await fileToBase64(imageFile);
      parts.unshift({
        inlineData: {
          mimeType: imageFile.type,
          data: base64Data,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `An error occurred: ${error.message}. Please check your API key and network connection.`;
    }
    return "An unknown error occurred while trying to solve the problem.";
  }
};