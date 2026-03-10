import { describe, it, expect } from "vitest";
import { compressAscii, decompressAscii } from "./ascii";

describe("ASCII Utilities", () => {
  describe("compressAscii()", () => {
    it("should return empty string for empty input", () => {
      expect(compressAscii("")).toBe("");
    });

    it("should not compress non-repeating characters", () => {
      expect(compressAscii("abcd")).toBe("abcd");
    });

    it("should compress repeating characters with Run-Length Encoding", () => {
      expect(compressAscii("aaabbc")).toBe("3a2bc");
    });

    it("should escape digits that appear in the original text", () => {
      expect(compressAscii("a1b")).toBe("a\\1b");
      expect(compressAscii("111")).toBe("31"); // Wait, let's see how the implementation handles repeated digits.
    });
  });

  describe("decompressAscii()", () => {
    it("should return empty string for empty input", () => {
      expect(decompressAscii("")).toBe("");
    });

    it("should decompress RLE strings", () => {
      expect(decompressAscii("3a2bc")).toBe("aaabbc");
    });

    it("should handle escaped digits correctly", () => {
      expect(decompressAscii("a\\1b")).toBe("a1b");
    });

    it("should handle multi-digit counts", () => {
      expect(decompressAscii("12a")).toBe("aaaaaaaaaaaa");
    });
  });

  describe("Compression Reversibility", () => {
    it("should cleanly round-trip complex ASCII art", () => {
      const art = `
      +------+
      |      |
      | 123  |
      +------+
      `;
      const compressed = compressAscii(art);
      const decompressed = decompressAscii(compressed);
      
      expect(decompressed).toBe(art);
    });
  });
});
