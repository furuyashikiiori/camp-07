package routes

import (
	"backend/database"
	"backend/handlers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

// ルート設定
func SetupRoutes(r *gin.Engine) {
	// ミドルウェア設定
	r.Use(middleware.CORSMiddleware())

	// DBコネクションを持ったApp構造体を用意
	app := &handlers.App{DB: database.DB}

	// APIルートグループ
	api := r.Group("/api")
	{
		// ヘルスチェック
		api.GET("/health", handlers.HealthCheck)

		// QRコード生成
		api.POST("/generate-qr", handlers.GenerateQRCode)

		// 認証関連
		api.POST("/signup", app.SignUp)
		api.POST("/signin", app.SignIn)

		// リンク系API
		links := api.Group("/links")
		{
			links.POST("", app.CreateLink)                     // リンク作成
			links.GET("/user/:user_id", app.GetLinksByUser)    // ユーザー別リンク一覧
			links.GET("/:id", app.GetLink)                     // リンク詳細
			links.PUT("/:id", app.UpdateLink)                  // リンク更新
			links.DELETE("/:id", app.DeleteLink)               // リンク削除
			links.GET("/types/common", app.GetCommonLinkTypes) // リンクテンプレ

			// プロフィール関連
			profiles := api.Group("/profiles")
			{
				profiles.POST("", app.CreateProfile)          // プロフィール作成
				profiles.PUT("/:id", app.UpdateProfile)       // プロフィール更新
				profiles.GET("/:id/icon", app.GetProfileIcon) // プロフィールアイコン取得
			}
		}
	}
}
