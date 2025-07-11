package models

import "time"

// Connectionはプロフィール間のコネクション情報を表します
type Connection struct {
	ID                    int       `json:"id"`
	ProfileID             int       `json:"profile_id"`              // コネクションを作成したプロフィールID
	ConnectUsersProfileID int       `json:"connect_user_profile_id"` // 接続先のプロフィールID
	ConnectedAt           time.Time `json:"connected_at"`            // コネクション作成日時
	EventName             string    `json:"event_name,omitempty"`    // イベント名
	EventDate             string    `json:"event_date,omitempty"`    // イベント日付
	Memo                  string    `json:"memo,omitempty"`          // メモ
}

// CreateConnectionRequestは新規コネクション作成リクエスト
type CreateConnectionRequest struct {
	ProfileID             int    `json:"profile_id" binding:"required"`
	ConnectUsersProfileID int    `json:"connect_user_profile_id" binding:"required"`
	EventName             string `json:"event_name,omitempty"`
	EventDate             string `json:"event_date,omitempty"`
	Memo                  string `json:"memo,omitempty"`
}

// ConnectionListResponseはコネクション一覧レスポンス
type ConnectionListResponse struct {
	Connections []Connection `json:"connections"`
	Total       int          `json:"total"`
}

// UserConnectionはユーザーの交換済みプロフィール情報
type UserConnection struct {
	ConnectedProfileID    int       `json:"connected_profile_id"`
	ConnectedProfileTitle string    `json:"connected_profile_title"`
	ConnectedUserName     string    `json:"connected_user_name"`
	ConnectedAt           time.Time `json:"connected_at"`
	EventName             string    `json:"event_name,omitempty"`
	EventDate             string    `json:"event_date,omitempty"`
	Memo                  string    `json:"memo,omitempty"`
}
