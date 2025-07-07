package models

type OptionProfile struct {
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	UserID    int    `json:"user_id"`
	ProfileId int    `json:"profile_id"`
}
