package models

// QRコード生成リクエスト用の構造体
type URLRequest struct {
	URL string `json:"url" binding:"required"`
}

// QRコード生成レスポンス用の構造体
type QRCodeResponse struct {
	QRData string `json:"qr_data"`
	URL    string `json:"url"`
}

// ヘルスチェックレスポンス用の構造体
type HealthResponse struct {
	Status string `json:"status"`
}
