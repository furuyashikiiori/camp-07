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

		// リンク系API
		links := api.Group("/links")
		links.Use(middleware.AuthRequired())
		{
			links.POST("", app.CreateLink)                     // リンク作成
			links.GET("/user/:user_id", app.GetLinksByUser)    // ユーザー別リンク一覧
			links.GET("/:id", app.GetLink)                     // リンク詳細
			links.PUT("/:id", app.UpdateLink)                  // リンク更新
			links.DELETE("/:id", app.DeleteLink)               // リンク削除
			links.GET("/types/common", app.GetCommonLinkTypes) // リンクテンプレ
		}

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

		// コネクション関連
		connections := api.Group("/connections")
		{
			connections.POST("", app.CreateConnection)            // コネクション申請
			connections.GET("/mutual", app.IsMutualConnectionAPI) // 相互コネクションチェック
			connections.GET("", app.GetConnections)               // コネクション一覧取得
			connections.PUT("/:id", app.UpdateConnection)         // コネクションの承認
			connections.DELETE("/:id", app.DeleteConnection)      // コネクションの削除
			connections.GET("/:id", app.GetConnection)            // コネクション詳細取得
		}
	}
}
