import { Show } from "solid-js";
import { useImageEditor } from "./hooks/useImageEditor";
import { useEditingTools } from "./hooks/useEditingTools";
import { ToolbarMenu } from "./components/ToolbarMenu";
import { CropMenu } from "./components/SubMenus/CropMenu";
import { FlipMenu } from "./components/SubMenus/FlipMenu";
import { RotateMenu } from "./components/SubMenus/RotateMenu";
import { DrawLineMenu } from "./components/SubMenus/DrawLineMenu";
import { TextMenu } from "./components/SubMenus/TextMenu";
import { MaskMenu } from "./components/SubMenus/MaskMenu";

// スタイルのインポート
import "fabric";
import ImageEditor from "tui-image-editor";
import "tui-image-editor/dist/tui-image-editor.css";
import "../../App.css";

function ImageEditorComponent() {
  const {
    imageEditor,
    activeMenu,
    currentTextId,
    setActiveMenu,
    setCurrentTextId,
    handleFileChange,
    handleDownload,
    handleCloseMenu,
  } = useImageEditor();

  const {
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
  } = useEditingTools(
    imageEditor,
    activeMenu,
    setActiveMenu,
    currentTextId,
    setCurrentTextId,
  );

  return (
    <div class="flex flex-col h-screen max-w-[700px] mx-auto font-sans">
      {/* Header */}
      <div class="flex justify-between items-center p-2.5 border-b border-gray-200">
        <input
          type="file"
          accept="image/*"
          id="input-image"
          class="hidden"
          onChange={(e) => handleFileChange(e)}
        />
        <label
          for="input-image"
          class="cursor-pointer bg-blue-500 text-white px-3 py-2 rounded"
        >
          Upload
        </label>
        <h2 class="m-0 font-medium">Image Editor</h2>
        <button
          onClick={handleDownload}
          class="bg-blue-500 text-white border-none px-3 py-2 rounded cursor-pointer"
        >
          Download
        </button>
      </div>

      {/* Editor */}
      <div class="flex-1 relative">
        <div id="tui-image-editor" class="h-full mx-auto"></div>
      </div>

      {/* Sub menus */}
      <Show when={activeMenu() === "crop"}>
        <CropMenu
          onApply={handleApplyCrop}
          onCancel={handleCancelCrop}
          aspectRatio={aspectRatio}
          onAspectRatioChange={handleAspectRatioChange}
        />
      </Show>

      <Show when={activeMenu() === "flip"}>
        <FlipMenu
          onFlipX={handleFlipX}
          onFlipY={handleFlipY}
          onReset={handleResetFlip}
          onClose={handleCloseMenu}
        />
      </Show>

      <Show when={activeMenu() === "rotation"}>
        <RotateMenu
          angle={rotationAngle}
          onRotateLeft={handleRotateCounterClockwise}
          onRotateRight={handleRotateClockwise}
          onAngleChange={handleRotationChange}
          onClose={handleCloseMenu}
        />
      </Show>

      <Show when={activeMenu() === "drawLine"}>
        <DrawLineMenu
          brushWidth={brushWidth}
          onFreeDrawing={() => startDrawingMode("free")}
          onLineDrawing={() => startDrawingMode("line")}
          onWidthChange={handleBrushWidthChange}
          onClose={handleCloseMenu}
        />
      </Show>

      <Show when={activeMenu() === "text"}>
        <TextMenu
          fontSize={fontSize}
          onBold={() => handleTextStyle("b")}
          onItalic={() => handleTextStyle("i")}
          onUnderline={() => handleTextStyle("u")}
          onFontSizeChange={handleFontSizeChange}
          onAddText={addTextManually}
          onClose={handleCloseMenu}
        />
      </Show>

      <Show when={activeMenu() === "mask"}>
        <MaskMenu
          onLoadMask={handleLoadMaskImage}
          onApplyMask={handleApplyMask}
          onClose={handleCloseMenu}
        />
      </Show>

      {/* Bottom Toolbar */}
      <ToolbarMenu
        onCrop={handleCrop}
        onFlip={handleFlip}
        onRotation={handleRotation}
        onDrawLine={handleDrawLine}
        onText={handleText}
        onMask={handleMask}
      />
    </div>
  );
}

export default ImageEditorComponent;
