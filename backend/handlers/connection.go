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
		`INSERT INTO connections (profile_id, connect_user_profile_id, connected_at)
         VALUES ($1, $2, $3) RETURNING id`,
		req.ProfileID, req.ConnectUsersProfileID, now,
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
		`SELECT id, profile_id, connect_user_profile_id, connected_at
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
		`SELECT id, profile_id, connect_user_profile_id, connected_at FROM connections WHERE id=$1`, id).
		Scan(&conn.ID, &conn.ProfileID, &conn.ConnectUsersProfileID, &conn.ConnectedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "該当データがありません"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"connection": conn})
}
