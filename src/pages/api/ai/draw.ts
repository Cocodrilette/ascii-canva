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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `
      You are an Expert ASCII Architecture Generator.
      You MUST output ONLY a valid JSON array of new elements to be added. 
      No conversational text, no markdown code blocks. Just the raw JSON array.

      CURRENT CANVAS STATE:
      ${JSON.stringify(currentElements || [], null, 2)}

      Use this state to:
      1. Avoid overlapping existing boxes.
      2. Connect new elements to existing ones if requested.
      3. Maintain the current layout's scale and style.

      Available Base Element Types:
      - { "type": "box", "x": number, "y": number, "params": { "width": number, "height": number } }
      - { "type": "text", "x": number, "y": number, "params": { "text": string } }
      - { "type": "line", "x": number, "y": number, "params": { "x2": number, "y2": number } }
      
      VIRTUAL MACRO TYPES (HIGHLY RECOMMENDED FOR COMPLEX SYSTEMS):
      Use these macros to build complex architectures quickly. The system will auto-expand them.

      1. Labeled Box
      - { "type": "labeled_box", "x": number, "y": number, "params": { "width": number, "height": number, "text": string } }
      
      2. Database Node
      - { "type": "database", "x": number, "y": number, "params": { "name": string } }
      
      3. Server/Service Node
      - { "type": "server", "x": number, "y": number, "params": { "name": string } }
      
      4. Arrow/Connection (Auto-draws line and > tip)
      - { "type": "arrow", "x": number, "y": number, "params": { "x2": number, "y2": number, "label": string | null } }

      5. Linear Architecture Flow (Auto-draws connected boxes)
      - { "type": "flow", "x": number, "y": number, "params": { "nodes": ["Client", "API", "DB"], "direction": "horizontal" | "vertical", "spacing": number } }

      Coordinate System:
      - x: Columns (0-200)
      - y: Rows (0-100)
      - (0,0) is top-left.
      - Default box width is usually 12-16, height 5-7. Leave enough spacing (e.g., 10-20 units) between nodes.
    `;

    const result = await model.generateContent([systemInstruction, prompt]);
    const responseText = result.response.text();

    // Clean up potential markdown blocks if the model ignored instructions
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const cleanJson = jsonMatch ? jsonMatch[0] : responseText;

    try {
      const rawElements = JSON.parse(cleanJson);
      const expandedElements = [];

      const generateId = () => Math.random().toString(36).substr(2, 9);

      for (const el of rawElements) {
        if (el.type === "labeled_box") {
          const { x, y, params } = el;
          const { width, height, text } = params;
          expandedElements.push({ type: "box", x, y, params: { width, height } });
          const textX = x + Math.floor((width - text.length) / 2);
          const textY = y + Math.floor(height / 2);
          expandedElements.push({ type: "text", x: textX, y: textY, params: { text } });
        } 
        else if (el.type === "database") {
          const { x, y, params } = el;
          const { name } = params;
          const width = Math.max(14, name.length + 4);
          const height = 7;
          expandedElements.push({ type: "box", x, y, params: { width, height } });
          expandedElements.push({ type: "text", x: x + 2, y: y + 1, params: { text: "___" } });
          expandedElements.push({ type: "text", x: x + 1, y: y + 2, params: { text: "/   \\" } });
          expandedElements.push({ type: "text", x: x + Math.floor((width - name.length) / 2), y: y + 4, params: { text: name } });
        }
        else if (el.type === "server") {
          const { x, y, params } = el;
          const { name } = params;
          const width = Math.max(16, name.length + 6);
          const height = 5;
          expandedElements.push({ type: "box", x, y, params: { width, height } });
          expandedElements.push({ type: "text", x: x + 2, y: y + 1, params: { text: "[SERVER]" } });
          expandedElements.push({ type: "text", x: x + Math.floor((width - name.length) / 2), y: y + 3, params: { text: name } });
        }
        else if (el.type === "arrow") {
          const { x, y, params } = el;
          const { x2, y2, label } = params;
          
          // Use NATIVE vector type which handles arrowheads automatically
          expandedElements.push({ 
            type: "vector", 
            x, y, 
            params: { x2, y2 } 
          });

          // Draw label in the middle if provided
          if (label) {
            const midX = Math.floor((x + x2) / 2);
            const midY = Math.floor((y + y2) / 2);
            expandedElements.push({ type: "text", x: midX - Math.floor(label.length/2), y: midY - 1, params: { text: label } });
          }
        }
        else if (el.type === "flow") {
          const { x, y, params } = el;
          const { nodes, direction, spacing = 15 } = params;
          const isHorizontal = direction !== "vertical";
          
          let currentX = x;
          let currentY = y;
          const boxWidth = 16;
          const boxHeight = 5;

          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            
            // Draw Box
            expandedElements.push({ type: "box", x: currentX, y: currentY, params: { width: boxWidth, height: boxHeight } });
            
            // Draw Text
            const textX = currentX + Math.floor((boxWidth - node.length) / 2);
            const textY = currentY + Math.floor(boxHeight / 2);
            expandedElements.push({ type: "text", x: textX, y: textY, params: { text: node } });

            // Draw Connection to next using native VECTOR
            if (i < nodes.length - 1) {
              if (isHorizontal) {
                const lineStartX = currentX + boxWidth;
                const lineStartY = currentY + Math.floor(boxHeight / 2);
                expandedElements.push({ 
                  type: "vector", 
                  x: lineStartX, 
                  y: lineStartY, 
                  params: { x2: lineStartX + spacing, y2: lineStartY } 
                });
                currentX += boxWidth + spacing;
              } else {
                const lineStartX = currentX + Math.floor(boxWidth / 2);
                const lineStartY = currentY + boxHeight;
                expandedElements.push({ 
                  type: "vector", 
                  x: lineStartX, 
                  y: lineStartY, 
                  params: { x2: lineStartX, y2: lineStartY + spacing } 
                });
                currentY += boxHeight + spacing;
              }
            }
          }
        }
        else {
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
