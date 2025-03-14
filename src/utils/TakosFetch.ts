import { fetch as TauriFetch } from '@tauri-apps/plugin-http';
import { load } from '@tauri-apps/plugin-store';
let store: any

if(window.isApp === true) {
    store = await load('cookie.json', { autoSave: false });
}

declare global {
  interface Window {
    isApp?: boolean;
    serverEndpoint?: string;
  }
}
export async function TakosFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (window.isApp === true) {
    const cookie = await store.get('cookie');
    // クッキーをリクエストヘッダーに追加
    const headers = init?.headers ? new Headers(init.headers) : new Headers();
    if (cookie) {
      headers.set('Cookie', cookie as string);
    }
    // 元のinitを基にして新しいinitを作成、headersを上書き
    const newInit = { ...init, headers };
    
    // 入力がすでに完全なURLかどうかをチェック
    const url = typeof input === 'string' && 
      (input.startsWith('http://') || input.startsWith('https://')) ? 
      input : `https://${window.serverEndpoint}${input}`;
    
    // レスポンスを取得して処理
    const response = await TauriFetch(url, newInit);
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
        console.log('set-cookie', cookies);
        await store.set('cookie', cookies);
    }
    // レスポンスをクローンして返す（ストリームの二重消費を防ぐ）
    return response.clone();
  }
  return fetch(input, init);
}
function extractSessionId(cookieString: string): string | null {
    const sessionIdMatch = cookieString.match(/sessionid=([^;]+)/);
    return sessionIdMatch ? sessionIdMatch[1] : null;
}

export async function getTauriSessionId(): Promise<string> {
    const cookie = await store.get('cookie') as string;
    if (!cookie) {
        throw new Error('Cookie not found');
    }
    return extractSessionId(cookie)!;
}