import { describe, it, expect } from "vitest";
import { vectorExtension } from "./vector";

describe("Vector Extension Business Logic", () => {
  describe("create()", () => {
    it("should create a vector with default points if none provided", () => {
      const vec = vectorExtension.create(5, 5);
      
      expect(vec.type).toBe("vector");
      expect(vec.x).toBe(5);
      expect(vec.y).toBe(5);
      expect(vec.points.length).toBe(2);
      expect(vec.points[0]).toEqual({ x: 5, y: 5 });
      expect(vec.points[1]).toEqual({ x: 10, y: 8 }); // x+5, y+3 defaults
    });

    it("should accept custom points", () => {
      const points = [{ x: 1, y: 1 }, { x: 5, y: 5 }, { x: 10, y: 10 }];
      const vec = vectorExtension.create(1, 1, { points });
      
      expect(vec.points.length).toBe(3);
      expect(vec.points).toEqual(points);
    });
  });

  describe("getBounds()", () => {
    it("should correctly calculate bounds including orthogonal elbows", () => {
      // Points: (0,0) -> (10, 5)
      // Because dx (10) > dy (5), it goes horizontal first: (0,0) -> (10,0) -> (10,5)
      const vec = vectorExtension.create(0, 0, { points: [{ x: 0, y: 0 }, { x: 10, y: 5 }] });
      const bounds = vectorExtension.getBounds(vec);
      
      expect(bounds).toEqual({
        left: 0,
        top: 0,
        right: 11, // 10 + 1 (inclusive bound)
        bottom: 6, // 5 + 1
      });
    });

    it("should calculate bounds for a multi-segment line going backwards", () => {
      // (10, 10) -> (0, 0)
      const vec = vectorExtension.create(10, 10, { points: [{ x: 10, y: 10 }, { x: 0, y: 0 }] });
      const bounds = vectorExtension.getBounds(vec);
      
      expect(bounds).toEqual({
        left: 0,
        top: 0,
        right: 11,
        bottom: 11,
      });
    });
  });

  describe("toAscii()", () => {
    it("should draw an orthogonal line with an arrowhead", () => {
      // Vertical then horizontal line
      const vec = vectorExtension.create(1, 1, { points: [{ x: 1, y: 1 }, { x: 4, y: 3 }] });
      // dx=3, dy=2 -> vThenH is true, meaning Vertical First: (1,1)->(1,3)->(4,3)
      
      const grid = Array.from({ length: 5 }, () => Array(6).fill(" "));
      vectorExtension.toAscii(vec, grid, { x: 0, y: 0 });

      // Expected ASCII representation:
      // "      " (0)
      // " |    " (1)
      // " |    " (2)
      // " +--> " (3)  <- corner and arrowhead right
      // "      " (4)
      
      expect(grid[1].join("")).toBe(" |    ");
      expect(grid[2].join("")).toBe(" |    ");
      expect(grid[3].join("")).toBe(" +--> ");
    });

    it("should adjust line boundaries when connected to start/end elements", () => {
      const vec = vectorExtension.create(1, 1, { 
        points: [{ x: 1, y: 1 }, { x: 5, y: 1 }],
        startElementId: "box1",
        endElementId: "box2"
      });
      // Should apply 1 unit margin due to start/end connections
      // Normal: (1,1) to (5,1) -> '-'
      // With margin: (2,1) to (4,1)
      
      const grid = Array.from({ length: 3 }, () => Array(7).fill(" "));
      vectorExtension.toAscii(vec, grid, { x: 0, y: 0 });

      // Only x=2 and x=3 will be '-', x=4 is the arrowhead '>'
      expect(grid[1].join("")).toBe("  -->  ");
    });
  });
});
