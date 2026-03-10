import { describe, it, expect } from "vitest";
import { textExtension } from "./text";

describe("Text Extension Business Logic", () => {
  describe("create()", () => {
    it("should create a text element with default text", () => {
      const textNode = textExtension.create(5, 5);
      
      expect(textNode.type).toBe("text");
      expect(textNode.x).toBe(5);
      expect(textNode.y).toBe(5);
      expect(textNode.text).toBe("NEW TEXT");
    });

    it("should accept custom text", () => {
      const textNode = textExtension.create(0, 0, { text: "Hello\nWorld" });
      expect(textNode.text).toBe("Hello\nWorld");
    });
  });

  describe("getBounds()", () => {
    it("should calculate bounds for a single-line string", () => {
      const textNode = textExtension.create(10, 10, { text: "Hello" });
      const bounds = textExtension.getBounds(textNode);
      
      expect(bounds).toEqual({
        left: 10,
        top: 10,
        right: 15, // 10 + "Hello".length
        bottom: 11, // 10 + 1 line
      });
    });

    it("should calculate bounds accurately for multi-line strings", () => {
      const textNode = textExtension.create(10, 10, { text: "Short\nVeryLongLine\nTiny" });
      const bounds = textExtension.getBounds(textNode);
      
      expect(bounds).toEqual({
        left: 10,
        top: 10,
        right: 22, // 10 + "VeryLongLine".length (12)
        bottom: 13, // 10 + 3 lines
      });
    });
  });

  describe("toAscii()", () => {
    it("should render text onto the grid", () => {
      const textNode = textExtension.create(1, 1, { text: "Hi\nYo" });
      const grid = Array.from({ length: 4 }, () => Array(4).fill(" "));
      
      textExtension.toAscii(textNode, grid, { x: 0, y: 0 });

      expect(grid[1].join("")).toBe(" Hi ");
      expect(grid[2].join("")).toBe(" Yo ");
    });

    it("should respect the global offset when projecting", () => {
      const textNode = textExtension.create(5, 5, { text: "Cat" });
      const grid = Array.from({ length: 1 }, () => Array(3).fill(" "));
      
      // We offset the grid so the local 0,0 is at global 5,5
      textExtension.toAscii(textNode, grid, { x: 5, y: 5 });

      expect(grid[0].join("")).toBe("Cat");
    });
  });
});
