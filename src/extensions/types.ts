export type ElementType = string;

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number; // grid x
  y: number; // grid y
}

export interface AsciiExtension<
  T extends BaseElement = BaseElement,
  C = unknown,
> {
  type: ElementType;
  render: (
    ctx: CanvasRenderingContext2D,
    element: T,
    isSelected: boolean,
    visualCellSize: number,
  ) => void;
  getBounds: (element: T) => {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  toAscii: (
    element: T,
    grid: string[][],
    offset: { x: number; y: number },
  ) => void;
  create: (x: number, y: number, params?: C) => T;
  // UI related
  label: string;
  icon: React.FC<{ className?: string }>;
}
