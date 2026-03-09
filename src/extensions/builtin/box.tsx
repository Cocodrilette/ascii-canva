import { Square } from "lucide-react";
import type { AsciiExtension, BaseElement } from "../types";

export interface BoxElement extends BaseElement {
  type: "box";
  width: number;
  height: number;
}

export interface BoxParams {
  width?: number;
  height?: number;
}

export const boxExtension: AsciiExtension<BoxElement, BoxParams> = {
  type: "box",
  label: "Box",
  icon: Square,

  create: (x: number, y: number, params?: BoxParams) => ({
    id: Math.random().toString(36).substr(2, 9),
    type: "box",
    x,
    y,
    width: params?.width || 10,
    height: params?.height || 5,
  }),

  render: (ctx, element, isSelected, visualCellSize) => {
    const b = {
      left: element.x,
      top: element.y,
      right: element.x + element.width,
      bottom: element.y + element.height,
    };

    if (isSelected) {
      // Classic focus rectangle (dotted)
      ctx.save();
      ctx.strokeStyle = "#000000";
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1;
      ctx.strokeRect(
        element.x * visualCellSize - 1,
        element.y * visualCellSize - 1,
        (b.right - b.left) * visualCellSize + 2,
        (b.bottom - b.top) * visualCellSize + 2,
      );
      ctx.restore();
    }

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      element.x * visualCellSize + 2,
      element.y * visualCellSize + 2,
      element.width * visualCellSize - 4,
      element.height * visualCellSize - 4,
    );

    if (isSelected) {
      // Drag handle
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(
        (element.x + element.width) * visualCellSize - 8,
        (element.y + element.height) * visualCellSize - 8,
        8,
        8,
      );
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        (element.x + element.width) * visualCellSize - 8,
        (element.y + element.height) * visualCellSize - 8,
        8,
        8,
      );
    }
  },

  getBounds: (element) => ({
    left: element.x,
    top: element.y,
    right: element.x + element.width,
    bottom: element.y + element.height,
  }),

  toAscii: (element, grid, offset) => {
    const x = element.x - offset.x;
    const y = element.y - offset.y;
    const w = element.width;
    const h = element.height;

    if (y >= 0 && y < grid.length) {
      if (x >= 0 && x < grid[0].length) grid[y][x] = "+";
      if (x + w - 1 >= 0 && x + w - 1 < grid[0].length)
        grid[y][x + w - 1] = "+";
      for (let i = 1; i < w - 1; i++) {
        if (x + i >= 0 && x + i < grid[0].length) grid[y][x + i] = "-";
      }
    }

    if (y + h - 1 >= 0 && y + h - 1 < grid.length) {
      if (x >= 0 && x < grid[0].length) grid[y + h - 1][x] = "+";
      if (x + w - 1 >= 0 && x + w - 1 < grid[0].length)
        grid[y + h - 1][x + w - 1] = "+";
      for (let i = 1; i < w - 1; i++) {
        if (x + i >= 0 && x + i < grid[0].length) grid[y + h - 1][x + i] = "-";
      }
    }

    for (let j = 1; j < h - 1; j++) {
      if (y + j >= 0 && y + j < grid.length) {
        if (x >= 0 && x < grid[0].length) grid[y + j][x] = "|";
        if (x + w - 1 >= 0 && x + w - 1 < grid[0].length)
          grid[y + j][x + w - 1] = "|";
      }
    }
  },
};
