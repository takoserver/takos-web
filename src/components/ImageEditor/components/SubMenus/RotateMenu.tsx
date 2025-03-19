import { Component } from "solid-js";

interface Props {
  angle: () => number;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onAngleChange: (e: Event) => void;
  onClose: () => void;
}

export const RotateMenu: Component<Props> = (props) => {
  return (
    <div class="flex justify-center items-center gap-2.5 p-2.5 bg-gray-100">
      <button
        class="px-2 py-1 bg-blue-500 text-white rounded"
        onClick={props.onRotateLeft}
      >
        -30°
      </button>
      <input
        type="range"
        min="-360"
        max="360"
        value={props.angle()}
        onInput={props.onAngleChange}
        class="w-[150px]"
      />
      <button
        class="px-2 py-1 bg-blue-500 text-white rounded"
        onClick={props.onRotateRight}
      >
        +30°
      </button>
      <button class="px-2 py-1 bg-gray-300 rounded" onClick={props.onClose}>
        Close
      </button>
    </div>
  );
};
