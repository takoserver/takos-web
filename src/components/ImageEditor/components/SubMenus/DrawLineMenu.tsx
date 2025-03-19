import { Component } from "solid-js";

interface Props {
  brushWidth: () => number;
  onFreeDrawing: () => void;
  onLineDrawing: () => void;
  onWidthChange: (e: Event) => void;
  onClose: () => void;
}

export const DrawLineMenu: Component<Props> = (props) => {
  return (
    <div class="flex justify-center items-center gap-2.5 p-2.5 bg-gray-100">
      <button
        class="px-2 py-1 bg-blue-500 text-white rounded"
        onClick={props.onFreeDrawing}
      >
        Free
      </button>
      <button
        class="px-2 py-1 bg-blue-500 text-white rounded"
        onClick={props.onLineDrawing}
      >
        Line
      </button>
      <span>Width:</span>
      <input
        type="range"
        min="5"
        max="30"
        value={props.brushWidth()}
        onInput={props.onWidthChange}
        class="w-[100px]"
      />
      <button class="px-2 py-1 bg-gray-300 rounded" onClick={props.onClose}>
        Close
      </button>
    </div>
  );
};
