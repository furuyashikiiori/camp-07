package handlers

import (
	"backend/models"
	"context"
	"database/sql"
	"encoding/base64"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// App は handlers 全体で共有する DB コネクションを保持します
type App struct {
	DB *sql.DB
}

// CreateProfileRequest は POST /api/profiles 用のリクエストボディです
type CreateProfileRequest struct {
	UserID      int    `json:"user_id" binding:"required"`      // users.id
	DisplayName string `json:"display_name" binding:"required"` // 表示名
	IconBase64  string `json:"icon_base64,omitempty"`           // 任意。base64 エンコードされた画像
}

// ProfileResponse はプロフィール情報のレスポンスに使います
type ProfileResponse struct {
	ID          int    `json:"id"`
	UserID      int    `json:"user_id"`
	DisplayName string `json:"display_name"`
	IconURL     string `json:"icon_url,omitempty"`
}

// CreateProfile はプロフィールの新規作成エンドポイントです。
// POST /api/profiles
func (app *App) CreateProfile(c *gin.Context) {
	var req models.CreateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "detail": err.Error()})
		return
	}

	// base64 デコード（アイコンがあれば）
	var iconBytes []byte
	if req.IconBase64 != "" {
		b, err := base64.StdEncoding.DecodeString(req.IconBase64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid icon_base64"})
			return
		}
		iconBytes = b
	}

	// タイムアウト付きコンテキスト
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// INSERT 実行
	var profileID int
	err := app.DB.QueryRowContext(
		ctx,
		`INSERT INTO profile (user_id, display_name, icon)
     VALUES ($1, $2, $3)
     RETURNING id`,
		req.UserID, req.DisplayName, iconBytes,
	).Scan(&profileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "server error", "detail": err.Error()})
		return
	}

	// アイコン取得用 URL を組み立て
	iconURL := ""
	if len(iconBytes) > 0 {
		iconURL = "/api/profiles/" + strconv.Itoa(profileID) + "/icon"
	}

	// レスポンス
	c.JSON(http.StatusOK, models.Profile{
		ID:          profileID,
		UserID:      req.UserID,
		DisplayName: req.DisplayName,
		IconURL:     iconURL,
	})
}

// GetProfileIcon はプロフィールのアイコンをバイナリで返します。
// GET /api/profiles/:id/icon
func (app *App) GetProfileIcon(c *gin.Context) {
	idStr := c.Param("id")
	pid, err := strconv.Atoi(idStr)
	if err != nil {
		c.Status(http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var iconBytes []byte
	err = app.DB.QueryRowContext(ctx, "SELECT icon FROM profile WHERE id = $1", pid).Scan(&iconBytes)
	if err == sql.ErrNoRows {
		c.Status(http.StatusNotFound)
		return
	} else if err != nil {
		c.Status(http.StatusInternalServerError)
		return
	}

	// ここでは汎用的に image/png としています。
	// 実際は保存時に MIME を格納するか検知ロジックを入れてください。
	c.Data(http.StatusOK, "image/png", iconBytes)
}

// UpdateProfileRequest は PUT /api/profiles/:id 用のリクエストボディです
type UpdateProfileRequest struct {
	DisplayName string `json:"display_name,omitempty"`
	IconBase64  string `json:"icon_base64,omitempty"`
}

// UpdateProfile はプロフィールの部分更新エンドポイントです。
// PUT /api/profiles/:id
func (app *App) UpdateProfile(c *gin.Context) {
	idStr := c.Param("id")
	pid, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid profile id"})
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "detail": err.Error()})
		return
	}

	// base64 デコード（アイコンがあれば）
	var iconBytes []byte
	if req.IconBase64 != "" {
		b, err := base64.StdEncoding.DecodeString(req.IconBase64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid icon_base64"})
			return
		}
		iconBytes = b
	}

	// タイムアウト付きコンテキスト
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 部分更新: 送られてこなかったフィールドは元の値を維持
	// COALESCE(NULLIF($1,''), display_name) で 空文字列 の場合は更新をスキップ
	_, err = app.DB.ExecContext(
		ctx,
		`UPDATE profile
       SET display_name = COALESCE(NULLIF($1, ''), display_name),
           icon         = COALESCE($2, icon)
     WHERE id = $3`,
		req.DisplayName,
		sql.NullBytea{Bytea: iconBytes, Valid: len(iconBytes) > 0},
		pid,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "server error", "detail": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
