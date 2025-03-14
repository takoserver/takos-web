import { useAtom } from "solid-jotai";
import { createRoot } from "solid-js";
import { decryptIdentityKey, getAllIdentityKeys } from "../storage/idb";
import { shoowIdentityKeyPopUp } from "../../components/encrypted/CreateIdentityKeyPopUp";

export async function getIdentityKeys(deviceKeyVal: string) {
  return createRoot(async () => {
    const [showIdentityKeyPopUp, setShowIdentityKeyPopUp] = useAtom(
      shoowIdentityKeyPopUp,
    );
    const identityKeys = await getAllIdentityKeys();
    const latestIdentityKey = identityKeys.sort((a, b) =>
      b.timestamp - a.timestamp
    )[0];

    if (!latestIdentityKey) {
      setShowIdentityKeyPopUp(true);
      return { decryptedIdentityKey: null, latestIdentityKey: null };
    }

    const decryptedIdentityKey = await decryptIdentityKey({
      deviceKey: deviceKeyVal,
      encryptedIdentityKey: latestIdentityKey.encryptedKey,
    });

    return { decryptedIdentityKey, latestIdentityKey };
  });
}
