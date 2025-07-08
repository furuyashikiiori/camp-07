package handlers

import (
	"backend/models"
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// GetUsers はユーザー一覧を取得するハンドラーです
func (app *App) GetUsers(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := app.DB.QueryContext(ctx, "SELECT id, name, email FROM users ORDER BY id")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー一覧の取得に失敗しました"})
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		if err := rows.Scan(&user.ID, &user.Name, &user.Email); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "データベーススキャンエラー"})
			return
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}
