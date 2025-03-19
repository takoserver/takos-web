import { Component } from "solid-js";

interface Props {
  onFlipX: () => void;
  onFlipY: () => void;
  onReset: () => void;
  onClose: () => void;
}

export const FlipMenu: Component<Props> = (props) => {
  return (
    <div class="flex justify-center gap-2.5 p-2.5 bg-gray-100">
      <button
        class="px-2 py-1 bg-blue-500 text-white rounded"
        onClick={props.onFlipX}
      >
        Flip X
      </button>
      <button
        class="px-2 py-1 bg-blue-500 text-white rounded"
        onClick={props.onFlipY}
      >
        Flip Y
      </button>
      <button class="px-2 py-1 bg-gray-300 rounded" onClick={props.onReset}>
        Reset
      </button>
      <button class="px-2 py-1 bg-gray-300 rounded" onClick={props.onClose}>
        Close
      </button>
    </div>
  );
};
