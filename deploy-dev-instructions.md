# 開発環境デプロイ手順

## 🌿 ブランチ戦略

```
feature/* → dev → main
    ↓        ↓      ↓
  ローカル   開発環境  本番環境
```

## 🚀 開発環境デプロイ

### Render (バックエンド開発環境)

1. Render ダッシュボードで新しい "Web Service" を作成
2. 以下の設定を行う：
   - **Name**: `qrsona-backend-dev`
   - **Branch**: `dev`
   - **Root Directory**: `backend`
   - **Build Command**: `go build -o main .`
   - **Start Command**: `./main`
3. 環境変数:
   - `PORT`: `10000`
   - `DATABASE_URL`: Supabase 接続文字列
   - `GIN_MODE`: `debug`

### Vercel (フロントエンド開発環境)

1. Vercel は自動的に `dev` ブランチのプレビューを作成
2. プレビュー URL 例: `https://qrsona-dev.vercel.app`
3. 環境変数（必要に応じて）:
   - `NEXT_PUBLIC_API_URL`: `https://qrsona-backend-dev.onrender.com`

## 🔄 開発フロー

1. `feature/*` ブランチで機能開発
2. `dev` ブランチにマージ → 開発環境に自動デプロイ
3. 開発環境でテスト
4. `main` ブランチにマージ → 本番環境に自動デプロイ

## 🌐 環境 URL

- **本番**: `https://qrsona.vercel.app/`
- **開発**: `https://qrsona-dev.vercel.app/`
- **API 本番**: `https://qrsona-backend.onrender.com/`
- **API 開発**: `https://qrsona-backend-dev.onrender.com/`

## 🔧 設定ファイル

- **本番用**: `render.yaml`, `vercel.json`
- **開発用**: `render-dev.yaml`, `vercel-dev.json`
