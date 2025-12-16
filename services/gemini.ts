import { GoogleGenAI, Type } from "@google/genai";
import { TableData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert file to Base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractTableFromImage = async (file: File): Promise<TableData> => {
  try {
    const base64Data = await fileToGenerativePart(file);

    const prompt = `
      Analyze the provided image containing tabular data.
      
      1. Extract all the data into a clean 2D array.
      2. Identify the main "Subject" of the data (e.g., "Addresses", "Names", "Phone Numbers", "Inventory", "Sales", "Grades", etc.).
         - Be specific but concise (1-2 words).
         - If the table contains mixed contact info, call it "Contacts".
      3. Provide a suggested sheet name.
      
      - Include headers as the first row.
      - Preserve numbers accurately.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sheetName: {
              type: Type.STRING,
              description: "A short, descriptive name for the excel sheet."
            },
            subject: {
              type: Type.STRING,
              description: "The category or subject of the data (e.g. 'Addresses', 'Names', 'Phone Numbers')."
            },
            data: {
              type: Type.ARRAY,
              description: "The extracted table data as a 2D array.",
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                }
              }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from AI");

    const parsed = JSON.parse(jsonText);
    
    return {
      rows: parsed.data || [],
      suggestedSheetName: parsed.sheetName || "Sheet1",
      subject: parsed.subject || "General"
    };

  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    throw new Error(error.message || "Failed to extract data from image");
  }
};

export const extractTextFromImage = async (file: File): Promise<string> => {
  try {
    const base64Data = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          { text: "Extract all legible text from this image. Preserve formatting where possible (newlines, lists)." }
        ]
      }
    });

    return response.text || "No text found.";
  } catch (error: any) {
    console.error("Gemini Text Extraction Error:", error);
    throw new Error("Failed to extract text");
  }
};

export const generateExcelFormula = async (description: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate an Excel formula for this request: "${description}". 
      Return ONLY the formula starting with =, no markdown, no explanation.`
    });
    return response.text?.trim() || "=ERROR()";
  } catch (error: any) {
    return "=ERROR(\"AI Generation Failed\")";
  }
};
