import { Gem } from "lucide-react";
import type { AsciiExtension, BaseElement } from "../types";

export interface DiamondElement extends BaseElement {
  type: "diamond";
  size: number;
}

export interface DiamondParams {
  size?: number;
}

export const diamondExtension: AsciiExtension<DiamondElement, DiamondParams> = {
  type: "diamond",
  label: "Diamond",
  icon: Gem,

  create: (x: number, y: number, params?: DiamondParams) => ({
    id: Math.random().toString(36).substr(2, 9),
    type: "diamond",
    x,
    y,
    size: params?.size || 4,
  }),

  render: (ctx, element, isSelected, visualCellSize) => {
    const x = element.x * visualCellSize + visualCellSize / 2;
    const y = element.y * visualCellSize + visualCellSize / 2;
    const s = element.size * visualCellSize;

    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s, y);
    ctx.closePath();

    ctx.strokeStyle = isSelected ? "#3B82F6" : "#000000";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (isSelected) {
      const bounds = {
        left: element.x - element.size,
        top: element.y - element.size,
        right: element.x + element.size + 1,
        bottom: element.y + element.size + 1,
      };

      ctx.save();
      ctx.strokeStyle = "#000000";
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1;
      ctx.strokeRect(
        bounds.left * visualCellSize - 1,
        bounds.top * visualCellSize - 1,
        (bounds.right - bounds.left) * visualCellSize + 2,
        (bounds.bottom - bounds.top) * visualCellSize + 2,
      );
      ctx.restore();
    }
  },

  getBounds: (element) => ({
    left: element.x - element.size,
    top: element.y - element.size,
    right: element.x + element.size + 1,
    bottom: element.y + element.size + 1,
  }),

  toAscii: (element, grid, offset) => {
    const cx = element.x - offset.x;
    const cy = element.y - offset.y;
    const s = element.size;

    for (let i = 0; i <= s; i++) {
      const ty = cy - s + i;
      const by = cy + s - i;

      if (ty >= 0 && ty < grid.length) {
        if (i === 0) {
          if (cx >= 0 && cx < grid[0].length) grid[ty][cx] = "^";
        } else if (i === s) {
          if (cx - s >= 0 && cx - s < grid[0].length) grid[ty][cx - s] = "<";
          if (cx + s >= 0 && cx + s < grid[0].length) grid[ty][cx + s] = ">";
        } else {
          if (cx - i >= 0 && cx - i < grid[0].length) grid[ty][cx - i] = "/";
          if (cx + i >= 0 && cx + i < grid[0].length) grid[ty][cx + i] = "\\";
        }
      }

      if (by >= 0 && by < grid.length && by !== ty) {
        if (i === 0) {
          if (cx >= 0 && cx < grid[0].length) grid[by][cx] = "v";
        } else {
          if (cx - i >= 0 && cx - i < grid[0].length) grid[by][cx - i] = "\\";
          if (cx + i >= 0 && cx + i < grid[0].length) grid[by][cx + i] = "/";
        }
      }
    }
  },
};
