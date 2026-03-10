import { boxExtension } from "./builtin/box";
import { lineExtension } from "./builtin/line";
import { textExtension } from "./builtin/text";
import { vectorExtension } from "./builtin/vector";
import type { AsciiExtension } from "./types";

export const extensions: Record<string, AsciiExtension<any, any>> = {
  text: textExtension,
  box: boxExtension,
  vector: vectorExtension,
  line: lineExtension,
};

export const getExtension = (type: string) => {
  const ext = extensions[type];
  if (!ext) {
    throw new Error(`Extension type "${type}" not found.`);
  }
  return ext;
};

export const getAllExtensions = () => {
  return Object.values(extensions);
};
