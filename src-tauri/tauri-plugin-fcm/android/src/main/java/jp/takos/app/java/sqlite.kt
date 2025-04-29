package jp.takos.app.java

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class SQLiteManager(private val context: Context) {
    private val databases = mutableMapOf<String, DatabaseHelper>()

    // Tauriの`Database.load`と互換性のある実装
    fun load(path: String): DatabaseHelper {
        if (!databases.containsKey(path)) {
            // SQLiteプロトコルプレフィックスをサポート
            val dbPath = if (path.startsWith("sqlite:")) path.substring(7) else path
            val dbFile = File(context.dataDir, dbPath)
            val dbHelper = DatabaseHelper(context, dbFile.absolutePath)
            databases[path] = dbHelper
        }
        return databases[path]!!
    }

    // データベース接続を閉じる
    fun close(path: String): Boolean {
        return databases.remove(path)?.close() ?: false
    }

    // データベースヘルパークラス
    inner class DatabaseHelper(context: Context, private val dbPath: String) : SQLiteOpenHelper(
        context, dbPath, null, 1
    ) {
        // SELECTクエリを実行して結果を返す
        fun select(query: String, params: List<Any>): JSONArray {
            val db = readableDatabase
            val cursor = db.rawQuery(bindParams(query, params), null)
            val result = JSONArray()

            if (cursor.moveToFirst()) {
                val columnCount = cursor.columnCount
                val columnNames = (0 until columnCount).map { cursor.getColumnName(it) }

                do {
                    val row = JSONObject()
                    for (i in 0 until columnCount) {
                        val columnName = columnNames[i]
                        when (cursor.getType(i)) {
                            android.database.Cursor.FIELD_TYPE_STRING -> row.put(columnName, cursor.getString(i))
                            android.database.Cursor.FIELD_TYPE_INTEGER -> row.put(columnName, cursor.getLong(i))
                            android.database.Cursor.FIELD_TYPE_FLOAT -> row.put(columnName, cursor.getDouble(i))
                            android.database.Cursor.FIELD_TYPE_BLOB -> row.put(columnName, cursor.getBlob(i))
                            android.database.Cursor.FIELD_TYPE_NULL -> row.put(columnName, JSONObject.NULL)
                        }
                    }
                    result.put(row)
                } while (cursor.moveToNext())
            }
            cursor.close()
            return result
        }

        // 更新/挿入/削除クエリを実行
        fun execute(query: String, params: List<Any>): JSONObject {
            val db = writableDatabase
            db.execSQL(bindParams(query, params), params.toTypedArray())
            
            // 最後に挿入されたIDと影響を受けた行数を取得
            val lastId = getLastInsertId(db)
            val rowsAffected = 0 // AndroidのSQLiteでは影響を受けた行数を簡単に取得できない
            
            val result = JSONObject()
            result.put("lastInsertId", lastId)
            result.put("rowsAffected", rowsAffected)
            return result
        }

        // トランザクションで複数のクエリを実行
        fun batch(queries: List<Pair<String, List<Any>>>): JSONArray {
            val results = JSONArray()
            val db = writableDatabase
            
            db.beginTransaction()
            try {
                for ((query, params) in queries) {
                    val result = if (query.trim().lowercase().startsWith("select")) {
                        select(query, params)
                    } else {
                        execute(query, params)
                    }
                    results.put(result)
                }
                db.setTransactionSuccessful()
            } finally {
                db.endTransaction()
            }
            
            return results
        }

        // 最後に挿入されたIDを取得するヘルパー関数
        private fun getLastInsertId(db: SQLiteDatabase): Long {
            val cursor = db.rawQuery("SELECT last_insert_rowid()", null)
            var lastId = 0L
            if (cursor.moveToFirst()) {
                lastId = cursor.getLong(0)
            }
            cursor.close()
            return lastId
        }

        // クエリにパラメータをバインドするヘルパー関数
        private fun bindParams(query: String, params: List<Any>): String {
            var paramIndex = 0
            return query.replace(Regex("\\$\\d+")) { 
                when (params[paramIndex++]) {
                    is String -> "?"
                    is Int, is Long -> "?"
                    is Float, is Double -> "?"
                    is ByteArray -> "?"
                    else -> "?"
                }
            }
        }

        override fun onCreate(db: SQLiteDatabase) {
            // データベースの初期化ロジック
        }

        override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
            // バージョンアップデートのロジック
        }
    }
}
