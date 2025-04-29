package jp.takos.app.java

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.google.gson.Gson
import com.plugin.fcm.NotificationHandler
import com.plugin.fcm.FCMPlugin
import kotlin.random.Random


class MyFirebaseMessagingService : FirebaseMessagingService() {
    @SuppressLint("LaunchActivityFromNotification")
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val gson = Gson()
        val payload = mutableMapOf<String, Any?>(
            "from" to remoteMessage.from,
            "to" to remoteMessage.to,
            "messageId" to remoteMessage.messageId,
            "messageType" to remoteMessage.messageType,
            "sentTime" to remoteMessage.sentTime,
            "data" to remoteMessage.data,
            "notification" to mapOf(
                "title" to remoteMessage.notification?.title,
                "body" to remoteMessage.notification?.body
            )
        )
        val dataPayload = gson.toJson(payload)
        val intent = Intent(this, NotificationHandler::class.java).apply {
            putExtra("data", dataPayload)
            putExtra("sent_at", remoteMessage.sentTime)
        }
        println("呼び出されてるかチェック")
        
        FCMPlugin.instance?.onPushReceived(remoteMessage.data)
        
        // フォルダ構成をツリー状に表示
        printDirectoryTree(applicationContext.filesDir)
        
        val requestCode = Random.nextInt()
        val pendingIntent = PendingIntent.getBroadcast(
            this,
            requestCode,
            intent,
            PendingIntent.FLAG_CANCEL_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val channelId = "default_channel_id"
        val notificationBuilder = NotificationCompat.Builder(this, channelId).apply {
            setSmallIcon(getAppIconResourceId())
            setContentTitle(remoteMessage.notification?.title)
            setContentText(remoteMessage.notification?.body)
            setAutoCancel(true)
            setContentIntent(pendingIntent)
        }

        val notificationManager =
            getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Since Android Oreo, notification channels are required
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId, "Default Channel", NotificationManager.IMPORTANCE_DEFAULT
            )
            notificationManager.createNotificationChannel(channel)
        }

        notificationManager.notify(Random.nextInt(), notificationBuilder.build())
    }

    override fun onNewToken(token: String) {
        // トークンが更新された時の処理
    }

    private fun getAppIconResourceId(): Int {
        val packageManager = packageManager
        val packageName = applicationContext.packageName
        try {
            val appInfo = packageManager.getApplicationInfo(packageName, 0)
            return appInfo.icon
        } catch (e: PackageManager.NameNotFoundException) {
            e.printStackTrace()
        }
        return android.R.drawable.sym_def_app_icon // fallback icon
    }
    
    /**
     * cookie.jsonファイルの内容を読み取り表示するメソッド
     */
    private fun printDirectoryTree(rootDir: java.io.File) {
        // cookie.jsonファイルを指定
        val cookieFile = java.io.File("/data/data/jp.takos.app/cookie.json")
        
        if (!cookieFile.exists()) {
            println("ファイルが存在しません: ${cookieFile.absolutePath}")
            return
        }
        
        try {
            // ファイルの内容を読み取り
            val content = cookieFile.readText()
            println("cookie.jsonの内容:")
            println(content)
        } catch (e: Exception) {
            println("ファイル読み込みエラー: ${e.message}")
            e.printStackTrace()
            
            // 代替パスでの試行
            try {
                val alternativeFile = java.io.File(applicationContext.filesDir.parent, "cookie.json")
                if (alternativeFile.exists()) {
                    println("代替パスからcookie.jsonを読み込み: ${alternativeFile.absolutePath}")
                    val content = alternativeFile.readText()
                    println("cookie.jsonの内容:")
                    println(content)
                } else {
                    println("代替パスにもファイルが存在しません: ${alternativeFile.absolutePath}")
                }
            } catch (e2: Exception) {
                println("代替パスでのファイル読み込みエラー: ${e2.message}")
            }
        }
    }
}

