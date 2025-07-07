package models

// Profile はユーザーのプロフィール情報を表します
type Profile struct {
	ID          int    `json:"id"`
	UserID      int    `json:"user_id"`
	DisplayName string `json:"display_name"`
	IconURL     string `json:"icon_url,omitempty"` // アイコン URL (設定されている場合)
}

// CreateProfileRequest はプロフィール作成リクエストを表します
type CreateProfileRequest struct {
	UserID      int    `json:"user_id" binding:"required"`
	DisplayName string `json:"display_name" binding:"required"`
	IconBase64  string `json:"icon_base64,omitempty"` // 任意。base64 エンコードされた画像
}

// UpdateProfileRequest はプロフィール更新リクエストを表します
type UpdateProfileRequest struct {
	DisplayName string `json:"display_name,omitempty"`
	IconBase64  string `json:"icon_base64,omitempty"`
}
