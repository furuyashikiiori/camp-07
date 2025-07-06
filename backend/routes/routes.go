package routes

import (
	"backend/handlers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

// ルート設定
func SetupRoutes(r *gin.Engine) {
	// ミドルウェア設定
	r.Use(middleware.CORSMiddleware())

	// APIルートグループ
	api := r.Group("/api")
	{
		// ヘルスチェック
		api.GET("/health", handlers.HealthCheck)

		// QRコード生成
		api.POST("/generate-qr", handlers.GenerateQRCode)
	}
}
