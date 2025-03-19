import { Component } from "solid-js";

interface Props {
  onCrop: () => void;
  onFlip: () => void;
  onRotation: () => void;
  onDrawLine: () => void;
  onText: () => void;
  onMask: () => void;
}

export const ToolbarMenu: Component<Props> = (props) => {
  return (
    <div class="flex justify-around py-3.5 bg-white border-t border-gray-200">
      <button
        onClick={props.onCrop}
        class="bg-transparent border-0 text-base cursor-pointer"
      >
        ✂️ Crop
      </button>
      <button
        onClick={props.onFlip}
        class="bg-transparent border-0 text-base cursor-pointer"
      >
        🔄 Flip
      </button>
      <button
        onClick={props.onRotation}
        class="bg-transparent border-0 text-base cursor-pointer"
      >
        🔁 Rotate
      </button>
      <button
        onClick={props.onDrawLine}
        class="bg-transparent border-0 text-base cursor-pointer"
      >
        ✏️ Draw
      </button>
      <button
        onClick={props.onText}
        class="bg-transparent border-0 text-base cursor-pointer"
      >
        📝 Text
      </button>
      <button
        onClick={props.onMask}
        class="bg-transparent border-0 text-base cursor-pointer"
      >
        🎭 Mask
      </button>
    </div>
  );
};
