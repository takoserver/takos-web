import { invoke, addPluginListener, type PluginListener } from '@tauri-apps/api/core'


/**
 * Listen to FCM messages data
 */
export async function onPushNotificationOpened(
  handler: (payload: {
    data: Record<string, string>
    sentAt: Date
    openedAt: Date
  }) => void
): Promise<PluginListener> {
  return await addPluginListener(
    'fcm',
    'pushNotificationOpened',
    ({ data, openedAt, sentAt }: {
      data: Record<string, string>
      sentAt: number
      openedAt: number
    }) => {
      handler({ data, sentAt: new Date(sentAt), openedAt: new Date(openedAt) })
    }
  );
}

/**
 * Get the latest FCM message data
 */
export async function getLatestNotificationData(): Promise<{
  data: Record<string, string>
  sentAt: Date
  openedAt: Date
}> {
  const result = await invoke<{
    data: Record<string, string> | null
    sentAt: number | null
    openedAt: number | null
  }>('plugin:fcm|get_latest_notification_data', { payload: {} });
  if (result.data === null || result.sentAt === null || result.openedAt === null) {
    throw new Error('No notification data available')
  }
  return {
    data: result.data,
    sentAt: new Date(result.sentAt),
    openedAt: new Date(result.openedAt),
  }
}


/**
 * Get the FCM token
*/
export async function getFCMToken(): Promise<string> {
  const result = await invoke<{ token: string }>('plugin:fcm|get_token', { payload: {} });
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid token response');
  }
  console.log(result)
  // 戻り値が文字列の場合
  if (typeof result === 'string') {
    return result;
  }
  
  // 戻り値がオブジェクトの場合（{ token: "xxx" } や他の形式を想定）
  if ('token' in result && typeof result.token === 'string') {
    return result.token;
  }
  
  console.error('Unexpected token format:', result);
  throw new Error('Failed to retrieve FCM token');
}
/**
 * Subscribe to a topic
 */
export async function subscribeToTopic(topic: string): Promise<void> {
  await invoke('plugin:fcm|subscribe_to_topic', {
    payload: {
      topic,
    },
  });
  return
}