package models

import "time"

// Link構造体
type Link struct {
	ID          int       `json:"id" db:"id"`
	UsersID     int       `json:"user_id" db:"user_id"`
	ProfileID   *int      `json:"profile_id,omitempty" db:"profile_id"`
	ImageURL    *string   `json:"image_url,omitempty" db:"image_url"`
	Title       string    `json:"title" db:"title"`
	Description *string   `json:"description,omitempty" db:"description"`
	URL         string    `json:"url" db:"url"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// リンク作成用リクエスト
type CreateLinkRequest struct {
	UsersID     *int    `json:"user_id,omitempty"`
	ProfileID   *int    `json:"profile_id,omitempty"`
	ImageURL    *string `json:"image_url,omitempty"`
	Title       string  `json:"title" binding:"required,max=100"`
	Description *string `json:"description,omitempty"`
	URL         string  `json:"url" binding:"required,url"`
}

// リンク更新用リクエスト
type UpdateLinkRequest struct {
	ImageURL    *string `json:"image_url,omitempty"`
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	URL         *string `json:"url,omitempty"`
}

// リンク一覧レスポンス
type LinkListResponse struct {
	Links []Link `json:"links"`
	Total int    `json:"total"`
}

// よくあるSNSリンクの種類
type LinkType struct {
	Name        string `json:"name"`
	IconURL     string `json:"icon_url"`
	BaseURL     string `json:"base_url"`
	Placeholder string `json:"placeholder"`
}

// プリセットリンクタイプ
var CommonLinkTypes = []LinkType{
	{
		Name:        "Twitter/X",
		IconURL:     "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg",
		BaseURL:     "https://x.com/",
		Placeholder: "username",
	},
	{
		Name:        "GitHub",
		IconURL:     "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg",
		BaseURL:     "https://github.com/",
		Placeholder: "username",
	},
	{
		Name:        "Instagram",
		IconURL:     "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg",
		BaseURL:     "https://instagram.com/",
		Placeholder: "username",
	},
	{
		Name:        "YouTube",
		IconURL:     "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg",
		BaseURL:     "https://youtube.com/@",
		Placeholder: "username",
	},
	{
		Name:        "LinkedIn",
		IconURL:     "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg",
		BaseURL:     "https://linkedin.com/in/",
		Placeholder: "username",
	},
	{
		Name:        "TikTok",
		IconURL:     "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg",
		BaseURL:     "https://tiktok.com/@",
		Placeholder: "username",
	},
	{
		Name:        "Facebook",
		IconURL:     "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg",
		BaseURL:     "https://facebook.com/",
		Placeholder: "username",
	},
	{
		Name:        "Email",
		IconURL:     "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gmail.svg",
		BaseURL:     "mailto:",
		Placeholder: "email@example.com",
	},
}
