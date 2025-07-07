package handlers

import (
	"backend/models"
	"context"
	"database/sql"
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// App はアプリケーションのコンテキストを保持します
type App struct {
	DB *sql.DB
}

// CreateProfile は新しいプロフィールを作成するハンドラーです
func (app *App) CreateProfile(c *gin.Context) {
	var req models.CreateProfileRequest
	// リクエストのJSONをバインド
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("JSON binding error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid request format: %v", err)})
		return
	}

	// ユーザーIDの存在チェック
	var exists bool
	err := app.DB.QueryRowContext(
		context.Background(),
		"SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)",
		req.UserID,
	).Scan(&exists)

	if err != nil {
		fmt.Printf("Database error checking user: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Database error: %v", err)})
		return
	}

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User does not exist"})
		return
	}

	// プロフィールが既に存在するかチェック
	err = app.DB.QueryRowContext(
		context.Background(),
		"SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = $1)",
		req.UserID,
	).Scan(&exists)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "Profile already exists for this user"})
		return
	}

	var iconPath string
	var iconURL string

	// アイコン画像の処理（存在する場合）
	if req.IconBase64 != "" {
		// Base64をデコード
		iconData, err := base64.StdEncoding.DecodeString(req.IconBase64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image data"})
			return
		}

		// ディレクトリ確認
		uploadDir := "./uploads"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			if err := os.MkdirAll(uploadDir, 0755); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
				return
			}
		}

		// ユニークなファイル名を生成
		filename := uuid.New().String() + ".png"
		iconPath = filepath.Join(uploadDir, filename)

		// ファイルに保存
		if err := os.WriteFile(iconPath, iconData, 0644); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}

		// 公開URL設定
		iconURL = fmt.Sprintf("/api/profiles/%d/icon", req.UserID)
	}

	// プロフィール情報をDBに保存
	var profileID int
	err = app.DB.QueryRowContext(
		context.Background(),
		`INSERT INTO profiles (user_id, display_name, icon_path) 
         VALUES ($1, $2, $3) RETURNING id`,
		req.UserID, req.DisplayName, iconPath,
	).Scan(&profileID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create profile"})
		return
	}

	c.JSON(http.StatusCreated, models.Profile{
		ID:          profileID,
		UserID:      req.UserID,
		DisplayName: req.DisplayName,
		IconURL:     iconURL,
	})
}

// UpdateProfile はプロフィール情報を更新するハンドラーです
func (app *App) UpdateProfile(c *gin.Context) {
	profileID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid profile ID"})
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// プロフィール存在確認
	var userID int
	var currentIconPath sql.NullString
	err = app.DB.QueryRowContext(
		context.Background(),
		"SELECT user_id, icon_path FROM profiles WHERE id = $1",
		profileID,
	).Scan(&userID, &currentIconPath)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// 更新クエリ構築
	query := "UPDATE profiles SET "
	params := []interface{}{}
	paramCount := 0

	if req.DisplayName != "" {
		paramCount++
		query += fmt.Sprintf("display_name = $%d, ", paramCount)
		params = append(params, req.DisplayName)
	}

	var newIconPath string

	// アイコン画像の処理（存在する場合）
	if req.IconBase64 != "" {
		// Base64をデコード
		iconData, err := base64.StdEncoding.DecodeString(req.IconBase64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image data"})
			return
		}

		// ディレクトリ確認
		uploadDir := "./uploads"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			if err := os.MkdirAll(uploadDir, 0755); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
				return
			}
		}

		// 古いアイコンがあれば削除
		if currentIconPath.Valid && currentIconPath.String != "" {
			if err := os.Remove(currentIconPath.String); err != nil && !os.IsNotExist(err) {
				// エラーログ出力（削除に失敗してもプロセスは続行）
				fmt.Printf("Failed to delete old icon: %v\n", err)
			}
		}

		// ユニークなファイル名を生成
		filename := uuid.New().String() + ".png"
		newIconPath = filepath.Join(uploadDir, filename)

		// ファイルに保存
		if err := os.WriteFile(newIconPath, iconData, 0644); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}

		paramCount++
		query += fmt.Sprintf("icon_path = $%d, ", paramCount)
		params = append(params, newIconPath)
	}

	// 更新するフィールドがなければエラー
	if paramCount == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	// 末尾のカンマとスペースを削除
	query = query[:len(query)-2]

	// WHERE句とタイムスタンプ更新を追加
	query += fmt.Sprintf(" WHERE id = $%d RETURNING id", paramCount+1)
	params = append(params, profileID)

	// タイムアウト付きコンテキスト
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 更新実行
	var updatedID int
	err = app.DB.QueryRowContext(ctx, query, params...).Scan(&updatedID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	// 更新されたプロフィール情報を取得
	var profile models.Profile
	err = app.DB.QueryRowContext(
		ctx,
		"SELECT id, user_id, display_name FROM profiles WHERE id = $1",
		updatedID,
	).Scan(&profile.ID, &profile.UserID, &profile.DisplayName)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve updated profile"})
		return
	}

	// アイコンURLを設定
	if newIconPath != "" || (currentIconPath.Valid && currentIconPath.String != "") {
		profile.IconURL = fmt.Sprintf("/api/profiles/%d/icon", profile.ID)
	}

	c.JSON(http.StatusOK, profile)
}

// GetProfileIcon はプロフィールのアイコン画像を返すハンドラーです
func (app *App) GetProfileIcon(c *gin.Context) {
	profileID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid profile ID"})
		return
	}

	// アイコンのパスを取得
	var iconPath sql.NullString
	err = app.DB.QueryRowContext(
		context.Background(),
		"SELECT icon_path FROM profiles WHERE id = $1",
		profileID,
	).Scan(&iconPath)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// アイコンが設定されていない場合
	if !iconPath.Valid || iconPath.String == "" {
		// デフォルトアイコンを返す
		defaultIconPath := "./assets/default-icon.png"
		if _, err := os.Stat(defaultIconPath); os.IsNotExist(err) {
			// デフォルトアイコンもない場合
			c.JSON(http.StatusNotFound, gin.H{"error": "No icon available"})
			return
		}
		c.File(defaultIconPath)
		return
	}

	// カスタムアイコンの存在確認
	if _, err := os.Stat(iconPath.String); os.IsNotExist(err) {
		// ファイルが見つからない場合はデフォルトアイコンを返す
		defaultIconPath := "./assets/default-icon.png"
		if _, err := os.Stat(defaultIconPath); os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Icon file not found"})
			return
		}
		c.File(defaultIconPath)
		return
	}

	// ユーザーのカスタムアイコンを送信
	c.File(iconPath.String)
}
