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
    if (isSelected) {
      // Classic focus rectangle (dotted)
      ctx.save();
      ctx.strokeStyle = "#000000";
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1;
      ctx.strokeRect(
        element.x * visualCellSize - 1,
        element.y * visualCellSize - 1,
        element.text.length * visualCellSize + 2,
        visualCellSize + 2,
      );
      ctx.restore();
    }

    ctx.fillStyle = "#000000";
    ctx.font = `${visualCellSize}px 'Courier New', monospace`;
    ctx.textBaseline = "top";
    for (let i = 0; i < element.text.length; i++) {
      ctx.fillText(
        element.text[i],
        (element.x + i) * visualCellSize + visualCellSize * 0.15,
        element.y * visualCellSize,
      );
    }
  },

  getBounds: (element) => ({
    left: element.x,
    top: element.y,
    right: element.x + element.text.length,
    bottom: element.y + 1,
  }),

  toAscii: (element, grid, offset) => {
    for (let i = 0; i < element.text.length; i++) {
      const x = element.x - offset.x + i;
      const y = element.y - offset.y;
      if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
        grid[y][x] = element.text[i];
      }
    }
  },
};
