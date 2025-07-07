package models

import (
	"time"
)

// Profile はユーザーのプロフィール情報を表します
type Profile struct {
	ID          int       `json:"id" db:"id"`
	UserID      int       `json:"user_id" db:"user_id"`
	DisplayName string    `json:"display_name" db:"display_name"`
	IconPath    string    `json:"icon_path,omitempty" db:"icon_path"`
	IconURL     string    `json:"icon_url,omitempty" db:"-"`              // DB上にないが、フロントに返す用
	AKA         string    `json:"aka,omitempty" db:"aka"`                 // 肩書き
	Hometown    string    `json:"hometown,omitempty" db:"hometown"`       // 出身地
	Birthdate   time.Time `json:"birthdate,omitempty" db:"birthdate"`     // 誕生日
	Hobby       string    `json:"hobby,omitempty" db:"hobby"`             // 趣味
	Comment     string    `json:"comment,omitempty" db:"comment"`         // コメント
	Title       string    `json:"title,omitempty" db:"title"`             // タイトル
	Description string    `json:"description,omitempty" db:"description"` // 説明
}

// CreateProfileRequest はプロフィール作成リクエストを表します
type CreateProfileRequest struct {
	UserID      int    `json:"user_id" binding:"required"`
	DisplayName string `json:"display_name" binding:"required"`
	IconBase64  string `json:"icon_base64,omitempty"`                                       // 任意。base64 エンコードされた画像
	AKA         string `json:"aka,omitempty"`                                               // 肩書き（任意）
	Hometown    string `json:"hometown,omitempty"`                                          // 出身地（任意）
	Birthdate   string `json:"birthdate,omitempty" binding:"omitempty,datetime=2006-01-02"` // 誕生日（任意）YYYY-MM-DD形式
	Hobby       string `json:"hobby,omitempty"`                                             // 趣味（任意）
	Comment     string `json:"comment,omitempty"`                                           // コメント（任意）
	Title       string `json:"title" binding:"required"`                                    // タイトル（必須）
	Description string `json:"description,omitempty"`                                       // 説明（任意）
}

// UpdateProfileRequest はプロフィール更新リクエストを表します
type UpdateProfileRequest struct {
	DisplayName string `json:"display_name,omitempty"`
	IconBase64  string `json:"icon_base64,omitempty"`
	AKA         string `json:"aka,omitempty"` // 肩書き
	Hometown    string `json:"hometown,omitempty"`
	Birthdate   string `json:"birthdate,omitempty" binding:"omitempty,datetime=2006-01-02"` // YYYY-MM-DD形式
	Hobby       string `json:"hobby,omitempty"`
	Comment     string `json:"comment,omitempty"`
	Title       string `json:"title,omitempty"` // タイトル
	Description string `json:"description,omitempty"`
}

// ProfileListResponse はプロフィール一覧レスポンスを表します
type ProfileListResponse struct {
	Profiles []Profile `json:"profiles"`
	Count    int       `json:"count"`
}

// ProfileListOptions はプロフィール一覧取得時のオプションを表します
type ProfileListOptions struct {
	UserID int    `form:"user_id"`
	Sort   string `form:"sort"`   // 例: "created_at", "-created_at" (降順)
	Limit  int    `form:"limit"`  // 取得件数
	Offset int    `form:"offset"` // スキップする件数
}
