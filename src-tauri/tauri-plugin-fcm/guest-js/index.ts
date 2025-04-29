import {
  invoke,
  type PluginListener,
} from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';


/**
 * Listen for push notification opened events
 */
export async function onPushNotificationOpened(
  handler: (payload: {
    data: Record<string, string>;
    sentAt: Date;
    openedAt: Date;
  }) => void,
): Promise<any> {
  return await listen(
    "fcm://notification-opened",
    ({ payload }) => {
      const { data, sentAt, openedAt } = payload as any;
      handler({
        data: data || {}, 
        sentAt: new Date(sentAt), 
        openedAt: new Date(openedAt) 
      });
    },
  );
}

/**
 * Listen for push notification received events
 */
export async function onPushNotificationReceived(
  handler: (payload: Record<string, string>) => void,
): Promise<any> {
  return await listen(
    "fcm://push-received",
    ({ payload }) => {
      handler(payload as Record<string, string>);
    },
  );
}

/**
 * Get the latest FCM message data
 */
export async function getLatestNotificationData(): Promise<{
  data: Record<string, string>;
  sentAt: Date;
  openedAt: Date;
}> {
  const result = await invoke<{
    data: Record<string, string> | null;
    sentAt: number | null;
    openedAt: number | null;
  }>("plugin:fcm|get_latest_notification_data", { payload: {} });
  if (
    result.data === null || result.sentAt === null || result.openedAt === null
  ) {
    throw new Error("No notification data available");
  }
  return {
    data: result.data,
    sentAt: new Date(result.sentAt),
    openedAt: new Date(result.openedAt),
  };
}


/**
 * Get the FCM token
 */
export async function getFCMToken(): Promise<string> {
  const result = await invoke<{ token: string }>("plugin:fcm|get_token", {
    payload: {},
  });
  if (!result || typeof result !== "object") {
    throw new Error("Invalid token response");
  }
  console.log(result);
  // 戻り値が文字列の場合
  if (typeof result === "string") {
    return result;
  }

  // 戻り値がオブジェクトの場合（{ token: "xxx" } や他の形式を想定）
  if ("token" in result && typeof result.token === "string") {
    return result.token;
  }

  console.error("Unexpected token format:", result);
  throw new Error("Failed to retrieve FCM token");
}
/**
 * Subscribe to a topic
 */
export async function subscribeToTopic(topic: string): Promise<void> {
  await invoke("plugin:fcm|subscribe_to_topic", {
    payload: {
      topic,
    },
  });
  return;
}
