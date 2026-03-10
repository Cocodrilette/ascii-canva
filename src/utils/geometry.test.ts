import { describe, it, expect } from "vitest";
import { isInside } from "./geometry";
import { boxExtension } from "../extensions/builtin/box";

describe("Geometry Utility: isInside()", () => {
  it("should return false if child and parent have the same ID", () => {
    const parent = boxExtension.create(0, 0, { width: 10, height: 10 });
    parent.id = "same-id";
    const child = { ...parent };
    
    expect(isInside(child, parent)).toBe(false);
  });

  it("should return true if child is completely inside parent", () => {
    const parent = boxExtension.create(0, 0, { width: 20, height: 20 });
    const child = boxExtension.create(5, 5, { width: 5, height: 5 });
    
    expect(isInside(child, parent)).toBe(true);
  });

  it("should return true if child boundaries exactly match parent boundaries", () => {
    const parent = boxExtension.create(5, 5, { width: 10, height: 10 });
    const child = boxExtension.create(5, 5, { width: 10, height: 10 });
    
    expect(isInside(child, parent)).toBe(true);
  });

  it("should return false if child is partially outside parent", () => {
    const parent = boxExtension.create(0, 0, { width: 10, height: 10 });
    const child = boxExtension.create(5, 5, { width: 10, height: 10 }); // Right/Bottom bounds go to 15
    
    expect(isInside(child, parent)).toBe(false);
  });

  it("should return false if child is completely outside parent", () => {
    const parent = boxExtension.create(0, 0, { width: 10, height: 10 });
    const child = boxExtension.create(20, 20, { width: 5, height: 5 });
    
    expect(isInside(child, parent)).toBe(false);
  });
});
