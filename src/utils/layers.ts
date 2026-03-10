import type { BaseElement } from "../extensions/types";

export type LayerDirection = "up" | "down" | "front" | "back";

export function reorderElements(
  elements: BaseElement[],
  id: string,
  direction: LayerDirection
): BaseElement[] {
  const index = elements.findIndex((el) => el.id === id);
  if (index === -1) return elements;

  const newElements = [...elements];
  const [element] = newElements.splice(index, 1);

  if (direction === "up") {
    const newIndex = Math.min(newElements.length, index + 1);
    newElements.splice(newIndex, 0, element);
  } else if (direction === "down") {
    const newIndex = Math.max(0, index - 1);
    newElements.splice(newIndex, 0, element);
  } else if (direction === "front") {
    newElements.push(element);
  } else if (direction === "back") {
    newElements.unshift(element);
  }

  return newElements;
}

export function toggleElementVisibility(
  elements: BaseElement[],
  id: string
): BaseElement[] {
  return elements.map((el) =>
    el.id === id ? { ...el, hidden: !el.hidden } : el
  );
}

export function toggleElementLock(
  elements: BaseElement[],
  id: string
): BaseElement[] {
  return elements.map((el) =>
    el.id === id ? { ...el, locked: !el.locked } : el
  );
}
