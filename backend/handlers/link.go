package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"backend/models"

	"github.com/gin-gonic/gin"
)

// リンク作成
func (app *App) CreateLink(c *gin.Context) {
	// JWTからユーザーIDを取得
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	var req models.CreateLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// JWTのユーザーIDを使用（リクエストのusers_idは不要に）
	var linkID int
	err := app.DB.QueryRowContext(
		context.Background(),
		`INSERT INTO link (users_id, image_url, title, description, url, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
		userID, req.ImageURL, req.Title, req.Description, req.URL,
		time.Now(), time.Now(),
	).Scan(&linkID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create link", "details": err.Error()})
		return
	}

	// 作成したリンクを取得して返す
	link, err := app.getLinkByID(linkID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created link"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Link created successfully",
		"link":    link,
	})
}

// ユーザーのリンク一覧取得
func (app *App) GetLinksByUser(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	rows, err := app.DB.QueryContext(
		context.Background(),
		`SELECT id, users_id, image_url, title, description, url, created_at, updated_at 
         FROM link 
         WHERE users_id = $1 
         ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var links []models.Link
	for rows.Next() {
		var link models.Link
		var imageURL, description sql.NullString

		err := rows.Scan(
			&link.ID, &link.UsersID,
			&imageURL, &link.Title, &description, &link.URL,
			&link.CreatedAt, &link.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Scan error"})
			return
		}

		// NULL値の処理
		if imageURL.Valid {
			link.ImageURL = &imageURL.String
		}
		if description.Valid {
			link.Description = &description.String
		}

		links = append(links, link)
	}

	c.JSON(http.StatusOK, models.LinkListResponse{
		Links: links,
		Total: len(links),
	})
}

// リンク詳細取得
func (app *App) GetLink(c *gin.Context) {
	linkIDStr := c.Param("id")
	linkID, err := strconv.Atoi(linkIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid link ID"})
		return
	}

	link, err := app.getLinkByID(linkID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Link not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"link": link})
}

// リンク更新
func (app *App) UpdateLink(c *gin.Context) {
	linkIDStr := c.Param("id")
	linkID, err := strconv.Atoi(linkIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid link ID"})
		return
	}

	var req models.UpdateLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// 既存のリンクを取得
	existingLink, err := app.getLinkByID(linkID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Link not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// 更新値の設定（nil の場合は既存値を使用）
	title := existingLink.Title
	if req.Title != nil {
		title = *req.Title
	}

	url := existingLink.URL
	if req.URL != nil {
		url = *req.URL
	}

	imageURL := existingLink.ImageURL
	if req.ImageURL != nil {
		imageURL = req.ImageURL
	}

	description := existingLink.Description
	if req.Description != nil {
		description = req.Description
	}

	// 更新実行
	_, err = app.DB.ExecContext(
		context.Background(),
		`UPDATE link 
         SET image_url = $1, title = $2, description = $3, url = $4, updated_at = $5 
         WHERE id = $6`,
		imageURL, title, description, url, time.Now(), linkID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update link"})
		return
	}

	// 更新後のリンクを取得
	updatedLink, err := app.getLinkByID(linkID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated link"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Link updated successfully",
		"link":    updatedLink,
	})
}

// リンク削除
func (app *App) DeleteLink(c *gin.Context) {
	linkIDStr := c.Param("id")
	linkID, err := strconv.Atoi(linkIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid link ID"})
		return
	}

	// リンクの存在確認
	_, err = app.getLinkByID(linkID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Link not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// 削除実行
	_, err = app.DB.ExecContext(
		context.Background(),
		"DELETE FROM link WHERE id = $1",
		linkID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete link"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Link deleted successfully"})
}

// よくあるリンクタイプ取得
func (app *App) GetCommonLinkTypes(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"link_types": models.CommonLinkTypes,
	})
}

// ヘルパー関数: IDでリンクを取得
func (app *App) getLinkByID(linkID int) (*models.Link, error) {
	var link models.Link
	var imageURL, description sql.NullString

	err := app.DB.QueryRowContext(
		context.Background(),
		`SELECT id, users_id, image_url, title, description, url, created_at, updated_at 
         FROM link WHERE id = $1`,
		linkID,
	).Scan(
		&link.ID, &link.UsersID,
		&imageURL, &link.Title, &description, &link.URL,
		&link.CreatedAt, &link.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	// NULL値の処理
	if imageURL.Valid {
		link.ImageURL = &imageURL.String
	}
	if description.Valid {
		link.Description = &description.String
	}

	return &link, nil
}
