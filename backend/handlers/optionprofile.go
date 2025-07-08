package handlers

import (
	"backend/models"
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// CreateOptionProfile は新しい任意項目を作成するハンドラー
func (app *App) CreateOptionProfile(c *gin.Context) {
	var req models.CreateOptionProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストが不正です"})
		return
	}

	// Profileの存在チェック
	var exists bool
	err := app.DB.QueryRowContext(
		context.Background(),
		"SELECT EXISTS(SELECT 1 FROM profiles WHERE id = $1)", req.ProfileID,
	).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "プロフィールが存在しません"})
		return
	}

	// DBにINSERT
	var optionID int
	query := `INSERT INTO option_profiles (title, content, profile_id) VALUES ($1, $2, $3) RETURNING id`
	err = app.DB.QueryRowContext(context.Background(), query, req.Title, req.Content, req.ProfileID).
		Scan(&optionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "任意項目の作成に失敗しました"})
		return
	}

	optionProfile := models.OptionProfile{
		ID:        optionID,
		Title:     req.Title,
		Content:   req.Content,
		ProfileID: req.ProfileID,
	}
	c.JSON(http.StatusCreated, optionProfile)
}

// UpdateOptionProfile は任意項目を更新するハンドラー
func (app *App) UpdateOptionProfile(c *gin.Context) {
	optionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "任意項目のIDが不正です"})
		return
	}

	var req models.UpdateOptionProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストが不正です"})
		return
	}

	// 部分更新に対応
	fields := []string{}
	params := []interface{}{}
	paramCnt := 1
	if req.Title != "" {
		fields = append(fields, fmt.Sprintf("title = $%d", paramCnt))
		params = append(params, req.Title)
		paramCnt++
	}
	if req.Content != "" {
		fields = append(fields, fmt.Sprintf("content = $%d", paramCnt))
		params = append(params, req.Content)
		paramCnt++
	}
	if len(fields) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "更新する項目がありません"})
		return
	}

	updateQuery := fmt.Sprintf(
		"UPDATE option_profiles SET %s WHERE id = $%d RETURNING id, title, content, profile_id",
		strings.Join(fields, ", "), paramCnt,
	)
	params = append(params, optionID)
	var updated models.OptionProfile
	err = app.DB.QueryRowContext(context.Background(), updateQuery, params...).
		Scan(&updated.ID, &updated.Title, &updated.Content, &updated.ProfileID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "任意項目が見つかりません"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "任意項目の更新に失敗しました"})
		return
	}
	c.JSON(http.StatusOK, updated)
}

// DeleteOptionProfile は任意項目を削除するハンドラー
func (app *App) DeleteOptionProfile(c *gin.Context) {
	optionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "任意項目のIDが不正です"})
		return
	}

	res, err := app.DB.ExecContext(context.Background(),
		"DELETE FROM option_profiles WHERE id = $1", optionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}
	count, _ := res.RowsAffected()
	if count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "任意項目が見つかりません"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"result": "削除しました"})
}

// GetOptionProfilesByProfileID はprofile_idで任意項目のリストを返すハンドラー
func (app *App) GetOptionProfilesByProfileID(c *gin.Context) {
	profileID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "プロフィールIDが不正です"})
		return
	}

	rows, err := app.DB.QueryContext(
		context.Background(),
		"SELECT id, title, content, profile_id FROM option_profiles WHERE profile_id = $1 ORDER BY id DESC", profileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}
	defer rows.Close()

	options := []models.OptionProfile{}
	for rows.Next() {
		var opt models.OptionProfile
		err := rows.Scan(&opt.ID, &opt.Title, &opt.Content, &opt.ProfileID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースのスキャンエラー"})
			return
		}
		options = append(options, opt)
	}
	resp := models.OptionProfileListResponse{
		Options: options,
		Count:   len(options),
	}
	c.JSON(http.StatusOK, resp)
}
