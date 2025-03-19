// 型定義

export type MenuType =
  | "crop"
  | "flip"
  | "rotation"
  | "drawLine"
  | "text"
  | "mask"
  | null;

// アスペクト比の型定義
export type AspectRatio = "free" | "1:1" | "4:3" | "16:9" | "3:2" | "2:3";

// ImageEditor インスタンスの型
export interface TuiImageEditor {
  loadImageFromURL: (url: string, imageName: string) => void;
  loadImageFromFile: (file: File) => void;
  startDrawingMode: (mode: string, settings?: any) => void;
  stopDrawingMode: () => void;
  deactivateAll: () => void;
  getCropzoneRect: () => any;
  crop: (rect: any) => Promise<void>;
  flipX: () => void;
  flipY: () => void;
  resetFlip: () => void;
  rotate: (angle: number) => void;
  setAngle: (angle: number) => void;
  setBrush: (settings: any) => void;
  addText: (text: string, options: any) => Promise<any>;
  addImageObject: (url: string) => Promise<any>;
  applyFilter: (filterType: string) => Promise<void>;
  selectObject: (id: string) => Promise<void>;
  changeTextStyle: (style: any) => void;
  getActiveObjects: () => any[];
  toDataURL: () => string;
  getCanvasSize: () => { width: number; height: number };
  getDrawingMode: () => string;
  on: (eventName: string, handler: Function) => void;
  setCropzoneRect: (aspectRatio: number) => void;
}
