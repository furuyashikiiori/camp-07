package models

import "time"

// ConnectionStatus はコネクション（フォロー申請等）の状態を定数で管理します
const (
	StatusPending  = "pending"  // 申請中
	StatusAccepted = "accepted" // 承認済み
	StatusRejected = "rejected" // 拒否
)

// Connection はユーザー間のコネクション（相互フォロー）情報を表します
type Connection struct {
	ID                    int       `json:"id"`
	UsersID               int       `json:"user_id"`                 // 自分のユーザーID
	ConnectUserID         int       `json:"connect_user_id"`         // 相手のユーザーID
	ConnectUsersProfileID int       `json:"connect_user_profile_id"` // 相手のプロフィールID
	Status                string    `json:"status"`                  // コネクション状態
	ConnectedAt           time.Time `json:"connected_at"`            // 作成日時
	UpdatedAt             time.Time `json:"updated_at"`              // 更新日時
}

// CreateConnectionRequest は新規コネクション申請リクエスト
type CreateConnectionRequest struct {
	UsersID               int `json:"user_id" binding:"required"`
	ConnectUserID         int `json:"connect_user_id" binding:"required"`
	ConnectUsersProfileID int `json:"connect_user_profile_id" binding:"required"`
}

// UpdateConnectionRequest はコネクションの承認・拒否や編集に使うリクエスト
type UpdateConnectionRequest struct {
	Status *string `json:"status,omitempty"` // accepted等
}

// ConnectionListResponse はコネクション一覧のレスポンスです
type ConnectionListResponse struct {
	Connections []Connection `json:"connections"`
	Total       int          `json:"total"`
}
