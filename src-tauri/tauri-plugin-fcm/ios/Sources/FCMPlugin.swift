import SwiftRs
import Tauri
import UIKit
import WebKit

import FirebaseCore
import FirebaseMessaging

class PingArgs: Decodable {
  let value: String?
}


class FCMPlugin: Plugin {
  @objc public override func load(webview: WKWebView) {
    Messaging.messaging().delegate = self
    let options = FirebaseOptions(googleAppID: "1:1021576416014:ios:bc24cce0c163c12943a55f", gcmSenderID: "1021576416014")
    options.apiKey = "AIzaSyAaJJWD7WnvLsVqVPSUmI0vmOd25ncDL2E"
    FirebaseApp.configure(options: options)
  }

  @objc public func getToken(_ invoke: Invoke) {
    Messaging.messaging().token { token, error in
      if let error = error {
        invoke.reject(error.localizedDescription)
      } else if let token = token {
        invoke.resolve(["token": token])
      } else {
        invoke.reject("Cannot get token")
      }
    }
  }
}

@_cdecl("init_plugin_fcm")
func initPlugin() -> Plugin {
  return FCMPlugin()
}

