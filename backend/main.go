package main

import (
	"database/sql"
	"encoding/base64"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
	"github.com/skip2/go-qrcode"
)

type App struct {
	DB *sql.DB
}

type URLRequest struct {
	URL string `json:"url" binding:"required"`
}

func main() {
	app := &App{}
	
	// データベース接続
	db, err := sql.Open("sqlite3", "../database/app.db")
	if err != nil {
		panic(err)
	}
	defer db.Close()
	
	app.DB = db
	
	// Gin設定
	r := gin.Default()
	
	// CORS設定
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusOK)
			return
		}
		
		c.Next()
	})
	
	// API エンドポイント
	r.GET("/api/health", app.healthCheck)

	r.POST("/api/generate-qr", func(c *gin.Context) {
		var req URLRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストボディの形式が正しくありません"})
			return
		}
		
		// QRコード生成
		qr, err := qrcode.Encode(req.URL, qrcode.Medium, 256)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "QRコードの生成に失敗しました"})
			return
		}
		
		// Base64エンコード
		base64Encoding := base64.StdEncoding.EncodeToString(qr)
		dataURI := "data:image/png;base64," + base64Encoding
		
		c.JSON(http.StatusOK, gin.H{
			"qr_data": dataURI,
			"url": req.URL,
		})
	})
	
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	r.Run(":" + port)
}

func (app *App) healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok繋がってるよ!"})
}
