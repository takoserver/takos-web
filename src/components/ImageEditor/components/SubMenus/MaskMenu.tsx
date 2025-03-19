import { Component } from "solid-js";

interface Props {
  onLoadMask: (e: Event) => void;
  onApplyMask: () => void;
  onClose: () => void;
}

export const MaskMenu: Component<Props> = (props) => {
  return (
    <div class="flex justify-center gap-2.5 p-2.5 bg-gray-100">
      <input
        type="file"
        accept="image/*"
        id="mask-image"
        class="hidden"
        onChange={(e) => props.onLoadMask(e)}
      />
      <label
        for="mask-image"
        class="cursor-pointer bg-blue-500 text-white px-3 py-2 rounded"
      >
        Load Mask
      </label>
      <button
        class="px-2 py-1 bg-blue-500 text-white rounded"
        onClick={props.onApplyMask}
      >
        Apply Mask
      </button>
      <button class="px-2 py-1 bg-gray-300 rounded" onClick={props.onClose}>
        Close
      </button>
    </div>
  );
};
