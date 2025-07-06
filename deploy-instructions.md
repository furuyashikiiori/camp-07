# デプロイ手順

## Vercel (フロントエンド)
1. GitHubリポジトリをVercelに接続
2. ルートディレクトリを `frontend` に設定
3. ビルドコマンドを `npm run build` に設定
4. 出力ディレクトリを `.next` に設定
5. 環境変数 `NEXT_PUBLIC_API_URL` にRenderのバックエンドURLを設定

## Render (バックエンド)
1. GitHubリポジトリをRenderに接続
2. "Web Service" を選択
3. ルートディレクトリを `backend` に設定
4. ビルドコマンドを `go build -o main .` に設定
5. 開始コマンドを `./main` に設定
6. PostgreSQLデータベースを作成してサービスに接続
7. 環境変数は render.yaml から自動設定されます

## デプロイ後の設定
1. `vercel.json` の実際のRenderバックエンドURLに更新
2. `next.config.ts` の実際のバックエンドURLに更新
3. フロントエンドとバックエンドの接続をテスト