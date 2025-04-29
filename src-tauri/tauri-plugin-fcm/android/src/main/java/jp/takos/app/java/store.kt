package jp.takos.app.java

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class Store(private val context: Context) {
    private val stores = mutableMapOf<String, StoreInstance>()

    // ストアインスタンスを取得または作成
    fun getStore(name: String): StoreInstance {
        if (!stores.containsKey(name)) {
            stores[name] = StoreInstance(context, name)
        }
        return stores[name]!!
    }

    // ストア実装
    inner class StoreInstance(context: Context, name: String) {
        private val prefs: SharedPreferences = context.getSharedPreferences(name, Context.MODE_PRIVATE)

        // キーに値を設定
        fun set(key: String, value: Any?): Boolean {
            val editor = prefs.edit()
            
            when (value) {
                null -> editor.remove(key)
                is String -> editor.putString(key, value)
                is Int -> editor.putInt(key, value)
                is Long -> editor.putLong(key, value)
                is Float -> editor.putFloat(key, value)
                is Double -> editor.putFloat(key, value.toFloat())
                is Boolean -> editor.putBoolean(key, value)
                is JSONObject, is JSONArray -> editor.putString(key, value.toString())
                else -> editor.putString(key, value.toString())
            }
            
            return editor.commit()
        }

        // キーから値を取得
        fun get(key: String, defaultValue: Any? = null): Any? {
            if (!prefs.contains(key)) {
                return defaultValue
            }
            
            // 保存された値から型を判断
            val strValue = prefs.getString(key, null)
            if (strValue != null) {
                // JSONとして解析を試みる
                if (strValue.startsWith("{") && strValue.endsWith("}")) {
                    try {
                        return JSONObject(strValue)
                    } catch (e: Exception) {
                        // 有効なJSONオブジェクトではない
                    }
                } else if (strValue.startsWith("[") && strValue.endsWith("]")) {
                    try {
                        return JSONArray(strValue)
                    } catch (e: Exception) {
                        // 有効なJSON配列ではない
                    }
                }
                return strValue
            }
            
            // 他のプリミティブ型を試す
            try { return prefs.getInt(key, 0) } catch (e: Exception) {}
            try { return prefs.getLong(key, 0) } catch (e: Exception) {}
            try { return prefs.getFloat(key, 0f) } catch (e: Exception) {}
            try { return prefs.getBoolean(key, false) } catch (e: Exception) {}
            
            return defaultValue
        }

        // キーが存在するか確認
        fun has(key: String): Boolean {
            return prefs.contains(key)
        }

        // キーを削除
        fun delete(key: String): Boolean {
            if (!prefs.contains(key)) {
                return false
            }
            return prefs.edit().remove(key).commit()
        }

        // すべてのキーをクリア
        fun clear(): Boolean {
            return prefs.edit().clear().commit()
        }

        // すべてのキーを取得
        fun keys(): List<String> {
            return prefs.all.keys.toList()
        }

        // すべてのエントリを取得
        fun entries(): Map<String, Any?> {
            val result = mutableMapOf<String, Any?>()
            
            for (key in prefs.all.keys) {
                result[key] = get(key)
            }
            
            return result
        }

        // JSONファイルに保存
        fun save(path: String): Boolean {
            try {
                val json = JSONObject()
                for (key in prefs.all.keys) {
                    json.put(key, get(key))
                }
                
                val file = File(context.dataDir, path)
                file.parentFile?.mkdirs()
                file.writeText(json.toString(2))
                return true
            } catch (e: Exception) {
                e.printStackTrace()
                return false
            }
        }

        // JSONファイルから読み込み
        fun load(path: String): Boolean {
            try {
                val file = File(context.dataDir, path)
                if (!file.exists()) {
                    return false
                }
                
                val json = JSONObject(file.readText())
                val editor = prefs.edit()
                editor.clear()
                
                for (key in json.keys()) {
                    val value = json.get(key)
                    when (value) {
                        JSONObject.NULL -> editor.remove(key)
                        is String -> editor.putString(key, value)
                        is Int -> editor.putInt(key, value)
                        is Long -> editor.putLong(key, value)
                        is Float -> editor.putFloat(key, value)
                        is Double -> editor.putFloat(key, value.toFloat())
                        is Boolean -> editor.putBoolean(key, value)
                        is JSONObject, is JSONArray -> editor.putString(key, value.toString())
                    }
                }
                
                return editor.commit()
            } catch (e: Exception) {
                e.printStackTrace()
                return false
            }
        }
    }
}
