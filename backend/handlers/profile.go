package handlers

import (
	"backend/models"
	"backend/utils"
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
	DB               *sql.DB
	CloudinaryClient *utils.CloudinaryClient
}

// NewApp は新しいAppインスタンスを作成します
func NewApp(db *sql.DB) (*App, error) {
	cloudinaryClient, err := utils.NewCloudinaryClient()
	if err != nil {
		// Cloudinaryが設定されていない場合はログを出力してnilを設定
		fmt.Printf("Cloudinary設定なし（ローカルファイル保存を使用）: %v\n", err)
		return &App{DB: db, CloudinaryClient: nil}, nil
	}

	return &App{DB: db, CloudinaryClient: cloudinaryClient}, nil
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

		// Cloudinaryが設定されている場合はCloudinaryを使用
		if app.CloudinaryClient != nil {
			filename := uuid.New().String()
			iconURL, err = app.CloudinaryClient.UploadImage(context.Background(), iconData, filename)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "画像のアップロードに失敗しました"})
				return
			}
		} else {
			// ローカルファイル保存（開発環境用）
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

			// 公開URL設定（開発環境用）
			iconURL = fmt.Sprintf("/api/uploads/%s", filename)
		}
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
		profile.IconURL = fmt.Sprintf("http://localhost:8080/api/profiles/%d/icon", profile.ID)
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
	var aka sql.NullString
	var hometown sql.NullString
	var birthdate sql.NullTime
	var hobby sql.NullString
	var comment sql.NullString
	var title sql.NullString
	var description sql.NullString

	err = app.DB.QueryRowContext(
		context.Background(),
		`SELECT id, user_id, display_name, icon_path, aka, hometown, 
        birthdate, hobby, comment, title, description 
        FROM profiles WHERE id = $1`,
		profileID,
	).Scan(
		&profile.ID, &profile.UserID, &profile.DisplayName, &iconPath,
		&aka, &hometown, &birthdate, &hobby, &comment, &title, &description,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "プロフィールが見つかりません"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}

	// NULL値の処理
	if aka.Valid {
		profile.AKA = aka.String
	}
	if hometown.Valid {
		profile.Hometown = hometown.String
	}
	if birthdate.Valid {
		profile.Birthdate = birthdate.Time
	}
	if hobby.Valid {
		profile.Hobby = hobby.String
	}
	if comment.Valid {
		profile.Comment = comment.String
	}
	if title.Valid {
		profile.Title = title.String
	}
	if description.Valid {
		profile.Description = description.String
	}

	// アイコンURLの設定
	if iconPath.Valid && iconPath.String != "" {
		profile.IconURL = fmt.Sprintf("http://localhost:8080/api/profiles/%d/icon", profile.ID)
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
			profile.IconURL = fmt.Sprintf("http://localhost:8080/api/profiles/%d/icon", profile.ID)
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

// DeleteProfile はプロフィールを削除するハンドラーです（本人のもののみ削除可）
func (app *App) DeleteProfile(c *gin.Context) {
	profileID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "プロフィールIDが不正です"})
		return
	}

	// ミドルウェアでセットされたユーザーIDを取得
	userIDAny, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証情報がありません"})
		return
	}
	userID, ok := userIDAny.(int)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証情報が不正です"})
		return
	}

	// プロフィールが本人のものか確認 & アイコンパス取得
	var dbUserID int
	var iconPath sql.NullString
	err = app.DB.QueryRowContext(
		context.Background(),
		"SELECT user_id, icon_path FROM profiles WHERE id = $1",
		profileID,
	).Scan(&dbUserID, &iconPath)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "プロフィールが見つかりません"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DBエラー"})
		return
	}

	if dbUserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "自分のプロフィールのみ削除できます"})
		return
	}

	// トランザクションを開始
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	tx, err := app.DB.BeginTx(ctx, nil)
	if err != nil {
		fmt.Printf("トランザクション開始エラー: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トランザクションの開始に失敗しました"})
		return
	}
	defer tx.Rollback() // エラー時に自動ロールバック

	// 関連データを先に削除（外部キー制約のため）
	// option_profilesを削除
	_, err = tx.ExecContext(
		ctx,
		"DELETE FROM option_profiles WHERE profile_id = $1",
		profileID,
	)
	if err != nil {
		fmt.Printf("option_profiles削除エラー: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "関連データの削除に失敗しました（option_profiles）"})
		return
	}

	// connectionsを削除
	_, err = tx.ExecContext(
		ctx,
		"DELETE FROM connections WHERE profile_id = $1 OR connect_user_profile_id = $1",
		profileID,
	)
	if err != nil {
		fmt.Printf("connections削除エラー: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "関連データの削除に失敗しました（connections）"})
		return
	}

	// リンクを削除
	_, err = tx.ExecContext(
		ctx,
		"DELETE FROM link WHERE profile_id = $1",
		profileID,
	)
	if err != nil {
		fmt.Printf("link削除エラー: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "関連データの削除に失敗しました（link）"})
		return
	}

	// プロファイル自体を削除
	result, err := tx.ExecContext(
		ctx,
		"DELETE FROM profiles WHERE id = $1",
		profileID,
	)
	if err != nil {
		fmt.Printf("profiles削除エラー: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "プロフィールの削除に失敗しました"})
		return
	}

	// 影響を受けた行数を確認
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		fmt.Printf("RowsAffected取得エラー: %v\n", err)
	} else if rowsAffected == 0 {
		fmt.Printf("削除されたプロフィールなし: ID=%d\n", profileID)
	}

	// トランザクションをコミット
	if err := tx.Commit(); err != nil {
		fmt.Printf("トランザクションコミットエラー: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "変更の確定に失敗しました"})
		return
	}

	// アイコン画像を削除
	if iconPath.Valid && iconPath.String != "" {
		if err := os.Remove(iconPath.String); err != nil && !os.IsNotExist(err) {
			// ログのみ、エラー応答は返さない
			fmt.Printf("Failed to delete profile icon: %v\n", err)
		}
	}

	// JSONレスポンスを返す
	c.JSON(http.StatusOK, gin.H{
		"message":    "プロフィールを削除しました",
		"profile_id": profileID,
	})
}
