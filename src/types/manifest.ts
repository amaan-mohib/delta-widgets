import { CSSProperties } from "react";

export interface IWidgetElement {
  type: string,
  id: string,
  styles: CSSProperties,
  data?: any,
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