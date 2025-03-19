import { createSignal, onMount } from "solid-js";
import ImageEditor from "tui-image-editor";
import { MenuType, TuiImageEditor } from "../types";

export function useImageEditor() {
  const [imageEditor, setImageEditor] = createSignal<TuiImageEditor | null>(
    null,
  );
  const [activeMenu, setActiveMenu] = createSignal<MenuType>(null);
  const [currentTextId, setCurrentTextId] = createSignal<string | null>(null);

  onMount(() => {
    setTimeout(() => {
      const editor = new ImageEditor("#tui-image-editor", {
        cssMaxWidth: 700,
        cssMaxHeight: 500,
        selectionStyle: {
          cornerSize: 20,
          rotatingPointOffset: 70,
        },
        usageStatistics: false, // Disable sending usage data
      });

      // Load sample image
      editor.loadImageFromURL(
        "https://cdn.rawgit.com/nhnent/tui.component.image-editor/1.3.0/samples/img/sampleImage.jpg",
        "SampleImage",
      );

      // イベントハンドリング設定
      editor.on("objectActivated", (objectProps: any) => {
        console.log("Object activated:", objectProps);
        // テキストオブジェクトが選択されたときの処理
        if (objectProps && objectProps.type === "i-text") {
          setCurrentTextId(objectProps.id);
          setActiveMenu("text");
          console.log("Text object selected with ID:", objectProps.id);
        }
      });

      editor.on("objectAdded", (objectProps: any) => {
        console.log("Object added:", objectProps);
        if (objectProps && objectProps.type === "i-text") {
          // 追加されたテキストのIDを保存
          setCurrentTextId(objectProps.id);
          console.log("Text object added with ID:", objectProps.id);
        }
      });

      // テキストモードでのクリックイベントを処理
      editor.on("mousedown", (event: any, originPointer: any) => {
        if (editor.getDrawingMode() === "TEXT") {
          console.log("Canvas clicked in TEXT mode at:", originPointer);
          // テキスト追加のための処理はactivateText内で行われる
        }
      });

      editor.on("activateText", (obj: any) => {
        console.log("activateText event fired:", obj);
        if (obj.type === "new") {
          editor.addText("ダブルクリックして編集", {
            position: obj.originPosition,
            styles: {
              fontSize: 24,
              fill: "#000000",
              fontFamily: "Arial",
            },
          }).then((objectProps: any) => {
            console.log("Text added successfully:", objectProps);
            setCurrentTextId(objectProps.id);
            setActiveMenu("text");
          }).catch((error: any) => {
            console.error("Error adding text:", error);
          });
        }
      });

      setImageEditor(editor as unknown as TuiImageEditor);
    }, 100);
  });

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const editor = imageEditor();
    if (editor && typeof editor.loadImageFromFile === "function") {
      editor.loadImageFromFile(file);
    }
  };

  const handleDownload = () => {
    const editor = imageEditor();
    if (!editor || typeof editor.toDataURL !== "function") return;

    const dataURL = editor.toDataURL();
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "edited_image.png";
    link.click();
  };

  const handleCloseMenu = () => {
    const editor = imageEditor();
    if (editor && typeof editor.stopDrawingMode === "function") {
      try {
        editor.stopDrawingMode();
        setActiveMenu(null);
      } catch (error) {
        console.error("Error in handleCloseMenu:", error);
        // Force menu close even if there's an error
        setActiveMenu(null);
      }
    } else {
      setActiveMenu(null);
    }
  };

  return {
    imageEditor,
    activeMenu,
    currentTextId,
    setActiveMenu,
    setCurrentTextId,
    handleFileChange,
    handleDownload,
    handleCloseMenu,
  };
}
