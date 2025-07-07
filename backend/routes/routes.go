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

		// ユーザー関連
		api.GET("/users", middleware.AuthRequired(), app.GetUsers)

		// プロフィール関連
		profiles := api.Group("/profiles")
		profiles.Use(middleware.AuthRequired())
		{
			profiles.POST("", app.CreateProfile)          // プロフィール作成
			profiles.PUT("/:id", app.UpdateProfile)       // プロフィール更新
			profiles.GET("/:id/icon", app.GetProfileIcon) // プロフィールアイコン取得
		}

		// 認証必要 - ユーザー関連
		users := api.Group("/users")
		users.Use(middleware.AuthRequired())
		{
			users.GET("/:userId/profiles", app.GetProfilesByUserID) // ユーザーのプロフィール一覧取得
		}
	}
}
