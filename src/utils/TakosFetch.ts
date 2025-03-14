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
    //tauri
  }
  return fetch(input, init);
}
