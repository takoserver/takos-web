import { onMount, onCleanup } from "solid-js";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

type Props = {
  src: string;
  onCropped?: (dataUrl: string) => void;
};

export default function SolidCropper(props: Props) {
  let imageRef: HTMLImageElement;
  let cropper: Cropper;

  onMount(() => {
    cropper = new Cropper(imageRef, {
      aspectRatio: 1,
      viewMode: 1,
    });
  });

  onCleanup(() => {
    cropper?.destroy();
  });

  const handleCrop = () => {
    if (cropper && props.onCropped) {
      props.onCropped(cropper.getCroppedCanvas().toDataURL());
    }
  };

  return (
    <>
      <img ref={imageRef} src={props.src} />
      <button onClick={handleCrop}>トリミング</button>
    </>
  );
}
