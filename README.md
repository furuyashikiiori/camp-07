# QRsona

本アプリはデプロイ済みです。ぜひお試しください！
https://qrsona.vercel.app

## はじめに - Hackathon 参加概要　　

- こちらのプロジェクトは「技育 CAMP ハッカソン 2025 年度 Vol.6」で制作した作品です。
- 開発期間：2025 年 7 月 3 日〜7 月 13 日

## 概要

QR コードを用いたプロフィール交換システム。ユーザー同士がプロフィール情報を簡単に交換し、つながりを管理できる Web アプリケーションです。
QRsona は、リアルでの出会いをデジタルでつなげるプラットフォームです。イベントや会議、カジュアルな出会いの場で、QR コードを使って簡単にプロフィール情報を交換できます。

### 主な特徴

- 🔗 **QR コードによる簡単プロフィール交換**
- 👥 **複数プロフィール管理（ビジネス用・プライベート用など）**
- 🔒 **安全なアクセス制御（交換済みユーザーのみ閲覧可能）**
- 📱 **レスポンシブデザイン**
- 💾 **交換履歴・フレンド情報管理**

## 技術スタック

### フロントエンド

- **Next.js 15.3.4** - React フレームワーク
- **React 19** - UI ライブラリ
- **TypeScript** - 型安全な開発
- **CSS Modules** - スタイリング
- **@zxing/library** - QR コード読み取り
- **Axios** - HTTP 通信
- **React Icons** - アイコンライブラリ

### バックエンド

- **Go 1.22.2** - プログラミング言語
- **Gin** - Web フレームワーク
- **JWT** - 認証システム
- **bcrypt** - パスワードハッシュ化
- **go-qrcode** - QR コード生成
- **Cloudinary** - 画像管理

### データベース・インフラ

- **PostgreSQL (Supabase)** - データベース
- **Vercel** - フロントエンドデプロイ
- **Render** - バックエンドデプロイ

## 主要機能

### 👤 ユーザー・プロフィール管理

- ユーザー登録・ログイン（JWT 認証）
- 複数プロフィール作成・編集・削除
- プロフィール画像アップロード
- カスタムフィールド対応
- SNS・Web サイトリンク管理

### 📱 QR コード機能

- プロフィール別 QR コード生成・ダウンロード
- QR コードスキャン機能
- リアルタイム更新対応

### 🤝 プロフィール交換・コネクション管理

- QR コードを介したプロフィール交換
- 双方向コネクション作成
- イベント情報・メモ付き交換記録
- 交換履歴管理（年月日別表示）
- アクセス制御（交換済みユーザーのみ閲覧可能）

## セットアップ

### 前提条件

- **Node.js** (v18 以上)
- **Go** (v1.22 以上)
- **Supabase** アカウント
- **Cloudinary** アカウント（画像アップロード用）

### 環境変数設定

バックエンドの環境変数を設定してください：

```bash
# .env ファイルをbackendディレクトリに作成
cd backend
cp .env.example .env
```

必要な環境変数：

- `DATABASE_URL` - Supabase PostgreSQL 接続 URL
- `JWT_SECRET` - JWT 署名用シークレットキー
- `CLOUDINARY_CLOUD_NAME` - Cloudinary 設定
- `CLOUDINARY_API_KEY` - Cloudinary API キー
- `CLOUDINARY_API_SECRET` - Cloudinary API シークレット

### インストール

1. **リポジトリをクローン**

```bash
git clone https://github.com/furuyashikiiori/camp-07
cd camp-07
```

2. **フロントエンドの依存関係をインストール**

```bash
cd frontend
npm install
```

3. **バックエンドの依存関係をインストール**

```bash
cd ../backend
go mod download
```

4. **環境変数の設定**

```bash
# バックエンドの環境変数を設定
cd backend
cp .env.example .env
# .envファイルを編集して必要な値を設定
```

### データベースセットアップ

Supabase でプロジェクトを作成し、必要なテーブルを作成してください。
スキーマの詳細は `database/schema.sql` を参照してください。

## 実行

### 開発環境での起動

**フロントエンド（ターミナル 1）**

```bash
cd frontend
npm run dev
```

→ http://localhost:3000 でアクセス可能

**バックエンド（ターミナル 2）**

```bash
cd backend
go run main.go
```

→ http://localhost:8080 で API サーバーが起動

### 動作確認

- フロントエンド: http://localhost:3000
- バックエンド API: http://localhost:8080/api/health

## API エンドポイント

### 認証

- `POST /api/signup` - ユーザー登録
- `POST /api/signin` - ユーザーログイン

### プロフィール

- `GET /api/profiles/:id` - プロフィール詳細取得
- `POST /api/profiles` - プロフィール作成
- `PUT /api/profiles/:id` - プロフィール更新
- `DELETE /api/profiles/:id` - プロフィール削除
- `GET /api/users/:userId/profiles` - ユーザーのプロフィール一覧

### QR コード

- `POST /api/generate-qr` - QR コード生成

### コネクション

- `POST /api/connections` - コネクション作成
- `GET /api/connections` - コネクション一覧取得
- `PUT /api/connections/:id` - コネクション更新
- `GET /api/users/:userId/connections` - ユーザーの交換済みプロフィール一覧

### リンク

- `POST /api/links` - リンク作成
- `GET /api/links/profile/:profile_id` - プロフィール別リンク一覧

## プロジェクト構成

```
camp-07/
├── frontend/          # Next.js フロントエンド
│   ├── src/
│   │   ├── app/       # App Router（ページ）
│   │   ├── components/ # 共通コンポーネント
│   │   └── utils/     # ユーティリティ関数
│   └── public/        # 静的ファイル
├── backend/           # Go バックエンド
│   ├── handlers/      # APIハンドラー
│   ├── middleware/    # ミドルウェア
│   ├── models/        # データモデル
│   ├── routes/        # ルーティング設定
│   ├── utils/         # ユーティリティ
│   └── database/      # DB接続
└── database/          # スキーマファイル
```

## 使用方法

1. **ユーザー登録・ログイン**

   - アカウントを作成してログイン

2. **プロフィール作成**

   - 複数のプロフィールを用途別に作成可能
   - ビジネス用、プライベート用など

3. **QR コード生成**

   - プロフィールを選択して QR コードを生成

4. **プロフィール交換**

   - 相手の QR コードをスキャンして交換
   - イベント情報やメモを記録可能

5. **交換履歴管理**
   - 交換済みプロフィールを日付別に管理
   - フレンド情報の編集も可能

## データベース

**使用技術**: Supabase (PostgreSQL)

- 接続設定は `.env` ファイルの `DATABASE_URL` で管理
- スキーマは `database/schema.sql` で管理
- 主要テーブル:
  - `users` - ユーザー情報
  - `profiles` - プロフィール情報
  - `connections` - ユーザー間のコネクション
  - `link` - プロフィールに紐づくリンク情報
  - `option_profiles` - カスタムプロフィールフィールド

## デプロイ

### 本番環境

- **フロントエンド**: Vercel
- **バックエンド**: Render
- **データベース**: Supabase

デプロイ手順は以下のファイルを参照：

- `deploy-instructions.md` - 本番環境デプロイ手順
- `deploy-dev-instructions.md` - 開発環境デプロイ手順

## 工夫した点

### セキュリティ

- JWT 認証による安全な API 通信
- パスワードハッシュ化（bcrypt）
- プロフィールアクセス制御
- 認証ミドルウェアの実装

### UX/UI

- レスポンシブデザイン
- 直感的な QR コード交換フロー
- 複数プロフィール対応
- リアルタイム QR コード生成

### 技術的工夫

- 環境別 URL 自動切り替え
- Cloudinary 連携による画像管理
- トランザクション処理
- 相互コネクション管理
- モジュラー設計
