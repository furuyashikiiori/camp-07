package models

// OptionProfile はプロフィールのオプション情報を表します
type OptionProfile struct {
	ID        int    `json:"id" db:"id"`
	Title     string `json:"title" db:"title"`           // オプションタイトル
	Content   string `json:"content" db:"content"`       // オプション内容
	ProfileID int    `json:"profile_id" db:"profile_id"` // 関連付けられたプロフィールID
}

// CreateOptionProfileRequest はオプションプロフィール作成リクエストを表します
type CreateOptionProfileRequest struct {
	Title     string `json:"title" binding:"required"`      // オプションタイトル
	Content   string `json:"content" binding:"required"`    // オプション内容
	ProfileID int    `json:"profile_id" binding:"required"` // 関連付けられたプロフィールID
}

// UpdateOptionProfileRequest はオプションプロフィール更新リクエストを表します
type UpdateOptionProfileRequest struct {
	Title   string `json:"title,omitempty"`   // オプションタイトル
	Content string `json:"content,omitempty"` // オプション内容
}

// OptionProfileListResponse はオプションプロフィール一覧レスポンスを表します
type OptionProfileListResponse struct {
	Options []OptionProfile `json:"option_profiles"` // オプションプロフィールのリスト
	Count   int             `json:"count"`           // オプションプロフィールの総数
}
