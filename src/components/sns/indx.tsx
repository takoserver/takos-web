import { createEffect, createSignal, For, onMount, Show } from "solid-js";

// APIリクエスト用の関数
const API_BASE_URL = "/api/v2/sns";

async function fetchTimeline() {
  const response = await fetch(`${API_BASE_URL}/timeline`);
  if (!response.ok) {
    throw new Error("タイムラインの取得に失敗しました");
  }
  return response.json();
}

async function createPost(text: string, media: string[] = []) {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, media }),
  });

  if (!response.ok) {
    throw new Error("投稿の作成に失敗しました");
  }

  return response.json();
}

async function likePost(userId: string, postId: string) {
  const response = await fetch(
    `${API_BASE_URL}/posts/${userId}/${postId}/like`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("いいねに失敗しました");
  }

  return response.json();
}

async function unlikePost(userId: string, postId: string) {
  const response = await fetch(
    `${API_BASE_URL}/posts/${userId}/${postId}/like`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error("いいねの解除に失敗しました");
  }

  return response.json();
}

async function createStory(media: string) {
  const response = await fetch(`${API_BASE_URL}/stories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ media }),
  });

  if (!response.ok) {
    throw new Error("ストーリーの作成に失敗しました");
  }

  return response.json();
}

export default function Sns() {
  const [likedPosts, setLikedPosts] = createSignal<string[]>([]);
  const [showCreatePost, setShowCreatePost] = createSignal(false);
  const [postText, setPostText] = createSignal("");
  const [postImage, setPostImage] = createSignal<string | null>(null);

  // タイプ定義をサーバーレスポンスに合わせて更新
  const [posts, setPosts] = createSignal<{
    id: string;
    content: string;
    createdAt: string;
    media: string[];
    author: {
      userName: string;
      domain: string;
    };
    stats: {
      likes: number;
      hasLiked: boolean;
    };
    isRemote: boolean;
  }[]>([]);

  const [stories, setStories] = createSignal<{
    id: string;
    mediaUrl: string;
    mediaType: string;
    createdAt: string;
    expiresAt: string;
    author: {
      userName: string;
      displayName: string;
      avatar: string | null;
      domain: string;
    };
    viewed: boolean;
    isRemote: boolean;
  }[]>([]);

  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  // タイムラインデータを取得する関数を修正
  async function loadTimeline() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTimeline();
      console.log("タイムラインデータ:", data);

      // APIのレスポンス形式にそのまま合わせる
      setPosts(data.posts || []);
      setStories(data.stories || []);
    } catch (err) {
      console.error("タイムラインの取得中にエラーが発生しました:", err);
      setError("データの取得に失敗しました。後でもう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  // コンポーネントがマウントされたときにデータを取得
  onMount(() => {
    loadTimeline();
  });

  const handleLike = async (post: any) => {
    try {
      // postIdとuserIdを抽出
      const postId = post.id.split("/").pop();
      const username = post.author.userName.split("@")[0];

      if (post.stats.hasLiked) {
        await unlikePost(username, postId);
      } else {
        await likePost(username, postId);
      }

      // いいね操作後にタイムラインを再取得
      await loadTimeline();
    } catch (err) {
      console.error("いいね操作中にエラーが発生しました:", err);
      setError("いいねの操作に失敗しました。");
    }
  };

  const handleCreatePost = async () => {
    try {
      setError(null);
      const mediaArr = postImage() ? [postImage()!] : [];
      await createPost(postText(), mediaArr);

      // 投稿作成後にタイムラインを再取得
      await loadTimeline();

      // 投稿作成後にUIを閉じてフォームをリセット
      setPostText("");
      setPostImage(null);
      setShowCreatePost(false);
    } catch (err) {
      console.error("投稿作成中にエラーが発生しました:", err);
      setError("投稿の作成に失敗しました。");
    }
  };

  const handleImageUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPostImage(e.target?.result as string);
      };
      reader.readAsDataURL(input.files[0]);
    }
  };

  return (
    <div class="max-w-xl mx-auto p-4 relative min-h-[80vh]">
      <Show when={!showCreatePost()}>
        {/* エラーメッセージ表示 */}
        <Show when={error()}>
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error()}
          </div>
        </Show>

        {/* ローディング表示 */}
        <Show when={loading()}>
          <div class="flex justify-center items-center my-8">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500">
            </div>
          </div>
        </Show>

        {/* ストーリーセクション */}
        <div class="mb-4 pb-4 border-b border-gray-200">
          <div class="flex overflow-x-auto scrollbar-hide py-2 lg:scrollbar">
            <Show
              when={stories().length > 0}
              fallback={
                <div class="w-full text-center py-2">
                  <div class="text-gray-500 text-sm">
                    ストーリーはまだありません
                  </div>
                </div>
              }
            >
              <For each={stories()}>
                {(story) => (
                  <div class="flex flex-col items-center mr-4 min-w-[70px]">
                    <div
                      class={`w-16 h-16 rounded-full p-0.5 mb-1 ${
                        story.viewed
                          ? "bg-gray-200"
                          : "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600"
                      }`}
                    >
                      <img
                        src={story.author.avatar ||
                          "https://placehold.jp/50x50.png"}
                        alt={story.author.displayName}
                        class="w-full h-full rounded-full border-2 border-white"
                      />
                    </div>
                    <span class="text-xs text-center truncate w-full">
                      {story.author.displayName}
                    </span>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>

        {/* 投稿セクション - 更新されたデータ構造に合わせる */}
        <div class="flex flex-col gap-6">
          <Show
            when={posts().length > 0}
            fallback={
              <div class="border border-gray-200 rounded-lg overflow-hidden p-8 text-center">
                <div class="text-gray-500 mb-2">投稿はまだありません</div>
                <div class="text-sm text-gray-400">
                  フォローしているユーザーの投稿がここに表示されます
                </div>
              </div>
            }
          >
            <For each={posts()}>
              {(post) => (
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                  {/* 共通ヘッダー */}
                  <div class="flex justify-between items-center p-3 border-b border-gray-100">
                    <div class="flex items-center gap-2.5">
                      <img
                        src={post.author.avatar ||
                          "https://placehold.jp/50x50.png"}
                        alt={post.author.userName}
                        class="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div class="flex items-center gap-1">
                          <span class="font-semibold text-sm">
                            {post.author.userName.split("@")[0]}
                          </span>
                          <span class="text-xs text-gray-500">
                            @{post.author.domain}
                          </span>
                        </div>
                        <span class="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div class="text-xl text-gray-500">⋯</div>
                  </div>

                  {/* キャプション */}
                  <div class="px-4 py-3 text-sm">
                    {post.content}
                  </div>

                  {/* 画像がある場合のみ表示 */}
                  {post.media && post.media.length > 0 && (
                    <div class="w-full">
                      <img
                        src={post.media[0]}
                        alt="投稿画像"
                        class="w-full h-auto rounded-lg"
                      />
                    </div>
                  )}

                  {/* 共通のアクションボタン */}
                  <div class="flex justify-between p-3 text-gray-500 border-t border-gray-100">
                    <button
                      class="flex items-center gap-1.5 hover:text-red-500"
                      onClick={() => handleLike(post)}
                    >
                      <span class="text-xl">
                        {post.stats.hasLiked ? "❤️" : "🤍"}
                      </span>
                      <span>{post.stats.likes}</span>
                    </button>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>

        {/* 投稿作成ボタン */}
        <button
          onClick={() => setShowCreatePost(true)}
          class="bottom-6 sticky bg-blue-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors left-[360px]"
          aria-label="投稿を作成"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </Show>

      {/* 投稿作成UI */}
      <Show when={showCreatePost()}>
        <div class="absolute inset-0 bg-white z-10 flex flex-col overflow-hidden rounded-lg shadow-lg">
          <div class="flex justify-between items-center border-b border-gray-200 p-4">
            <button
              onClick={() => setShowCreatePost(false)}
              class="text-gray-500"
            >
              キャンセル
            </button>
            <h2 class="font-bold text-lg">新規投稿</h2>
            <button
              onClick={handleCreatePost}
              class="bg-blue-500 text-white px-4 py-1 rounded-full disabled:opacity-50"
              disabled={!postText() && !postImage()}
            >
              投稿
            </button>
          </div>

          {/* エラーメッセージ表示 */}
          <Show when={error()}>
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 my-2">
              {error()}
            </div>
          </Show>

          <div class="flex-1 overflow-auto p-4">
            <textarea
              value={postText()}
              onInput={(e) => setPostText(e.target.value)}
              placeholder="いまどうしてる？"
              class="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
            </textarea>

            {postImage() && (
              <div class="relative mt-4">
                <img
                  src={postImage()!}
                  alt="アップロード画像"
                  class="max-w-full h-auto rounded-lg"
                />
                <button
                  onClick={() => setPostImage(null)}
                  class="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div class="border-t border-gray-200 p-4 flex justify-around">
            <label class="cursor-pointer flex items-center justify-center w-12 h-12 text-blue-500">
              <input
                type="file"
                accept="image/*"
                class="hidden"
                onChange={handleImageUpload}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </label>
          </div>
        </div>
      </Show>
    </div>
  );
}
