package routes

import (
	"backend/database"
	"backend/handlers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes ルート設定
func SetupRoutes(r *gin.Engine) {
	// CORS 等のミドルウェア
	r.Use(middleware.CORSMiddleware())

	// DB コネクションを持った App を生成
	app := &handlers.App{DB: database.DB}

	// /api 以下のグループ
	api := r.Group("/api")
	{
		api.GET("/health", handlers.HealthCheck)
		api.POST("/generate-qr", handlers.GenerateQRCode)

		// 認証
		api.POST("/signup", app.SignUp)
		api.POST("/signin", app.SignIn)

		// プロフィール作成
		// JSON ボディで user_id, display_name, icon_base64(optional) を受け取り
		api.POST("/profiles", app.CreateProfile)

		// アイコン画像取得
		// バイナリを直接返します
		api.GET("/profiles/:id/icon", app.GetProfileIcon)
		api.PUT("/profiles/:id", app.UpdateProfile) // プロフィール更新
	}
}
