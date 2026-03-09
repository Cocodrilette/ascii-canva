/**
 * Sync utilities for binary-packed ASCII elements.
 * Optimized for low-latency P2P transmission.
 */

import type { BaseElement } from "../extensions/types";

const ELEMENT_TYPES: Record<string, number> = {
  box: 1,
  text: 2,
  vector: 3,
};

const REVERSE_ELEMENT_TYPES: Record<number, string> = {
  1: "box",
  2: "text",
  3: "vector",
};

// 9 bytes: ID (string)
// 1 byte: type
// 2 bytes: x (Int16)
// 2 bytes: y (Int16)
// 1 byte: isCenter (Uint8)
// 2 bytes: extra1 (Uint16)
// 2 bytes: extra2 (Uint16)
// Total header: 18 bytes (9+1+2+2+1+2+1 padding?) 
// Let's make it 20 bytes for alignment.
// 9 (ID) + 1 (type) + 2 (x) + 2 (y) + 1 (isCenter) + 2 (extra1) + 2 (extra2) + 1 (pad) = 20 bytes

export const packElement = (element: BaseElement): Uint8Array => {
  const type = ELEMENT_TYPES[element.type] || 0;
  const header = new ArrayBuffer(20);
  const view = new DataView(header);

  const idBytes = new TextEncoder().encode(element.id.padEnd(9, " "));
  new Uint8Array(header).set(idBytes.slice(0, 9), 0);

  view.setUint8(9, type);
  view.setInt16(10, element.x, true);
  view.setInt16(12, element.y, true);
  view.setUint8(14, element.isCenter ? 1 : 0);

  let extraData: Uint8Array | null = null;

  if (element.type === "box") {
    const box = element as any;
    view.setUint16(15, box.width, true);
    view.setUint16(17, box.height, true);
  } else if (element.type === "text") {
    const textEl = element as any;
    const text = textEl.text || "";
    extraData = new TextEncoder().encode(text);
    view.setUint16(15, extraData.length, true);
    view.setUint16(17, 0, true);
  } else if (element.type === "vector") {
    const vector = element as any;
    const points = vector.points || [];
    view.setUint16(15, points.length, true);
    view.setUint16(17, 0, true);
    extraData = new Uint8Array(points.length * 4);
    const ev = new DataView(extraData.buffer);
    for (let i = 0; i < points.length; i++) {
      ev.setInt16(i * 4, points[i].x, true);
      ev.setInt16(i * 4 + 2, points[i].y, true);
    }
  }

  const result = new Uint8Array(header.byteLength + (extraData?.length || 0));
  result.set(new Uint8Array(header), 0);
  if (extraData) {
    result.set(extraData, header.byteLength);
  }

  return result;
};

export const unpackElement = (data: Uint8Array): BaseElement | null => {
  if (data.length < 20) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  const id = new TextDecoder().decode(data.slice(0, 9)).trim();
  const typeId = view.getUint8(9);
  const type = REVERSE_ELEMENT_TYPES[typeId];
  if (!type) return null;

  const x = view.getInt16(10, true);
  const y = view.getInt16(12, true);
  const isCenter = view.getUint8(14) === 1;
  const extra1 = view.getUint16(15, true);
  const extra2 = view.getUint16(17, true);

  const base: BaseElement = {
    id,
    type: type as any,
    x,
    y,
    isCenter,
  };

  if (type === "box") {
    return {
      ...base,
      width: extra1,
      height: extra2,
    } as any;
  } else if (type === "text") {
    const textData = data.slice(20, 20 + extra1);
    const text = new TextDecoder().decode(textData);
    return {
      ...base,
      text,
    } as any;
  } else if (type === "vector") {
    const pointsCount = extra1;
    const points: { x: number; y: number }[] = [];
    const pointsData = data.slice(20, 20 + pointsCount * 4);
    const pv = new DataView(pointsData.buffer, pointsData.byteOffset, pointsData.byteLength);
    for (let i = 0; i < pointsCount; i++) {
      points.push({
        x: pv.getInt16(i * 4, true),
        y: pv.getInt16(i * 4 + 2, true),
      });
    }
    return {
      ...base,
      points,
    } as any;
  }

  return base;
};

/**
 * Packs multiple elements into a single binary stream.
 * [Count: 2 bytes] [ [Size: 2 bytes] [Packed Element] ] ...
 */
export const packElements = (elements: BaseElement[]): Uint8Array => {
  const chunks: Uint8Array[] = [];
  const header = new Uint8Array(2);
  new DataView(header.buffer).setUint16(0, elements.length, true);
  chunks.push(header);

  for (const el of elements) {
    const packed = packElement(el);
    const sizeHeader = new Uint8Array(2);
    new DataView(sizeHeader.buffer).setUint16(0, packed.length, true);
    chunks.push(sizeHeader);
    chunks.push(packed);
  }

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  return result;
};

/**
 * Unpacks multiple elements from a binary stream.
 */
export const unpackElements = (data: Uint8Array): BaseElement[] => {
  if (data.length < 2) return [];
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const count = view.getUint16(0, true);
  const elements: BaseElement[] = [];

  let offset = 2;
  for (let i = 0; i < count; i++) {
    if (offset + 2 > data.length) break;
    const size = view.getUint16(offset, true);
    offset += 2;
    if (offset + size > data.length) break;
    const packed = data.slice(offset, offset + size);
    const el = unpackElement(packed);
    if (el) elements.push(el);
    offset += size;
  }

  return elements;
};
