package routes

import (
	"backend/database"
	"backend/handlers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutesはAPIルーティングの設定を行います
func SetupRoutes(r *gin.Engine) {
	// CORSミドルウェア
	r.Use(middleware.CORSMiddleware())

	// ハンドラの初期化（DBコネクションとCloudinaryクライアントセット）
	app, err := handlers.NewApp(database.DB)
	if err != nil {
		panic("Failed to initialize app: " + err.Error())
	}

	// 静的ファイル配信（開発環境用）
	r.Static("/api/uploads", "./uploads")

	// APIルートグループ
	api := r.Group("/api")
	{
		api.GET("/health", handlers.HealthCheck)          // ヘルスチェック
		api.POST("/generate-qr", handlers.GenerateQRCode) // QRコード生成
		api.POST("/signup", app.SignUp)                   // サインアップ
		api.POST("/signin", app.SignIn)                   // サインイン

		api.GET("/users", middleware.AuthRequired(), app.GetUsers) // 全ユーザー取得（認証要）

		// リンク系API
		links := api.Group("/links")
		links.Use(middleware.AuthRequired())
		{
			links.POST("", app.CreateLink)                 // 新規リンク作成
			links.GET("/user/:userId", app.GetLinksByUser) // ユーザー別リンク一覧
			links.GET("/:id", app.GetLink)                 // リンク詳細取得
			links.PUT("/:id", app.UpdateLink)              // リンク更新
			links.DELETE("/:id", app.DeleteLink)           // リンク削除

			links.GET("/types/common", app.GetCommonLinkTypes) // 共通リンクテンプレ取得
		}

		// 公開リンクAPI（認証不要）
		api.GET("/links/profile/:profile_id", app.GetLinksByProfile) // プロフィール別リンク一覧（公開）

		// プロフィール関連
		profiles := api.Group("/profiles")
		profiles.Use(middleware.AuthRequired())
		{
			profiles.POST("", app.CreateProfile)    // プロフィール作成
			profiles.PUT("/:id", app.UpdateProfile) // プロフィール更新

			// プロフィールごとのオプションプロフィール一覧取得
			profiles.GET("/:id/option-profiles", app.GetOptionProfilesByProfileID)

			profiles.DELETE("/:id", app.DeleteProfile) // プロフィール削除
		}

		// 公開API（認証不要）
		api.GET("/profiles/:id", app.GetProfile)          // プロフィール取得（公開）
		api.GET("/profiles/:id/icon", app.GetProfileIcon) // プロフィールアイコン取得（公開）

		// option_profiles関連
		optionProfiles := api.Group("/option_profiles")
		optionProfiles.Use(middleware.AuthRequired())
		{
			optionProfiles.POST("", app.CreateOptionProfile)       // 作成
			optionProfiles.PATCH("/:id", app.UpdateOptionProfile)  // 更新
			optionProfiles.DELETE("/:id", app.DeleteOptionProfile) // 削除
		}

		// 認証必要 - ユーザー関連サブ
		users := api.Group("/users")
		users.Use(middleware.AuthRequired())
		{
			users.GET("/:userId/profiles", app.GetProfilesByUserID)   // ユーザー毎プロフィール一覧
			users.GET("/:userId/connections", app.GetUserConnections) // ユーザーの交換済みプロフィール一覧
		}

		// コネクション関連: profile_idに変更
		connections := api.Group("/connections")
		{
			connections.POST("", app.CreateConnection)       // コネクション作成（リクエストbody: profile_id, connect_user_profile_id）
			connections.GET("", app.GetConnections)          // コネクション一覧取得（?profile_id=xxx）
			connections.DELETE("/:id", app.DeleteConnection) // コネクション削除
			connections.GET("/:id", app.GetConnection)       // コネクション詳細取得
			connections.PUT("/:id", app.UpdateConnection)    // コネクション更新
		}
	}
}
