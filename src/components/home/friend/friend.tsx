import { useAtom } from "solid-jotai";
import { createSignal, createEffect } from "solid-js";
import { friendsState } from "../../../utils/state";
import { createTakosDB } from "../../../utils/storage/idb";
import { homeSelectedAtom } from "../home";
import { TalkListFriend } from "./talkListConetent";

export const [encrypted, setEncrypted] = createSignal<string[]>([]);
export const [friendDetailId, setFriendDetailId] = createSignal<string | null>(null);
export function Friends() {
  const [selected, setSelected] = useAtom(homeSelectedAtom);
  const [friends] = useAtom(friendsState);

  createEffect(async () => {
    const db = await createTakosDB();
    const allowKeysData = await db.getAll("allowKeys");
    for (const allowKey of allowKeysData) {
      if (allowKey.latest === true) {
        setEncrypted((prev) => [...prev, allowKey.userId]);
      }
    }
  });
  return (
    <>
      {/* モーダル呼び出しを削除 */}
      <div class="flex items-center justify-between p-4">
        <div>
          <button
            class="text-blue-400 hover:text-blue-300 transition-colors"
            onClick={() => setSelected(null)}
          >
            戻る
          </button>
        </div>
        <h2 class="font-bold text-xl">友だちリスト</h2>
        <div class="w-10"></div> {/* バランス用の空要素 */}
      </div>
      <div class="p-4">
        {friends().map((friend) => <TalkListFriend friendId={friend} />)}
      </div>
    </>
  );
}