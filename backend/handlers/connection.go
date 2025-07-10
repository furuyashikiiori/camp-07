package handlers

import (
	"backend/models"
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// CreateConnectionは新規コネクション（フォロー）を作成します
func (app *App) CreateConnection(c *gin.Context) {
	var req models.CreateConnectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエスト形式が不正です"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 既存のコネクション重複防止
	var exists int
	err := app.DB.QueryRowContext(ctx,
		`SELECT 1 FROM connections WHERE profile_id = $1 AND connect_user_profile_id = $2`,
		req.ProfileID, req.ConnectUsersProfileID,
	).Scan(&exists)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "すでに作成されています"})
		return
	}

	// コネクション新規作成
	var id int
	now := time.Now()
	err = app.DB.QueryRowContext(ctx,
		`INSERT INTO connections (profile_id, connect_user_profile_id, connected_at, event_name, event_date, memo)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
		req.ProfileID, req.ConnectUsersProfileID, now, req.EventName, req.EventDate, req.Memo,
	).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "登録に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"connection": models.Connection{
			ID:                    id,
			ProfileID:             req.ProfileID,
			ConnectUsersProfileID: req.ConnectUsersProfileID,
			ConnectedAt:           now,
			EventName:             req.EventName,
			EventDate:             req.EventDate,
			Memo:                  req.Memo,
		},
	})
}

// ListConnectionsは指定プロフィールが作成したコネクションの一覧を返します
func (app *App) ListConnections(c *gin.Context) {
	profileIDstr := c.Query("profile_id")
	profileID, err := strconv.Atoi(profileIDstr)
	if err != nil || profileID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "profile_idが不正です"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := app.DB.QueryContext(ctx,
		`SELECT id, profile_id, connect_user_profile_id, connected_at, event_name, event_date, memo
         FROM connections WHERE profile_id = $1 ORDER BY connected_at DESC`,
		profileID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "取得に失敗しました"})
		return
	}
	defer rows.Close()

	var list []models.Connection
	for rows.Next() {
		var conn models.Connection
		if err := rows.Scan(
			&conn.ID, &conn.ProfileID, &conn.ConnectUsersProfileID, &conn.ConnectedAt,
			&conn.EventName, &conn.EventDate, &conn.Memo,
		); err == nil {
			list = append(list, conn)
		}
	}

	c.JSON(http.StatusOK, models.ConnectionListResponse{
		Connections: list,
		Total:       len(list),
	})
}

// GetConnectionsはListConnectionsへのエイリアス
func (app *App) GetConnections(c *gin.Context) {
	app.ListConnections(c)
}

// DeleteConnectionは指定IDのコネクションを削除します
func (app *App) DeleteConnection(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "IDが不正です"})
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := app.DB.ExecContext(ctx, `DELETE FROM connections WHERE id=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "削除に失敗しました"})
		return
	}
	num, _ := res.RowsAffected()
	if num == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "該当データがありません"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

// GetConnectionは指定IDのコネクションの詳細情報を返します
func (app *App) GetConnection(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "IDが不正です"})
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var conn models.Connection
	err = app.DB.QueryRowContext(ctx,
		`SELECT id, profile_id, connect_user_profile_id, connected_at, event_name, event_date, memo 
		 FROM connections WHERE id=$1`, id).
		Scan(&conn.ID, &conn.ProfileID, &conn.ConnectUsersProfileID, &conn.ConnectedAt,
			&conn.EventName, &conn.EventDate, &conn.Memo)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "該当データがありません"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"connection": conn})
}

// GetUserConnectionsは指定ユーザーの交換済みプロフィール一覧を返します
func (app *App) GetUserConnections(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ユーザーIDが不正です"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// ユーザーの交換済みプロフィール情報を取得
	query := `
		SELECT DISTINCT
			cp.id as connected_profile_id,
			cp.title as connected_profile_title,
			cu.name as connected_user_name,
			c.connected_at,
			c.event_name,
			c.event_date,
			c.memo
		FROM connections c
		JOIN profiles p ON c.profile_id = p.id
		JOIN profiles cp ON c.connect_user_profile_id = cp.id
		JOIN users cu ON cp.user_id = cu.id
		WHERE p.user_id = $1
		ORDER BY c.connected_at DESC
	`

	rows, err := app.DB.QueryContext(ctx, query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データの取得に失敗しました"})
		return
	}
	defer rows.Close()

	var connections []models.UserConnection
	for rows.Next() {
		var conn models.UserConnection
		if err := rows.Scan(
			&conn.ConnectedProfileID,
			&conn.ConnectedProfileTitle,
			&conn.ConnectedUserName,
			&conn.ConnectedAt,
			&conn.EventName,
			&conn.EventDate,
			&conn.Memo,
		); err == nil {
			connections = append(connections, conn)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"connections": connections,
		"total":       len(connections),
	})
}

// UpdateConnectionは指定IDのコネクション情報を更新します
func (app *App) UpdateConnection(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "IDが不正です"})
		return
	}

	var req struct {
		EventName string `json:"event_name"`
		EventDate string `json:"event_date"`
		Memo      string `json:"memo"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエスト形式が不正です"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// コネクションを更新
	result, err := app.DB.ExecContext(ctx,
		`UPDATE connections SET event_name = $1, event_date = $2, memo = $3 WHERE id = $4`,
		req.EventName, req.EventDate, req.Memo, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新に失敗しました"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "該当データがありません"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"result":  "success",
		"message": "コネクション情報を更新しました",
	})
}
