import { CSSProperties } from "react";

export interface IWidgetElement {
  type: string;
  id: string;
  styles: CSSProperties & {
    gridSize?: { rows?: "auto" | number; columns?: "auto" | number };
    gridItem?: { rowSpan?: number; columnSpan?: number };
  };
  data?: Record<string, any>;
  children?: IWidgetElement[];
}

export type TCustomFields = Record<
  string,
  { key: string; label: string; value: string }
>;

export interface IWidget {
  key: string;
  label: string;
  path: string;
  description?: string;
  dimensions?: { width: number; height: number };
  position?: { x: number; y: number };
  visible?: boolean;
  elements?: IWidgetElement[];
  url?: string;
  file?: string;
  widgetType?: "url" | "html" | "json";
  customFields?: TCustomFields;
}
