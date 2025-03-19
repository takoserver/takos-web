import { createSignal } from "solid-js";
import { AspectRatio, MenuType, TuiImageEditor } from "../types";

export function useEditingTools(
  imageEditor: () => TuiImageEditor | null,
  activeMenu: () => MenuType,
  setActiveMenu: (menu: MenuType) => void,
  currentTextId: () => string | null,
  setCurrentTextId: (id: string | null) => void,
) {
  // ツール関連の状態
  const [brushWidth, setBrushWidth] = createSignal(12);
  const [rotationAngle, setRotationAngle] = createSignal(0);
  const [fontSize, setFontSize] = createSignal(24);
  const [aspectRatio, setAspectRatio] = createSignal<AspectRatio>("free");

  // アスペクト比を数値に変換するヘルパー関数
  const getAspectRatioValue = (ratio: AspectRatio): number | null => {
    switch (ratio) {
      case "1:1":
        return 1;
      case "4:3":
        return 4 / 3;
      case "16:9":
        return 16 / 9;
      case "3:2":
        return 3 / 2;
      case "2:3":
        return 2 / 3;
      case "free":
        return null;
      default:
        return null;
    }
  };

  // アスペクト比を適用する関数
  const applyAspectRatio = (ratio: AspectRatio) => {
    const editor = imageEditor();
    if (!editor) return;

    const ratioValue = getAspectRatioValue(ratio);
    if (ratioValue !== null && typeof editor.setCropzoneRect === "function") {
      try {
        editor.setCropzoneRect(ratioValue);
      } catch (error) {
        console.error("Error applying aspect ratio:", error);
      }
    }
  };

  // アスペクト比を変更する関数
  const handleAspectRatioChange = (ratio: AspectRatio) => {
    setAspectRatio(ratio);
    applyAspectRatio(ratio);
  };

  // Crop 関連
  const handleCrop = () => {
    const editor = imageEditor();
    if (editor) {
      try {
        if (typeof editor.stopDrawingMode === "function") {
          editor.stopDrawingMode();
        }

        if (typeof editor.startDrawingMode === "function") {
          editor.startDrawingMode("CROPPER");

          // アスペクト比を適用
          const ratioValue = getAspectRatioValue(aspectRatio());
          if (
            ratioValue !== null && typeof editor.setCropzoneRect === "function"
          ) {
            editor.setCropzoneRect(ratioValue);
          }

          setActiveMenu("crop");
        } else {
          console.error("startDrawingMode method not found");
        }
      } catch (error) {
        console.error("Error starting crop mode:", error);
      }
    }
  };

  const handleApplyCrop = () => {
    const editor = imageEditor();
    if (editor) {
      try {
        if (typeof editor.crop === "function") {
          const cropRect = editor.getCropzoneRect();
          if (cropRect) {
            editor.crop(cropRect).then(() => {
              if (typeof editor.stopDrawingMode === "function") {
                editor.stopDrawingMode();
              }
              setActiveMenu(null);
            });
          }
        }
      } catch (error) {
        console.error("Error applying crop:", error);
      }
    }
  };

  const handleCancelCrop = () => {
    const editor = imageEditor();
    if (editor && typeof editor.stopDrawingMode === "function") {
      editor.stopDrawingMode();
      setActiveMenu(null);
    }
  };

  // Flip 関連
  const handleFlip = () => {
    const editor = imageEditor();
    if (editor) {
      if (typeof editor.stopDrawingMode === "function") {
        editor.stopDrawingMode();
      }
      setActiveMenu("flip");
    }
  };

  const handleFlipX = () => {
    const editor = imageEditor();
    if (editor && typeof editor.flipX === "function") {
      editor.flipX();
    }
  };

  const handleFlipY = () => {
    const editor = imageEditor();
    if (editor && typeof editor.flipY === "function") {
      editor.flipY();
    }
  };

  const handleResetFlip = () => {
    const editor = imageEditor();
    if (editor && typeof editor.resetFlip === "function") {
      editor.resetFlip();
    }
  };

  // Rotation 関連
  const handleRotation = () => {
    const editor = imageEditor();
    if (editor) {
      if (typeof editor.stopDrawingMode === "function") {
        editor.stopDrawingMode();
      }
      setActiveMenu("rotation");
    }
  };

  const handleRotateClockwise = () => {
    const editor = imageEditor();
    if (editor && typeof editor.rotate === "function") {
      editor.rotate(30);
    }
  };

  const handleRotateCounterClockwise = () => {
    const editor = imageEditor();
    if (editor && typeof editor.rotate === "function") {
      editor.rotate(-30);
    }
  };

  const handleRotationChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const angle = parseInt(input.value, 10);
    setRotationAngle(angle);

    const editor = imageEditor();
    if (editor && typeof editor.setAngle === "function") {
      editor.setAngle(angle);
    }
  };

  // DrawLine 関連
  const handleDrawLine = () => {
    const editor = imageEditor();
    if (editor) {
      if (typeof editor.stopDrawingMode === "function") {
        editor.stopDrawingMode();
      }
      setActiveMenu("drawLine");
    }
  };

  const startDrawingMode = (mode: string) => {
    const settings = {
      width: brushWidth(),
      color: "rgba(0, 0, 0, 0.5)",
    };

    const editor = imageEditor();
    if (!editor) return;

    try {
      if (mode === "free") {
        editor.startDrawingMode("FREE_DRAWING", settings);
      } else {
        editor.startDrawingMode("LINE_DRAWING", settings);
      }
    } catch (error) {
      console.error(`Error starting ${mode} drawing mode:`, error);
    }
  };

  const handleBrushWidthChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const width = parseInt(input.value, 10);
    setBrushWidth(width);

    const editor = imageEditor();
    if (editor && typeof editor.setBrush === "function") {
      editor.setBrush({ width });
    }
  };

  // Text 関連
  const handleText = () => {
    const editor = imageEditor();
    if (!editor) return;

    try {
      console.clear();
      console.log("Starting text mode...");

      if (typeof editor.stopDrawingMode === "function") {
        editor.stopDrawingMode();
      }

      if (typeof editor.deactivateAll === "function") {
        editor.deactivateAll();
      }

      if (typeof editor.startDrawingMode === "function") {
        console.log("Calling startDrawingMode with TEXT");
        editor.startDrawingMode("TEXT");

        setTimeout(() => {
          const currentMode = editor.getDrawingMode
            ? editor.getDrawingMode()
            : "unknown";
          console.log("Current mode after starting TEXT:", currentMode);
        }, 100);

        setActiveMenu("text");
        console.log("Now click on the canvas where you want to add text");
      } else {
        console.error("startDrawingMode method not found");
      }
    } catch (error) {
      console.error("Error handling text mode:", error);
    }
  };

  const addTextManually = () => {
    const editor = imageEditor();
    if (!editor) return;

    try {
      editor.addText("クリックして編集", {
        position: {
          x: editor.getCanvasSize().width / 2,
          y: editor.getCanvasSize().height / 2,
        },
        styles: {
          fontSize: fontSize(),
          fill: "#000000",
          fontFamily: "Arial",
        },
      }).then((objectProps: any) => {
        console.log("Text added manually with success:", objectProps);
        if (objectProps && objectProps.id) {
          setCurrentTextId(objectProps.id);

          if (typeof editor.selectObject === "function") {
            editor.selectObject(objectProps.id);
          }
        }
        setActiveMenu("text");
      }).catch((error: any) => {
        console.error("Error adding text manually:", error);
      });
    } catch (error) {
      console.error("Error in addTextManually:", error);
    }
  };

  const handleFontSizeChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const size = parseInt(input.value, 10);
    setFontSize(size);

    const editor = imageEditor();
    if (editor && currentTextId()) {
      try {
        if (typeof editor.selectObject === "function") {
          editor.selectObject(currentTextId()!).then(() => {
            if (typeof editor.changeTextStyle === "function") {
              editor.changeTextStyle({
                fontSize: size,
              });
            }
          }).catch((error: any) => {
            console.error("Error selecting text object:", error);
          });
        }
      } catch (error) {
        console.error("Error changing font size:", error);
      }
    }
  };

  const handleTextStyle = (styleType: string) => {
    let styleObj = {};

    switch (styleType) {
      case "b":
        styleObj = { fontWeight: "bold" };
        break;
      case "i":
        styleObj = { fontStyle: "italic" };
        break;
      case "u":
        styleObj = { textDecoration: "underline" };
        break;
      default:
        styleObj = {};
    }

    const editor = imageEditor();
    if (editor && currentTextId()) {
      try {
        if (typeof editor.selectObject === "function") {
          editor.selectObject(currentTextId()!).then(() => {
            if (typeof editor.changeTextStyle === "function") {
              editor.changeTextStyle(styleObj);
            }
          }).catch((error: any) => {
            console.error("Error selecting text object:", error);
          });
        }
      } catch (error) {
        console.error("Error changing text style:", error);
      }
    }
  };

  // Mask 関連
  const handleMask = () => {
    const editor = imageEditor();
    if (editor) {
      if (typeof editor.stopDrawingMode === "function") {
        editor.stopDrawingMode();
      }
      setActiveMenu("mask");
    }
  };

  const handleLoadMaskImage = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const editor = imageEditor();
    if (!editor) return;

    try {
      const imgUrl = URL.createObjectURL(file);

      if (typeof editor.addImageObject === "function") {
        editor.addImageObject(imgUrl).then(() => {
          console.log("Mask image loaded successfully");
        }).catch((error: any) => {
          console.error("Error loading mask image:", error);
        });
      }
    } catch (error) {
      console.error("Error in handleLoadMaskImage:", error);
    }
  };

  const handleApplyMask = () => {
    const editor = imageEditor();
    if (!editor) return;

    try {
      const activeObjects = editor.getActiveObjects
        ? editor.getActiveObjects()
        : [];
      if (activeObjects && activeObjects.length > 0) {
        if (typeof editor.applyFilter === "function") {
          editor.applyFilter("mask").then(() => {
            console.log("Mask applied successfully");
            setActiveMenu(null);
          }).catch((error: any) => {
            console.error("Error applying mask:", error);
          });
        }
      } else {
        console.warn("Please select a mask image first");
        alert("Please select a mask image first");
      }
    } catch (error) {
      console.error("Error in handleApplyMask:", error);
    }
  };

  return {
    // 状態
    brushWidth,
    rotationAngle,
    fontSize,
    aspectRatio,

    // アスペクト比関連
    handleAspectRatioChange,

    // Crop関連
    handleCrop,
    handleApplyCrop,
    handleCancelCrop,

    // Flip関連
    handleFlip,
    handleFlipX,
    handleFlipY,
    handleResetFlip,

    // Rotation関連
    handleRotation,
    handleRotateClockwise,
    handleRotateCounterClockwise,
    handleRotationChange,

    // DrawLine関連
    handleDrawLine,
    startDrawingMode,
    handleBrushWidthChange,

    // Text関連
    handleText,
    addTextManually,
    handleFontSizeChange,
    handleTextStyle,

    // Mask関連
    handleMask,
    handleLoadMaskImage,
    handleApplyMask,
  };
}
