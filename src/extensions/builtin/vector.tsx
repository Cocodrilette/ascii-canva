import { MoveRight } from "lucide-react";
import type { AsciiExtension, BaseElement } from "../types";

export interface VectorPoint {
  x: number;
  y: number;
}

export interface VectorElement extends BaseElement {
  type: "vector";
  points: VectorPoint[]; // points[0] is always {x, y} from BaseElement
  startElementId?: string;
  endElementId?: string;
}

export interface VectorParams {
  points?: VectorPoint[];
  x2?: number; // legacy/simple create
  y2?: number;
  startElementId?: string;
  endElementId?: string;
}

export const vectorExtension: AsciiExtension<VectorElement, VectorParams> = {
  type: "vector",
  label: "Vector",
  icon: MoveRight,

  create: (x: number, y: number, params?: VectorParams) => {
    const points = params?.points || [
      { x, y },
      { x: params?.x2 ?? x + 5, y: params?.y2 ?? y + 3 },
    ];
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: "vector",
      x: points[0].x,
      y: points[0].y,
      points,
      startElementId: params?.startElementId,
      endElementId: params?.endElementId,
    };
  },

  render: (ctx, element, isSelected, visualCellSize) => {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";

    const points = element.points || [
      { x: element.x, y: element.y },
      { x: (element as any).x2 ?? element.x + 5, y: (element as any).y2 ?? element.y + 3 }
    ];

    const rawSegments: { x: number; y: number }[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      const x1 = p1.x * visualCellSize + visualCellSize / 2;
      const y1 = p1.y * visualCellSize + visualCellSize / 2;
      const x2 = p2.x * visualCellSize + visualCellSize / 2;
      const y2 = p2.y * visualCellSize + visualCellSize / 2;

      const dx = x2 - x1;
      const dy = y2 - y1;

      // Orthogonal elbow
      const vThenH = Math.abs(dx) >= Math.abs(dy);
      const midX = vThenH ? x1 : x2;
      const midY = vThenH ? y2 : y1;

      if (i === 0) rawSegments.push({ x: x1, y: y1 });
      rawSegments.push({ x: midX, y: midY });
      rawSegments.push({ x: x2, y: y2 });
    }

    // Deduplicate consecutive points
    const drawSegments: { x: number; y: number }[] = rawSegments.filter(
      (p, i, arr) => {
        if (i === 0) return true;
        return p.x !== arr[i - 1].x || p.y !== arr[i - 1].y;
      },
    );

    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = "#000000";
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1;
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      for (const p of drawSegments) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      ctx.strokeRect(
        minX - visualCellSize / 2 - 2,
        minY - visualCellSize / 2 - 2,
        maxX - minX + visualCellSize + 4,
        maxY - minY + visualCellSize + 4,
      );
      ctx.restore();
    }

    // Apply margin if connected
    const margin = visualCellSize * 0.4;
    const finalPath = [...drawSegments];

    if (element.startElementId && finalPath.length >= 2) {
      const p1 = finalPath[0];
      const p2 = finalPath[1];
      const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      finalPath[0] = {
        x: p1.x + Math.cos(ang) * margin,
        y: p1.y + Math.sin(ang) * margin,
      };
    }
    if (element.endElementId && finalPath.length >= 2) {
      const pEnd = finalPath[finalPath.length - 1];
      const pPrev = finalPath[finalPath.length - 2];
      const ang = Math.atan2(pEnd.y - pPrev.y, pEnd.x - pPrev.x);
      finalPath[finalPath.length - 1] = {
        x: pEnd.x - Math.cos(ang) * margin,
        y: pEnd.y - Math.sin(ang) * margin,
      };
    }

    ctx.beginPath();
    ctx.moveTo(finalPath[0].x, finalPath[0].y);
    for (let i = 1; i < finalPath.length; i++) {
      ctx.lineTo(finalPath[i].x, finalPath[i].y);
    }
    ctx.stroke();

    // Arrowhead at the last segment
    const pEnd = finalPath[finalPath.length - 1];
    const pPrev = finalPath[finalPath.length - 2];
    const headLen = 10;
    const angle = Math.atan2(pEnd.y - pPrev.y, pEnd.x - pPrev.x);

    ctx.beginPath();
    ctx.moveTo(pEnd.x, pEnd.y);
    ctx.lineTo(
      pEnd.x - headLen * Math.cos(angle - Math.PI / 6),
      pEnd.y - headLen * Math.sin(angle - Math.PI / 6),
    );
    ctx.moveTo(pEnd.x, pEnd.y);
    ctx.lineTo(
      pEnd.x - headLen * Math.cos(angle + Math.PI / 6),
      pEnd.y - headLen * Math.sin(angle + Math.PI / 6),
    );
    ctx.stroke();

    if (isSelected) {
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const isEnd = i === points.length - 1;
        const isStart = i === 0;
        const connected =
          (isStart && element.startElementId) ||
          (isEnd && element.endElementId);

        ctx.fillStyle = connected ? "#00FF41" : "#FFFFFF";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        const px = p.x * visualCellSize + visualCellSize / 2;
        const py = p.y * visualCellSize + visualCellSize / 2;
        ctx.fillRect(px - 4, py - 4, 8, 8);
        ctx.strokeRect(px - 4, py - 4, 8, 8);
      }
    }
  },

  getBounds: (element) => {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    const points = element.points || [
      { x: element.x, y: element.y },
      { x: (element as any).x2 ?? element.x + 5, y: (element as any).y2 ?? element.y + 3 }
    ];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const vThenH = Math.abs(p2.x - p1.x) >= Math.abs(p2.y - p1.y);
      const midX = vThenH ? p1.x : p2.x;
      const midY = vThenH ? p2.y : p1.y;

      minX = Math.min(minX, p1.x, p2.x, midX);
      minY = Math.min(minY, p1.y, p2.y, midY);
      maxX = Math.max(maxX, p1.x, p2.x, midX);
      maxY = Math.max(maxY, p1.y, p2.y, midY);
    }

    return {
      left: minX,
      top: minY,
      right: maxX + 1,
      bottom: maxY + 1,
    };
  },

  toAscii: (element, grid, offset) => {
    const drawLine = (xS: number, yS: number, xE: number, yE: number) => {
      const startX = Math.min(xS, xE);
      const endX = Math.max(xS, xE);
      const startY = Math.min(yS, yE);
      const endY = Math.max(yS, yE);

      if (startX === endX) {
        for (let y = startY; y <= endY; y++) {
          if (
            y >= 0 &&
            y < grid.length &&
            startX >= 0 &&
            startX < grid[0].length
          ) {
            grid[y][startX] = "|";
          }
        }
      } else {
        for (let x = startX; x <= endX; x++) {
          if (
            startY >= 0 &&
            startY < grid.length &&
            x >= 0 &&
            x < grid[0].length
          ) {
            grid[startY][x] = "-";
          }
        }
      }
    };

    const points = element.points || [
      { x: element.x, y: element.y },
      { x: (element as any).x2 ?? element.x + 5, y: (element as any).y2 ?? element.y + 3 }
    ];

    const rawNodes: VectorPoint[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1x = points[i].x - offset.x;
      const p1y = points[i].y - offset.y;
      const p2x = points[i + 1].x - offset.x;
      const p2y = points[i + 1].y - offset.y;

      const dx = p2x - p1x;
      const dy = p2y - p1y;
      const vThenH = Math.abs(dx) >= Math.abs(dy);

      const midX = vThenH ? p1x : p2x;
      const midY = vThenH ? p2y : p1y;

      if (i === 0) rawNodes.push({ x: p1x, y: p1y });
      rawNodes.push({ x: midX, y: midY });
      rawNodes.push({ x: p2x, y: p2y });
    }

    // Deduplicate consecutive nodes
    const nodes: VectorPoint[] = rawNodes.filter((p, i, arr) => {
      if (i === 0) return true;
      return p.x !== arr[i - 1].x || p.y !== arr[i - 1].y;
    });

    if (nodes.length < 2) return;

    // Apply margin if connected (1 unit)
    if (element.startElementId) {
      const p1 = nodes[0];
      const p2 = nodes[1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      if (dx !== 0) nodes[0].x += dx > 0 ? 1 : -1;
      else if (dy !== 0) nodes[0].y += dy > 0 ? 1 : -1;
    }
    if (element.endElementId) {
      const pEnd = nodes[nodes.length - 1];
      const pPrev = nodes[nodes.length - 2];
      const dx = pEnd.x - pPrev.x;
      const dy = pEnd.y - pPrev.y;
      if (dx !== 0) nodes[nodes.length - 1].x -= dx > 0 ? 1 : -1;
      else if (dy !== 0) nodes[nodes.length - 1].y -= dy > 0 ? 1 : -1;
    }

    for (let i = 0; i < nodes.length - 1; i++) {
      drawLine(nodes[i].x, nodes[i].y, nodes[i + 1].x, nodes[i + 1].y);
    }

    // Corners and Arrowhead
    for (let i = 1; i < nodes.length - 1; i++) {
      const n = nodes[i];
      if (n.y >= 0 && n.y < grid.length && n.x >= 0 && n.x < grid[0].length) {
        grid[n.y][n.x] = "+";
      }
    }

    const pLast = nodes[nodes.length - 1];
    const pPrev = nodes[nodes.length - 2];
    if (
      pLast.y >= 0 &&
      pLast.y < grid.length &&
      pLast.x >= 0 &&
      pLast.x < grid[0].length
    ) {
      if (pLast.y === pPrev.y) {
        grid[pLast.y][pLast.x] = pLast.x > pPrev.x ? ">" : "<";
      } else {
        grid[pLast.y][pLast.x] = pLast.y > pPrev.y ? "v" : "^";
      }
    }
  },
};
