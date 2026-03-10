import type { BaseElement } from "../extensions/types";
import { getExtension } from "../extensions/registry";

/**
 * Determines if a child element's bounding box is completely enclosed
 * by a parent element's bounding box.
 */
export const isInside = (child: BaseElement, parent: BaseElement): boolean => {
  if (child.id === parent.id) return false;
  
  const childBounds = getExtension(child.type).getBounds(child);
  const parentBounds = getExtension(parent.type).getBounds(parent);
  
  return (
    childBounds.left >= parentBounds.left &&
    childBounds.right <= parentBounds.right &&
    childBounds.top >= parentBounds.top &&
    childBounds.bottom <= parentBounds.bottom
  );
};
