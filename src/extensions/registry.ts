import { boxExtension } from "./builtin/box";
import { diamondExtension } from "./builtin/diamond";
import { lineExtension } from "./builtin/line";
import { textExtension } from "./builtin/text";
import { vectorExtension } from "./builtin/vector";
import type { AsciiExtension } from "./types";

class ExtensionRegistry {
  private extensions: Record<string, AsciiExtension<any, any>> = {
    text: textExtension,
    box: boxExtension,
    vector: vectorExtension,
    line: lineExtension,
    diamond: diamondExtension,
  };

  register(extension: AsciiExtension<any, any>) {
    if (this.extensions[extension.type]) {
      console.warn(`Extension "${extension.type}" is already registered. Overwriting.`);
    }
    this.extensions[extension.type] = extension;
  }

  unregister(type: string) {
    delete this.extensions[type];
  }

  exists(type: string): boolean {
    return !!this.extensions[type];
  }

  get(type: string): AsciiExtension<any, any> {
    const ext = this.extensions[type];
    if (!ext) {
      throw new Error(`Extension type "${type}" not found.`);
    }
    return ext;
  }

  getAll(): AsciiExtension<any, any>[] {
    return Object.values(this.extensions);
  }
}

export const extensionRegistry = new ExtensionRegistry();

export const getExtension = (type: string) => extensionRegistry.get(type);
export const hasExtension = (type: string) => extensionRegistry.exists(type);
export const getAllExtensions = () => extensionRegistry.getAll();
