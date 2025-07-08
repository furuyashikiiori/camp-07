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
	"strings"
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
		if strings.Contains(err.Error(), "title") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "タイトルは必須項目です"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエスト形式が不正です"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ユーザーが存在しません"})
		return
	}

	var iconPath string
	var iconURL string

	// アイコン画像の処理（存在する場合）
	if req.IconBase64 != "" {
		// Base64をデコード
		iconData, err := base64.StdEncoding.DecodeString(req.IconBase64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "画像データが不正です"})
			return
		}

		// ディレクトリ確認
		uploadDir := "./uploads"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			if err := os.MkdirAll(uploadDir, 0755); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "アップロードディレクトリの作成に失敗しました"})
				return
			}
		}

		// ユニークなファイル名を生成
		filename := uuid.New().String() + ".png"
		iconPath = filepath.Join(uploadDir, filename)

		// ファイルに保存
		if err := os.WriteFile(iconPath, iconData, 0644); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "画像の保存に失敗しました"})
			return
		}

		// 公開URL設定
		iconURL = fmt.Sprintf("/api/profiles/%d/icon", req.UserID)
	}

	// 誕生日の処理
	var birthdate *time.Time
	if req.Birthdate != "" {
		parsedDate, err := time.Parse("2006-01-02", req.Birthdate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "誕生日の形式が不正です。YYYY-MM-DD形式で入力してください"})
			return
		}
		birthdate = &parsedDate
	}

	// プロフィール情報をDBに保存
	var profileID int
	query := `INSERT INTO profiles (
        user_id, display_name, icon_path, aka, hometown, 
        birthdate, hobby, comment, title, description
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
    RETURNING id`

	err = app.DB.QueryRowContext(
		context.Background(),
		query,
		req.UserID, req.DisplayName, iconPath, req.AKA, req.Hometown,
		birthdate, req.Hobby, req.Comment, req.Title, req.Description,
	).Scan(&profileID)

	if err != nil {
		fmt.Printf("Database error creating profile: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "プロフィールの作成に失敗しました"})
		return
	}

	// 作成したプロフィールを返す
	profile := models.Profile{
		ID:          profileID,
		UserID:      req.UserID,
		DisplayName: req.DisplayName,
		IconURL:     iconURL,
		AKA:         req.AKA,
		Hometown:    req.Hometown,
		Hobby:       req.Hobby,
		Comment:     req.Comment,
		Title:       req.Title,
		Description: req.Description,
	}

	// 誕生日がある場合は設定
	if birthdate != nil {
		profile.Birthdate = *birthdate
	}

	c.JSON(http.StatusCreated, profile)
}

// UpdateProfile はプロフィール情報を更新するハンドラーです
func (app *App) UpdateProfile(c *gin.Context) {
	profileID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "プロフィールIDが不正です"})
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエスト形式が不正です"})
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
		c.JSON(http.StatusNotFound, gin.H{"error": "プロフィールが見つかりません"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}

	// 更新クエリ構築
	query := "UPDATE profiles SET "
	params := []interface{}{}
	paramCount := 0

	// 各フィールドの更新処理
	if req.DisplayName != "" {
		paramCount++
		query += fmt.Sprintf("display_name = $%d, ", paramCount)
		params = append(params, req.DisplayName)
	}

	if req.AKA != "" {
		paramCount++
		query += fmt.Sprintf("aka = $%d, ", paramCount)
		params = append(params, req.AKA)
	}

	if req.Hometown != "" {
		paramCount++
		query += fmt.Sprintf("hometown = $%d, ", paramCount)
		params = append(params, req.Hometown)
	}

	if req.Birthdate != "" {
		birthdate, err := time.Parse("2006-01-02", req.Birthdate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "誕生日の形式が不正です。YYYY-MM-DD形式で入力してください"})
			return
		}
		paramCount++
		query += fmt.Sprintf("birthdate = $%d, ", paramCount)
		params = append(params, birthdate)
	}

	if req.Hobby != "" {
		paramCount++
		query += fmt.Sprintf("hobby = $%d, ", paramCount)
		params = append(params, req.Hobby)
	}

	if req.Comment != "" {
		paramCount++
		query += fmt.Sprintf("comment = $%d, ", paramCount)
		params = append(params, req.Comment)
	}

	if req.Title != "" {
		paramCount++
		query += fmt.Sprintf("title = $%d, ", paramCount)
		params = append(params, req.Title)
	}

	if req.Description != "" {
		paramCount++
		query += fmt.Sprintf("description = $%d, ", paramCount)
		params = append(params, req.Description)
	}

	var newIconPath string

	// アイコン画像の処理（存在する場合）
	if req.IconBase64 != "" {
		// Base64をデコード
		iconData, err := base64.StdEncoding.DecodeString(req.IconBase64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "画像データが不正です"})
			return
		}

		// ディレクトリ確認
		uploadDir := "./uploads"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			if err := os.MkdirAll(uploadDir, 0755); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "アップロードディレクトリの作成に失敗しました"})
				return
			}
		}

		// 古いアイコンがあれば削除
		if currentIconPath.Valid && currentIconPath.String != "" {
			if err := os.Remove(currentIconPath.String); err != nil && !os.IsNotExist(err) {
				fmt.Printf("Failed to delete old icon: %v\n", err)
			}
		}

		// ユニークなファイル名を生成
		filename := uuid.New().String() + ".png"
		newIconPath = filepath.Join(uploadDir, filename)

		// ファイルに保存
		if err := os.WriteFile(newIconPath, iconData, 0644); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "画像の保存に失敗しました"})
			return
		}

		paramCount++
		query += fmt.Sprintf("icon_path = $%d, ", paramCount)
		params = append(params, newIconPath)
	}

	// 更新するフィールドがなければエラー
	if paramCount == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "更新する項目がありません"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "プロフィールの更新に失敗しました"})
		return
	}

	// 更新されたプロフィール情報を取得
	var profile models.Profile
	err = app.DB.QueryRowContext(
		ctx,
		`SELECT id, user_id, display_name, aka, hometown, birthdate, 
        hobby, comment, title, description 
        FROM profiles WHERE id = $1`,
		updatedID,
	).Scan(
		&profile.ID, &profile.UserID, &profile.DisplayName,
		&profile.AKA, &profile.Hometown, &profile.Birthdate,
		&profile.Hobby, &profile.Comment, &profile.Title, &profile.Description,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新後のプロフィール取得に失敗しました"})
		return
	}

	// アイコンURLを設定
	if newIconPath != "" || (currentIconPath.Valid && currentIconPath.String != "") {
		profile.IconURL = fmt.Sprintf("/api/profiles/%d/icon", profile.ID)
	}

	c.JSON(http.StatusOK, profile)
}

// GetProfile はプロフィール情報を取得するハンドラーです
func (app *App) GetProfile(c *gin.Context) {
	profileID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "プロフィールIDが不正です"})
		return
	}

	var profile models.Profile
	var iconPath sql.NullString

	err = app.DB.QueryRowContext(
		context.Background(),
		`SELECT id, user_id, display_name, icon_path, aka, hometown, 
        birthdate, hobby, comment, title, description 
        FROM profiles WHERE id = $1`,
		profileID,
	).Scan(
		&profile.ID, &profile.UserID, &profile.DisplayName, &iconPath,
		&profile.AKA, &profile.Hometown, &profile.Birthdate,
		&profile.Hobby, &profile.Comment, &profile.Title, &profile.Description,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "プロフィールが見つかりません"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}

	// アイコンURLの設定
	if iconPath.Valid && iconPath.String != "" {
		profile.IconURL = fmt.Sprintf("/api/profiles/%d/icon", profile.ID)
	}

	c.JSON(http.StatusOK, profile)
}

// GetProfileIcon はプロフィールのアイコン画像を返すハンドラーです
func (app *App) GetProfileIcon(c *gin.Context) {
	profileID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "プロフィールIDが不正です"})
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
		c.JSON(http.StatusNotFound, gin.H{"error": "プロフィールが見つかりません"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}

	// アイコンが設定されていない場合
	if !iconPath.Valid || iconPath.String == "" {
		// デフォルトアイコンを返す
		defaultIconPath := "./assets/default-icon.png"
		if _, err := os.Stat(defaultIconPath); os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "アイコンがありません"})
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
			c.JSON(http.StatusNotFound, gin.H{"error": "アイコンファイルが存在しません"})
			return
		}
		c.File(defaultIconPath)
		return
	}

	// ユーザーのカスタムアイコンを送信
	c.File(iconPath.String)
}

// GetProfilesByUserID はユーザーIDに基づいてプロフィール一覧を取得するハンドラーです
func (app *App) GetProfilesByUserID(c *gin.Context) {
	// デバッグ用：リクエストの詳細をログ出力
	fmt.Printf("GetProfilesByUserID called - User ID from params: %s\n", c.Param("userId"))
	fmt.Printf("Authorization header: %s\n", c.GetHeader("Authorization"))

	// URLからユーザーIDを取得
	userID, err := strconv.Atoi(c.Param("userId"))
	if err != nil {
		fmt.Printf("Error parsing user ID: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "ユーザーIDが不正です"})
		return
	}

	// ユーザーの存在確認
	var exists bool
	err = app.DB.QueryRowContext(
		context.Background(),
		"SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)",
		userID,
	).Scan(&exists)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "ユーザーが見つかりません"})
		return
	}

	// プロフィール一覧の取得
	rows, err := app.DB.QueryContext(
		context.Background(),
		`SELECT id, user_id, display_name, icon_path, aka, hometown, 
        birthdate, hobby, comment, title, description 
        FROM profiles WHERE user_id = $1
        ORDER BY id DESC`,
		userID,
	)
	if err != nil {
		fmt.Printf("Error querying profiles: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}
	defer rows.Close()

	profiles := []models.Profile{}
	for rows.Next() {
		var profile models.Profile
		var iconPath sql.NullString
		var birthdate sql.NullTime

		err := rows.Scan(
			&profile.ID, &profile.UserID, &profile.DisplayName, &iconPath,
			&profile.AKA, &profile.Hometown, &birthdate,
			&profile.Hobby, &profile.Comment, &profile.Title, &profile.Description,
		)
		if err != nil {
			fmt.Printf("Error scanning profile row: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "データベース結果のスキャンエラー"})
			return
		}

		// Nullableフィールドの処理
		if birthdate.Valid {
			profile.Birthdate = birthdate.Time
		}

		// アイコンURLの設定
		if iconPath.Valid && iconPath.String != "" {
			profile.IconPath = iconPath.String
			profile.IconURL = fmt.Sprintf("/api/profiles/%d/icon", profile.ID)
		}

		profiles = append(profiles, profile)
	}

	// レスポンスを返す
	response := models.ProfileListResponse{
		Profiles: profiles,
		Count:    len(profiles),
	}

	c.JSON(http.StatusOK, response)
}
