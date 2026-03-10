import { describe, it, expect } from "vitest";
import { boxExtension } from "./box";

describe("Box Extension Business Logic", () => {
  describe("create()", () => {
    it("should create a box with default dimensions", () => {
      const box = boxExtension.create(10, 20);
      
      expect(box.type).toBe("box");
      expect(box.x).toBe(10);
      expect(box.y).toBe(20);
      expect(box.width).toBe(10); // default width
      expect(box.height).toBe(5); // default height
      expect(typeof box.id).toBe("string");
    });

    it("should accept custom dimensions", () => {
      const box = boxExtension.create(5, 5, { width: 15, height: 8 });
      expect(box.width).toBe(15);
      expect(box.height).toBe(8);
    });
  });

  describe("getBounds()", () => {
    it("should calculate correct bounding box", () => {
      const box = boxExtension.create(10, 10, { width: 20, height: 10 });
      const bounds = boxExtension.getBounds(box);
      
      expect(bounds).toEqual({
        left: 10,
        top: 10,
        right: 30, // 10 + 20
        bottom: 20, // 10 + 10
      });
    });
  });

  describe("toAscii()", () => {
    it("should render an ASCII box outline on the grid", () => {
      const box = boxExtension.create(1, 1, { width: 4, height: 4 });
      
      // Create a 6x6 empty grid
      const grid = Array.from({ length: 6 }, () => Array(6).fill(" "));
      
      boxExtension.toAscii(box, grid, { x: 0, y: 0 });

      // Expected grid rendering:
      // "      " (0)
      // " +--+ " (1)
      // " |  | " (2)
      // " |  | " (3)
      // " +--+ " (4)
      // "      " (5)

      expect(grid[1].join("")).toBe(" +--+ ");
      expect(grid[2].join("")).toBe(" |  | ");
      expect(grid[3].join("")).toBe(" |  | ");
      expect(grid[4].join("")).toBe(" +--+ ");
    });

    it("should respect the global offset when projecting onto the grid", () => {
      const box = boxExtension.create(5, 5, { width: 3, height: 3 });
      
      // A small 3x3 grid, offset so the box is at 0,0 locally
      const grid = Array.from({ length: 3 }, () => Array(3).fill(" "));
      
      boxExtension.toAscii(box, grid, { x: 5, y: 5 });

      expect(grid[0].join("")).toBe("+-+");
      expect(grid[1].join("")).toBe("| |");
      expect(grid[2].join("")).toBe("+-+");
    });
  });
});
