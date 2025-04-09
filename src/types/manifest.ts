import { CSSProperties } from "react";

export interface IWidgetElement {
  type: string,
  id: string,
  styles: CSSProperties & { gridSize?: { rows?: "auto" | number, columns?: "auto" | number }, gridItem?: { rowSpan?: number, columnSpan?: number } },
  data?: Record<string, any>,
  children?: IWidgetElement[]
}

export interface IWidget {
  key: string,
  label: string,
  path: string,
  description?: string,
  dimensions?: { width: number, height: number },
  position?: { x: number, y: number },
  visible?: boolean,
  elements?: IWidgetElement[],
  file?: string,
  url?: string,
}

export interface IWindowMovedPayload {
  path: string;
  position: {
    x: number;
    y: number;
  }
};

export interface IWindowResizedPayload {
  path: string;
  size: {
    height: number;
    width: number;
  }
};