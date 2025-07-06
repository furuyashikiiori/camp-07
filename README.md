## 技術スタック

### フロントエンド

- Next.js 14
- React 18
- TypeScript
- CSS Modules

### バックエンド

- Go 1.21+
- Gin (Webフレームワーク)
- PostgreSQL (Supabase)

### データベース

- Supabase (PostgreSQL)

## セットアップ

### 前提条件

- Node.js (v18 以上)
- Go (v1.21 以上)
- Supabase アカウント

### インストール

1. リポジトリをクローン

```bash
git clone https://github.com/furuyashikiiori/camp-07
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

4. 環境変数の設定

```bash
cd ../backend
cp .env.example .env
# .envファイルでDATABASE_URLを設定
```

注意: Supabaseの接続情報が必要です

## 実行

### フロントエンド

```bash
cd frontend
npm run dev
```

フロントエンドは http://localhost:3000 で起動

### バックエンド

```bash
cd backend
go run main.go
```

バックエンドは http://localhost:8080 で起動
お試し　 http://localhost:8080/api/health

## API エンドポイント

- `GET /api/health` - ヘルスチェック
- `POST /api/generate-qr` - QRコード生成

## データベース

Supabase (PostgreSQL) を使用しています。
- 接続設定は `.env` ファイルの `DATABASE_URL` で管理
- スキーマは `database/schema.sql` で管理されています（参考用）
