package handlers

import (
	"net/http"

	"backend/models"

	"github.com/gin-gonic/gin"
)

// ヘルスチェックハンドラー
func HealthCheck(c *gin.Context) {
	response := models.HealthResponse{
		Status: "ok繋がってるよ!",
	}
	c.JSON(http.StatusOK, response)
}
