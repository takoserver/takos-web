import { Component } from "solid-js";
import { AspectRatio } from "../../types";

interface Props {
  onApply: () => void;
  onCancel: () => void;
  aspectRatio: () => AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
}

export const CropMenu: Component<Props> = (props) => {
  const aspectRatios: AspectRatio[] = [
    "free",
    "1:1",
    "4:3",
    "16:9",
    "3:2",
    "2:3",
  ];

  return (
    <div class="flex flex-wrap justify-center gap-2.5 p-2.5 bg-gray-100">
      <div class="w-full flex justify-center gap-2 mb-2">
        <span>アスペクト比:</span>
        <select
          value={props.aspectRatio()}
          onChange={(e) =>
            props.onAspectRatioChange(e.target.value as AspectRatio)}
          class="px-2 py-1 rounded border border-gray-300"
        >
          {aspectRatios.map((ratio) => (
            <option value={ratio}>{ratio === "free" ? "自由" : ratio}</option>
          ))}
        </select>
      </div>
      <button
        class="px-3 py-1 bg-blue-500 text-white rounded"
        onClick={props.onApply}
      >
        適用
      </button>
      <button class="px-3 py-1 bg-gray-300 rounded" onClick={props.onCancel}>
        キャンセル
      </button>
    </div>
  );
};
