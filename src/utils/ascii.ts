/**
 * ASCII conversion utilities.
 */

// A standard set of ASCII characters ordered by density
export const ASCII_CHARS = "@%#*+=-:. ";

/**
 * Compresses an ASCII string using a custom Run-Length Encoding (RLE).
 * Standard RLE for ASCII characters.
 */
export const compressAscii = (text: string): string => {
  if (!text) return "";
  let result = "";
  let i = 0;
  while (i < text.length) {
    let count = 1;
    while (i + 1 < text.length && text[i] === text[i + 1]) {
      count++;
      i++;
    }
    if (count > 1) {
      result += `${count}${text[i]}`;
    } else {
      // If it's a digit, we escape it (though ASCII_CHARS doesn't have digits)
      if (/\d/.test(text[i])) result += "\\";
      result += text[i];
    }
    i++;
  }
  return result;
};

/**
 * Decompresses an RLE-encoded ASCII string.
 */
export const decompressAscii = (compressed: string): string => {
  let result = "";
  let i = 0;
  while (i < compressed.length) {
    let countStr = "";
    while (i < compressed.length && /\d/.test(compressed[i])) {
      countStr += compressed[i];
      i++;
    }
    if (countStr) {
      const count = parseInt(countStr);
      result += compressed[i].repeat(count);
    } else {
      if (compressed[i] === "\\") i++;
      result += compressed[i];
    }
    i++;
  }
  return result;
};

/**
 * Translates a given HTML Canvas element's content into an ASCII string.
 * @param canvas - The HTMLCanvasElement to translate.
 * @param resolution - The width (in characters) of the ASCII output.
 * @returns An ASCII representation of the canvas content.
 */
export const translateCanvasToAscii = (
  canvas: HTMLCanvasElement,
  resolution = 100,
): string => {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "";

  const { width, height } = canvas;
  // Calculate aspect ratio to maintain the correct height in characters
  // Character height is roughly twice its width, so we adjust for that.
  const charWidth = width / resolution;
  const charHeight = charWidth * 1.8; // Adjusted for font aspect ratio
  const rows = Math.floor(height / charHeight);
  const cols = resolution;

  let asciiOutput = "";

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const imageData = ctx.getImageData(
        x * charWidth,
        y * charHeight,
        charWidth,
        charHeight,
      );

      const brightness = getAverageBrightness(imageData.data);
      const charIndex = Math.floor(
        (brightness / 255) * (ASCII_CHARS.length - 1),
      );

      // Invert if needed, here we assume white bg and dark text for standard look
      // But for a typical canvas (black text on white),
      // 255 (white) should map to ' ' and 0 (black) to '@'
      const char = ASCII_CHARS[charIndex];
      asciiOutput += char;
    }
    asciiOutput += "\n";
  }

  return asciiOutput;
};

/**
 * Calculates the average brightness of an RGBA image data array.
 */
const getAverageBrightness = (data: Uint8ClampedArray): number => {
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // standard grayscale conversion
    const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    total += brightness;
  }
  return total / (data.length / 4);
};
