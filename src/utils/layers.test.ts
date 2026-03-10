import { describe, expect, it } from "vitest";
import type { BaseElement } from "../extensions/types";
import {
  reorderElements,
  toggleElementLock,
  toggleElementVisibility,
} from "./layers";

describe("Layer Management Utilities", () => {
  const mockElements: BaseElement[] = [
    { id: "1", type: "box", x: 0, y: 0 },
    { id: "2", type: "text", x: 10, y: 10 },
    { id: "3", type: "vector", x: 20, y: 20 },
  ];

  describe("reorderElements", () => {
    it("should move an element up (forward in array)", () => {
      const result = reorderElements(mockElements, "1", "up");
      expect(result.map((el) => el.id)).toEqual(["2", "1", "3"]);
    });

    it("should move an element down (backward in array)", () => {
      const result = reorderElements(mockElements, "2", "down");
      expect(result.map((el) => el.id)).toEqual(["2", "1", "3"]);
    });

    it("should bring an element to front (end of array)", () => {
      const result = reorderElements(mockElements, "1", "front");
      expect(result.map((el) => el.id)).toEqual(["2", "3", "1"]);
    });

    it("should send an element to back (start of array)", () => {
      const result = reorderElements(mockElements, "3", "back");
      expect(result.map((el) => el.id)).toEqual(["3", "1", "2"]);
    });

    it("should not change anything if ID is not found", () => {
      const result = reorderElements(mockElements, "unknown", "up");
      expect(result).toEqual(mockElements);
    });

    it("should respect boundaries when moving up", () => {
      const result = reorderElements(mockElements, "3", "up");
      expect(result.map((el) => el.id)).toEqual(["1", "2", "3"]);
    });

    it("should respect boundaries when moving down", () => {
      const result = reorderElements(mockElements, "1", "down");
      expect(result.map((el) => el.id)).toEqual(["1", "2", "3"]);
    });
  });

  describe("toggleElementVisibility", () => {
    it("should toggle hidden property", () => {
      let result = toggleElementVisibility(mockElements, "1");
      expect(result[0].hidden).toBe(true);
      result = toggleElementVisibility(result, "1");
      expect(result[0].hidden).toBe(false);
    });
  });

  describe("toggleElementLock", () => {
    it("should toggle locked property", () => {
      let result = toggleElementLock(mockElements, "2");
      expect(result[1].locked).toBe(true);
      result = toggleElementLock(result, "2");
      expect(result[1].locked).toBe(false);
    });
  });
});
