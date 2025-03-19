import { Component } from "solid-js";

interface Props {
  fontSize: () => number;
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onFontSizeChange: (e: Event) => void;
  onAddText: () => void;
  onClose: () => void;
}

export const TextMenu: Component<Props> = (props) => {
  return (
    <div class="flex justify-center flex-wrap gap-2.5 p-2.5 bg-gray-100">
      <button
        class="font-bold px-2 py-1 bg-gray-200 rounded"
        onClick={() => props.onBold()}
      >
        B
      </button>
      <button
        class="italic px-2 py-1 bg-gray-200 rounded"
        onClick={() => props.onItalic()}
      >
        I
      </button>
      <button
        class="underline px-2 py-1 bg-gray-200 rounded"
        onClick={() => props.onUnderline()}
      >
        U
      </button>
      <div class="flex items-center gap-1.5">
        <span>Size:</span>
        <input
          type="range"
          min="10"
          max="100"
          value={props.fontSize()}
          onInput={props.onFontSizeChange}
          class="w-[80px]"
        />
        <span>{props.fontSize()}px</span>
      </div>
      <button
        onClick={props.onAddText}
        class="bg-blue-500 text-white border-none py-1 px-2.5 rounded"
      >
        テキストを追加
      </button>
      <button class="px-2 py-1 bg-gray-300 rounded" onClick={props.onClose}>
        Close
      </button>
      <div class="w-full text-center mt-1.5 text-xs">
        テキスト編集のヒント: 「テキストを追加」ボタンをクリック →
        ダブルクリックで編集
      </div>
    </div>
  );
};
