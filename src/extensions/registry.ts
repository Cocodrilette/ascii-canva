import { boxExtension } from "./builtin/box";
import { textExtension } from "./builtin/text";
import type { AsciiExtension } from "./types";

export const extensions: Record<string, AsciiExtension<any, any>> = {
  text: textExtension,
  box: boxExtension,
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
