package models

import "time"

// Connectionはプロフィール間のコネクション情報を表します
type Connection struct {
	ID                    int       `json:"id"`
	ProfileID             int       `json:"profile_id"`              // コネクションを作成したプロフィールID
	ConnectUsersProfileID int       `json:"connect_user_profile_id"` // 接続先のプロフィールID
	ConnectedAt           time.Time `json:"connected_at"`            // コネクション作成日時
}

// CreateConnectionRequestは新規コネクション作成リクエスト
type CreateConnectionRequest struct {
	ProfileID             int `json:"profile_id" binding:"required"`
	ConnectUsersProfileID int `json:"connect_user_profile_id" binding:"required"`
}

// ConnectionListResponseはコネクション一覧レスポンス
type ConnectionListResponse struct {
	Connections []Connection `json:"connections"`
	Total       int          `json:"total"`
}
