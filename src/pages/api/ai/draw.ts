import { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, geminiKey, currentElements } = req.body;

  if (!geminiKey) {
    return res.status(401).json({ error: "Gemini API Key is required. Please provide it in settings." });
  }

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    const systemInstruction = `
      You are an ASCII Art Generator specialized in creating structural diagrams.
      You MUST output ONLY a valid JSON array of new elements to be added. 
      No conversational text, no markdown code blocks. Just the raw JSON array.

      CURRENT CANVAS STATE:
      ${JSON.stringify(currentElements || [], null, 2)}

      Use this state to:
      1. Avoid overlapping existing boxes.
      2. Connect new elements to existing ones if requested.
      3. Maintain the current layout's scale and style.

      Available Element Types & Parameters:
      - { "type": "box", "x": number, "y": number, "params": { "width": number, "height": number } }
      - { "type": "text", "x": number, "y": number, "params": { "text": string } }
      - { "type": "line", "x": number, "y": number, "params": { "x2": number, "y2": number } }
      - { "type": "vector", "x": number, "y": number, "params": { "x2": number, "y2": number } }
      
      VIRTUAL TYPE (HIGHLY RECOMMENDED FOR LABELS):
      - { "type": "labeled_box", "x": number, "y": number, "params": { "width": number, "height": number, "text": string } }
        Use this to automatically center text inside a box. The API handles the math for you.

      Coordinate System:
      - x: Columns (0-100)
      - y: Rows (0-50)
      - (0,0) is top-left.
    `;

    const result = await model.generateContent([systemInstruction, prompt]);
    const responseText = result.response.text();

    // Clean up potential markdown blocks if the model ignored instructions
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const cleanJson = jsonMatch ? jsonMatch[0] : responseText;

    try {
      const rawElements = JSON.parse(cleanJson);
      const expandedElements = [];

      for (const el of rawElements) {
        if (el.type === "labeled_box") {
          const { x, y, params } = el;
          const { width, height, text } = params;
          
          // 1. Add the box
          expandedElements.push({
            type: "box",
            x, y,
            params: { width, height }
          });

          // 2. Add the centered text
          // Math: Box starts at x. Internal space starts at x+1.
          // Center X = x + floor((width - text_length) / 2)
          // Center Y = y + floor(height / 2)
          const textX = x + Math.floor((width - text.length) / 2);
          const textY = y + Math.floor(height / 2);

          expandedElements.push({
            type: "text",
            x: textX,
            y: textY,
            params: { text }
          });
        } else {
          expandedElements.push(el);
        }
      }

      return res.status(200).json({ elements: expandedElements });
    } catch (e) {
      console.error("AI Output parsing error:", responseText);
      return res.status(500).json({ error: "AI generated an invalid command set. Try rephrasing." });
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to communicate with Gemini" });
  }
}
