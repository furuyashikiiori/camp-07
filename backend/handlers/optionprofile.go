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

// CreateOptionProfile は新しいoption_profileを作成するハンドラー
func (app *App) CreateOptionProfile(c *gin.Context) {
	var req models.CreateOptionProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Profileの存在チェック
	var exists bool
	err := app.DB.QueryRowContext(
		context.Background(),
		"SELECT EXISTS(SELECT 1 FROM profiles WHERE id = $1)", req.ProfileID,
	).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Profile does not exist"})
		return
	}

	// DBにINSERT
	var optionID int
	query := `INSERT INTO option_profiles (title, content, profile_id) VALUES ($1, $2, $3) RETURNING id`
	err = app.DB.QueryRowContext(context.Background(), query, req.Title, req.Content, req.ProfileID).
		Scan(&optionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to create option_profile",
			"detail": fmt.Sprintf("%v", err),
		})
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

// UpdateOptionProfile はoption_profileを更新するハンドラー
func (app *App) UpdateOptionProfile(c *gin.Context) {
	optionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid option_profile ID"})
		return
	}

	var req models.UpdateOptionProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
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
		c.JSON(http.StatusNotFound, gin.H{"error": "OptionProfile not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update option_profile"})
		return
	}
	c.JSON(http.StatusOK, updated)
}

// DeleteOptionProfile はoption_profileを削除するハンドラー
func (app *App) DeleteOptionProfile(c *gin.Context) {
	optionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid option_profile ID"})
		return
	}

	res, err := app.DB.ExecContext(context.Background(),
		"DELETE FROM option_profiles WHERE id = $1", optionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	count, _ := res.RowsAffected()
	if count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "OptionProfile not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"result": "deleted"})
}

// GetOptionProfilesByProfileID はprofile_idでoption_profileのリストを返すハンドラー
func (app *App) GetOptionProfilesByProfileID(c *gin.Context) {
	profileID, err := strconv.Atoi(c.Param("id")) // ← 修正: "profileId" → "id"
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid profile ID"})
		return
	}

	rows, err := app.DB.QueryContext(
		context.Background(),
		"SELECT id, title, content, profile_id FROM option_profiles WHERE profile_id = $1 ORDER BY id DESC", profileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	options := []models.OptionProfile{}
	for rows.Next() {
		var opt models.OptionProfile
		err := rows.Scan(&opt.ID, &opt.Title, &opt.Content, &opt.ProfileID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database scan error"})
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
