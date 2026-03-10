import { describe, it, expect } from "vitest";
import { lineExtension } from "./line";

describe("Line Extension Business Logic", () => {
  describe("create()", () => {
    it("should create a line with default points if none provided", () => {
      const line = lineExtension.create(5, 5);
      
      expect(line.type).toBe("line");
      expect(line.x).toBe(5);
      expect(line.y).toBe(5);
      expect(line.points.length).toBe(2);
      expect(line.points[0]).toEqual({ x: 5, y: 5 });
      expect(line.points[1]).toEqual({ x: 10, y: 8 }); // x+5, y+3 defaults
    });

    it("should accept custom points", () => {
      const points = [{ x: 1, y: 1 }, { x: 5, y: 5 }, { x: 10, y: 10 }];
      const line = lineExtension.create(1, 1, { points });
      
      expect(line.points.length).toBe(3);
      expect(line.points).toEqual(points);
    });
  });

  describe("getBounds()", () => {
    it("should correctly calculate bounds including orthogonal elbows", () => {
      // Points: (0,0) -> (10, 5)
      // dx=10, dy=5 -> vThenH is true, meaning Vertical First: (0,0) -> (0,5) -> (10,5)
      const line = lineExtension.create(0, 0, { points: [{ x: 0, y: 0 }, { x: 10, y: 5 }] });
      const bounds = lineExtension.getBounds(line);
      
      expect(bounds).toEqual({
        left: 0,
        top: 0,
        right: 11, // 10 + 1 (inclusive bound)
        bottom: 6, // 5 + 1
      });
    });
  });

  describe("toAscii()", () => {
    it("should draw an orthogonal line without an arrowhead", () => {
      // Vertical then horizontal line
      const line = lineExtension.create(1, 1, { points: [{ x: 1, y: 1 }, { x: 4, y: 3 }] });
      // dx=3, dy=2 -> vThenH is true, meaning Vertical First: (1,1)->(1,3)->(4,3)
      
      const grid = Array.from({ length: 5 }, () => Array(6).fill(" "));
      lineExtension.toAscii(line, grid, { x: 0, y: 0 });

      // Expected ASCII representation (no arrowhead):
      // "      " (0)
      // " |    " (1)
      // " |    " (2)
      // " +--- " (3)  <- corner and line right
      // "      " (4)
      
      expect(grid[1].join("")).toBe(" |    ");
      expect(grid[2].join("")).toBe(" |    ");
      expect(grid[3].join("")).toBe(" +--- ");
    });

    it("should adjust line boundaries when connected to start/end elements", () => {
      const line = lineExtension.create(1, 1, { 
        points: [{ x: 1, y: 1 }, { x: 5, y: 1 }],
        startElementId: "box1",
        endElementId: "box2"
      });
      // Should apply 1 unit margin due to start/end connections
      // Normal: (1,1) to (5,1) -> '-----'
      // With margin: (2,1) to (4,1) -> '---'
      
      const grid = Array.from({ length: 3 }, () => Array(7).fill(" "));
      lineExtension.toAscii(line, grid, { x: 0, y: 0 });

      expect(grid[1].join("")).toBe("  ---  ");
    });
  });
});
