package main

import (
	"database/sql"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

type App struct {
	DB *sql.DB
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
	
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	r.Run(":" + port)
}

func (app *App) healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok繋がってるよ!"})
}