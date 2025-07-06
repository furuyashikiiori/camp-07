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

		// 新規登録
		api.POST("/signup", app.SignUp)

		// ログイン
		api.POST("/signin", app.SignIn)
	}
}
