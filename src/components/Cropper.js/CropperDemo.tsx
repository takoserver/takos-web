import { createSignal, JSX, onCleanup, onMount } from "solid-js";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import SolidCropper from "./SolidCropper";
import image from "./Image"

const CropperDemo = () => {
  let previewRef: HTMLImageElement;

  const handleCropped = (dataUrl: string) => {
    previewRef.src = dataUrl;
  };

  return (
    <>
      <div class="h-screen">
        <div class="h-1/2 m-auto w-1/2">
          <SolidCropper
            src={image}
            onCropped={handleCropped}
          />
        </div>
        <div>
          <img ref={previewRef} />
        </div>
      </div>
    </>
  );
};

export default CropperDemo;
