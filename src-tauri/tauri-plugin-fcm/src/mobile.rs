use serde::de::DeserializeOwned;
use serde_json::{json, Value};
use tauri::{
  plugin::{PluginApi, PluginHandle},
  AppHandle, Emitter, Runtime, ipc::{Channel, InvokeResponseBody},
};

use crate::models::*;

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "com.plugin.fcm";

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_fcm);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  api: PluginApi<R, C>,
) -> crate::Result<Fcm<R>> {
  #[cfg(target_os = "android")]
  let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "FCMPlugin")?;
  
  // 通知が開かれたイベントのハンドラーを設定
  #[cfg(target_os = "android")]
  {
    let app_handle = app.clone();
    handle.run_mobile_plugin::<()>(
      "setNotificationOpenedHandler",
      EventHandler {
        handler: Channel::new(move |event| {
          match event {
            InvokeResponseBody::Json(json_string) => {
              if let Ok(payload) = serde_json::from_str::<Value>(&json_string) {
                let _ = app_handle.emit("fcm://notification-opened", payload);
              }
            },
            _ => {
              let _ = app_handle.emit(
                "fcm://notification-opened",
                json!({ "error": "Unsupported response type" }),
              );
            }
          }
          Ok(())
        }),
      },
    )?;


    // プッシュ通知を受信したイベントのハンドラーを設定
    let app_handle = app.clone();
    handle.run_mobile_plugin::<()>(
      "setPushReceivedHandler",
      EventHandler {
        handler: Channel::new(move |event| {

          
          // デバッグ用にrust側でnotificationを送信したい

          match event {
            InvokeResponseBody::Json(json_string) => {
              if let Ok(payload) = serde_json::from_str::<Value>(&json_string) {
                let _ = app_handle.emit("fcm://push-received", payload);
              }
            },
            _ => {
              let _ = app_handle.emit(
                "fcm://push-received",
                json!({ "error": "Unsupported response type" }),
              );
            }
          }
          Ok(())
        }),
      },
    )?;
  }
  
  #[cfg(target_os = "ios")]
  let handle = api.register_ios_plugin(init_plugin_fcm)?;
  
  Ok(Fcm(handle))
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct EventHandler {
  handler: Channel,
}

/// Access to the fcm APIs.
pub struct Fcm<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> Fcm<R> {
  pub fn get_latest_notification_data(&self, payload: GetLatestNotificationDataRequest) -> crate::Result<GetLatestNotificationDataResponse> {
    self
      .0
      .run_mobile_plugin("getLatestNotificationData", payload)
      .map_err(Into::into)
  }

  pub fn get_token(&self, payload: GetTokenRequest) -> crate::Result<GetTokenResponse> {
    self
      .0
      .run_mobile_plugin("getToken", payload)
      .map_err(Into::into)
  }

  pub fn subscribe_to_topic(&self, payload: SubscribeToTopicRequest) -> crate::Result<SubscribeToTopicResponse> {
    self
      .0
      .run_mobile_plugin("subscribeToTopic", payload)
      .map_err(Into::into)
  }
}
