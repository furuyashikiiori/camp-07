## 技術スタック

### フロントエンド

- Next.js 14
- React 18
- TypeScript
- CSS Modules

### バックエンド

- Go 1.21+
- Gorilla Mux (ルーティング)
- SQLite3

### データベース

- SQLite3

## セットアップ

### 前提条件

- Node.js (v18 以上)
- Go (v1.21 以上)
- SQLite3

### インストール

1. リポジトリをクローン

```bash
git clone <https://github.com/furuyashikiiori/camp-07>
cd <project-name>
```

2. フロントエンドの依存関係をインストール

```bash
cd frontend
npm install
```

3. バックエンドの依存関係をインストール

```bash
cd ../backend
go mod download
```

4. データベースの初期化

```bash
cd ../database
sqlite3 app.db < schema.sql
```

## 実行

### フロントエンド

```bash
cd frontend
npm run dev
```

フロントエンドは http://localhost:3000 で起動します。

### バックエンド

```bash
cd backend
go run main.go
```

バックエンドは http://localhost:8080 で起動します。

## API エンドポイント

- `GET /api/health` - ヘルスチェック

## データベース

SQLite3 データベースは `database/app.db` に配置されます。
スキーマは `database/schema.sql` で管理されています。
