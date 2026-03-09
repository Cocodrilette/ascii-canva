import { Type } from "lucide-react";
import type { AsciiExtension, BaseElement } from "../types";

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
}

export interface TextParams {
  text?: string;
}

export const textExtension: AsciiExtension<TextElement, TextParams> = {
  type: "text",
  label: "Text",
  icon: Type,

  create: (x: number, y: number, params?: TextParams) => ({
    id: Math.random().toString(36).substr(2, 9),
    type: "text",
    text: params?.text || "NEW TEXT",
    x,
    y,
  }),

  render: (ctx, element, isSelected, visualCellSize) => {
    const lines = element.text.split("\n");
    const maxLineLength = Math.max(...lines.map(l => l.length), 0);
    
    if (isSelected) {
      // Classic focus rectangle (dotted)
      ctx.save();
      ctx.strokeStyle = "#000000";
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1;
      ctx.strokeRect(
        element.x * visualCellSize - 1,
        element.y * visualCellSize - 1,
        maxLineLength * visualCellSize + 4,
        lines.length * visualCellSize + 2,
      );
      ctx.restore();
    }

    ctx.fillStyle = "#000000";
    ctx.font = `${visualCellSize}px 'Courier New', monospace`;
    ctx.textBaseline = "top";
    
    lines.forEach((line, lineIdx) => {
      for (let i = 0; i < line.length; i++) {
        ctx.fillText(
          line[i],
          (element.x + i) * visualCellSize + visualCellSize * 0.15,
          (element.y + lineIdx) * visualCellSize,
        );
      }
    });
  },

  getBounds: (element) => {
    const lines = element.text.split("\n");
    const maxLineLength = Math.max(...lines.map(l => l.length), 0);
    return {
      left: element.x,
      top: element.y,
      right: element.x + maxLineLength,
      bottom: element.y + lines.length,
    };
  },

  toAscii: (element, grid, offset) => {
    const lines = element.text.split("\n");
    lines.forEach((line, lineIdx) => {
      for (let i = 0; i < line.length; i++) {
        const x = element.x - offset.x + i;
        const y = element.y - offset.y + lineIdx;
        if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
          grid[y][x] = line[i];
        }
      }
    });
  },
};
