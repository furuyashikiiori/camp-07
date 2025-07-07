package handlers

import (
	"backend/models"
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// コネクション申請・一覧・判定などのハンドラーをまとめたファイルです

// CreateConnection はコネクション申請(フォロー申請)を作成します
func (app *App) CreateConnection(c *gin.Context) {
	var req models.CreateConnectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエスト形式が不正です"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 既に申請・承認済みかチェック
	var exists int
	err := app.DB.QueryRowContext(ctx,
		`SELECT 1 FROM connections WHERE user_id=$1 AND connect_user_id=$2`,
		req.UsersID, req.ConnectUserID,
	).Scan(&exists)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "すでに申請または接続されています"})
		return
	}

	// コネクション新規作成
	var id int
	now := time.Now()
	err = app.DB.QueryRowContext(ctx,
		`INSERT INTO connections (user_id, connect_user_id, connect_user_profile_id, status, connected_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $5) RETURNING id`,
		req.UsersID, req.ConnectUserID, req.ConnectUsersProfileID, models.StatusPending, now,
	).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "登録に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"connection": models.Connection{
			ID:                    id,
			UsersID:               req.UsersID,
			ConnectUserID:         req.ConnectUserID,
			ConnectUsersProfileID: req.ConnectUsersProfileID,
			Status:                models.StatusPending,
			ConnectedAt:           now,
			UpdatedAt:             now,
		},
	})
}

// ApproveConnection はコネクション申請を「承認」または「拒否」します
func (app *App) ApproveConnection(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "IDが不正です"})
		return
	}

	var req models.UpdateConnectionRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Status == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "statusが必要です"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 更新処理
	res, err := app.DB.ExecContext(ctx,
		`UPDATE connections SET status=$1, updated_at=$2 WHERE id=$3`,
		*req.Status, time.Now(), id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新に失敗しました"})
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "該当するコネクションがありません"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

// ListConnections はログインユーザーの送受信コネクションをリストで返します
func (app *App) ListConnections(c *gin.Context) {
	// クエリ: user_id=[数字]（自分のID）
	userIDstr := c.Query("user_id")
	userID, err := strconv.Atoi(userIDstr)
	if err != nil || userID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_idが不正です"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := app.DB.QueryContext(ctx,
		`SELECT id, user_id, connect_user_id, connect_user_profile_id, status, connected_at, updated_at
         FROM connections WHERE user_id = $1 OR connect_user_id = $1 ORDER BY connected_at DESC`,
		userID,
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
			&conn.ID, &conn.UsersID, &conn.ConnectUserID, &conn.ConnectUsersProfileID,
			&conn.Status, &conn.ConnectedAt, &conn.UpdatedAt,
		); err == nil {
			list = append(list, conn)
		}
	}

	c.JSON(http.StatusOK, models.ConnectionListResponse{
		Connections: list,
		Total:       len(list),
	})
}

// IsMutualConnectionAPI は2名が承認済みで相互に接続しているか判定します
func (app *App) IsMutualConnectionAPI(c *gin.Context) {
	userID1, _ := strconv.Atoi(c.Query("user1"))
	userID2, _ := strconv.Atoi(c.Query("user2"))
	if userID1 == 0 || userID2 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user1, user2とも指定してください"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `SELECT user_id, connect_user_id, status FROM connections
              WHERE ((user_id=$1 AND connect_user_id=$2) OR (user_id=$2 AND connect_user_id=$1))
              AND status=$3`
	rows, err := app.DB.QueryContext(ctx, query, userID1, userID2, models.StatusAccepted)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "判定に失敗しました"})
		return
	}
	defer rows.Close()

	// 片側ずつ承認済みなら相互
	var forward, reverse bool
	for rows.Next() {
		var from, to int
		var status string
		_ = rows.Scan(&from, &to, &status)
		if from == userID1 && to == userID2 {
			forward = true
		}
		if from == userID2 && to == userID1 {
			reverse = true
		}
	}
	c.JSON(http.StatusOK, gin.H{"is_mutual": forward && reverse})
}

// GetConnections コネクション一覧取得
func (app *App) GetConnections(c *gin.Context) {
	app.ListConnections(c)
}

// UpdateConnection コネクションの承認・拒否
func (app *App) UpdateConnection(c *gin.Context) {
	app.ApproveConnection(c)
}

// DeleteConnection コネクション削除
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

// GetConnection コネクション1件取得
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
	err = app.DB.QueryRowContext(ctx, `SELECT id, user_id, connect_user_id, connect_user_profile_id, status, connected_at, updated_at FROM connections WHERE id=$1`, id).
		Scan(&conn.ID, &conn.UsersID, &conn.ConnectUserID, &conn.ConnectUsersProfileID, &conn.Status, &conn.ConnectedAt, &conn.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "該当データがありません"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"connection": conn})
}
