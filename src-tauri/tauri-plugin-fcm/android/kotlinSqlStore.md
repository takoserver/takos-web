# Android SQLite および Store の使用方法

このドキュメントでは、TauriのSQLとStoreプラグインに互換性のあるAndroid実装の使用方法を説明します。

## SQLite 実装

SQLite実装により、TauriのSQLプラグインと互換性のある方法でAndroidアプリケーションでSQLiteデータベースを操作できます。

### 機能

- データベース接続管理
- SQLクエリ実行
- トランザクションサポート

### 基本的な使用方法

```kotlin
// SQLite マネージャーを取得
val sqliteManager = SQLiteManager(context)

// データベースをロードまたは作成
val db = sqliteManager.load("mydatabase.db")

// SELECT クエリを実行
val results = db.select(
    "SELECT * FROM users WHERE age > $1",
    listOf(18)
)

// INSERT クエリを実行
val result = db.execute(
    "INSERT INTO users (name, age) VALUES ($1, $2)",
    listOf("鈴木太郎", 25)
)

// 最後に挿入されたIDを取得
val lastId = result.getLong("lastInsertId")

// データベース接続を閉じる
sqliteManager.close("mydatabase.db")
```

### トランザクション

```kotlin
val queries = listOf(
    Pair(
        "INSERT INTO users (name, age) VALUES ($1, $2)",
        listOf("鈴木太郎", 25)
    ),
    Pair(
        "INSERT INTO profiles (user_id, bio) VALUES ($1, $2)",
        listOf(1, "ソフトウェア開発者")
    )
)

val results = db.batch(queries)
```

## Store 実装

Store実装は、TauriのStoreプラグインに互換性のあるキーバリューストレージソリューションを提供します。

### 機能

- キーバリューストレージ
- 様々なデータ型のサポート
- JSONへのインポート/エクスポート

### 基本的な使用方法

```kotlin
// ストアマネージャーを取得
val storeManager = Store(context)

// ストアを取得または作成
val store = storeManager.getStore("mystore")

// 値を設定
store.set("name", "鈴木太郎")
store.set("age", 25)
store.set("isAdmin", true)
store.set("preferences", JSONObject().apply {
    put("theme", "dark")
    put("notifications", true)
})

// 値を取得
val name = store.get("name") as String
val age = store.get("age") as Int
val isAdmin = store.get("isAdmin") as Boolean
val preferences = store.get("preferences") as JSONObject

// キーが存在するか確認
val hasEmail = store.has("email")

// キーを削除
store.delete("isAdmin")

// すべてのキーをクリア
store.clear()

// すべてのキーを取得
val keys = store.keys()

// すべてのエントリを取得
val entries = store.entries()
```

### 保存と読み込み

```kotlin
// ストアをJSONファイルに保存
store.save("mystore_backup.json")

// ストアをJSONファイルから読み込み
store.load("mystore_backup.json")
```

## Tauriプラグインとの比較

これらの実装は、TauriのSQLおよびStoreプラグインと同様の機能を提供するように設計されています：

### SQLプラグイン互換機能

- データベース接続管理
- パラメータバインディングによるクエリ実行
- トランザクションサポート

### Storeプラグイン互換機能

- Get、Set、Delete操作
- JSONを含む様々なデータ型のサポート
- すべてのエントリのクリア
- キーの存在確認
- JSONからのエクスポートとインポート
