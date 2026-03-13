import { describe, it, expect } from "vitest";
import { diamondExtension } from "./diamond";

describe("Diamond Extension Business Logic", () => {
  describe("create()", () => {
    it("should create a diamond with default size", () => {
      const diamond = diamondExtension.create(10, 20);
      
      expect(diamond.type).toBe("diamond");
      expect(diamond.x).toBe(10);
      expect(diamond.y).toBe(20);
      expect(diamond.size).toBe(4); // default size
      expect(typeof diamond.id).toBe("string");
    });

    it("should accept custom size", () => {
      const diamond = diamondExtension.create(5, 5, { size: 10 });
      expect(diamond.size).toBe(10);
    });
  });

  describe("getBounds()", () => {
    it("should calculate correct bounding box", () => {
      const diamond = diamondExtension.create(10, 10, { size: 5 });
      const bounds = diamondExtension.getBounds(diamond);
      
      expect(bounds).toEqual({
        left: 5,   // 10 - 5
        top: 5,    // 10 - 5
        right: 16, // 10 + 5 + 1
        bottom: 16, // 10 + 5 + 1
      });
    });
  });

  describe("toAscii()", () => {
    it("should render an ASCII diamond on the grid", () => {
      const diamond = diamondExtension.create(2, 2, { size: 2 });
      
      // Create a 5x5 empty grid
      const grid = Array.from({ length: 5 }, () => Array(5).fill(" "));
      
      diamondExtension.toAscii(diamond, grid, { x: 0, y: 0 });

      // Expected grid rendering for size 2 at (2,2):
      // (0,2) ^ (top)
      // (1,1) / (1,3) \
      // (2,0) < (2,4) >
      // (3,1) \ (3,3) /
      // (4,2) v (bottom)

      expect(grid[0][2]).toBe("^");
      expect(grid[1][1]).toBe("/");
      expect(grid[1][3]).toBe("\\");
      expect(grid[2][0]).toBe("<");
      expect(grid[2][4]).toBe(">");
      expect(grid[3][1]).toBe("\\");
      expect(grid[3][3]).toBe("/");
      expect(grid[4][2]).toBe("v");
    });
  });
});
