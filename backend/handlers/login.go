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

// SignIn はユーザーログインを行うハンドラーです
func (app *App) SignIn(c *gin.Context) {
	var req models.SignInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストが不正です"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var (
		id             int
		name, email    string
		hashedPassword string
	)

	err := app.DB.QueryRowContext(
		ctx,
		"SELECT id, name, email, password FROM users WHERE email = $1",
		req.Email,
	).Scan(&id, &name, &email, &hashedPassword)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "メールアドレスまたはパスワードが正しくありません"})
		return
	}

	// パスワード検証
	if bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "メールアドレスまたはパスワードが正しくありません"})
		return
	}

	// JWTトークン生成
	token, err := utils.GenerateJWT(id, email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トークンの生成に失敗しました"})
		return
	}

	// ログイン成功レスポンス
	c.JSON(http.StatusOK, gin.H{
		"user": models.User{
			ID:    id,
			Name:  name,
			Email: email,
		},
		"token": token, // トークンを追加
	})
}
