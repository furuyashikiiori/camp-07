package models

type Connection struct {
	ID                    int    `json:"id"`
	UsersID               int    `json:"users_id"`
	ConnectUserID         int    `json:"connect_user_id"`
	ConnectUsersProfileID int    `json:"connect_users_profile_id"`
	ConnectedAt           string `json:"connected_at"`
}
type CreateConnectionRequest struct {
	UsersID               int `json:"users_id" binding:"required"`
	ConnectUserID         int `json:"connect_user_id" binding:"required"`
	ConnectUsersProfileID int `json:"connect_users_profile_id" binding:"required"`
}
type UpdateConnectionRequest struct {
	ConnectUserID         *int `json:"connect_user_id,omitempty"`
	ConnectUsersProfileID *int `json:"connect_users_profile_id,omitempty"`
}
type ConnectionListResponse struct {
	Connections []Connection `json:"connections"`
	Total       int          `json:"total"`
}
