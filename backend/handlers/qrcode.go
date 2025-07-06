package handlers

import (
	"encoding/base64"
	"net/http"

	"backend/models"

	"github.com/gin-gonic/gin"
	"github.com/skip2/go-qrcode"
)

// QRコード生成ハンドラー
func GenerateQRCode(c *gin.Context) {
	var req models.URLRequest

	// リクエストのバリデーション
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "リクエストボディの形式が正しくありません",
		})
		return
	}

	// QRコード生成
	qr, err := qrcode.Encode(req.URL, qrcode.Medium, 256)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "QRコードの生成に失敗しました",
		})
		return
	}

	// Base64エンコード
	base64Encoding := base64.StdEncoding.EncodeToString(qr)
	dataURI := "data:image/png;base64," + base64Encoding

	// レスポンス作成
	response := models.QRCodeResponse{
		QRData: dataURI,
		URL:    req.URL,
	}

	c.JSON(http.StatusOK, response)
}
