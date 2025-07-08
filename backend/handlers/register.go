package handlers

import (
	"backend/models"
	"backend/utils"
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// SignUp はユーザー登録を行うハンドラーです
func (app *App) SignUp(c *gin.Context) {
	var req models.SignUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストが不正です"})
		return
	}

	// パスワードハッシュ化
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "サーバー内部エラーが発生しました"})
		return
	}

	// タイムアウト付きコンテキスト
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var id int
	err = app.DB.QueryRowContext(
		ctx,
		"INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
		req.Name, req.Email, string(hashedPassword),
	).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー登録に失敗しました"})
		return
	}

	// JWTトークン生成
	token, err := utils.GenerateJWT(id, req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トークンの生成に失敗しました"})
		return
	}

	// 登録成功レスポンス
	c.JSON(http.StatusOK, gin.H{
		"user": models.User{
			ID:    id,
			Name:  req.Name,
			Email: req.Email,
		},
		"token": token,
	})
}
