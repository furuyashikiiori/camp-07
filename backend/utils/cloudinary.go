package utils

import (
	"context"
	"fmt"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

// CloudinaryClient はCloudinaryクライアントを保持します
type CloudinaryClient struct {
	client *cloudinary.Cloudinary
}

// NewCloudinaryClient は新しいCloudinaryクライアントを作成します
func NewCloudinaryClient() (*CloudinaryClient, error) {
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		return nil, fmt.Errorf("Cloudinary環境変数が設定されていません")
	}

	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, fmt.Errorf("Cloudinaryクライアントの作成に失敗しました: %v", err)
	}

	return &CloudinaryClient{client: cld}, nil
}

// UploadImage は画像をCloudinaryにアップロードします
func (c *CloudinaryClient) UploadImage(ctx context.Context, imageData []byte, filename string) (string, error) {
	// アップロードパラメータの設定
	uploadParams := uploader.UploadParams{
		PublicID:     filename,
		Folder:       "qrsona/profiles", // フォルダ名を指定
		ResourceType: "image",
		Format:       "png",
		Transformation: "c_fill,h_300,w_300", // 300x300にリサイズ
	}

	// 画像をアップロード
	result, err := c.client.Upload.Upload(ctx, imageData, uploadParams)
	if err != nil {
		return "", fmt.Errorf("画像のアップロードに失敗しました: %v", err)
	}

	return result.SecureURL, nil
}

// DeleteImage はCloudinaryから画像を削除します
func (c *CloudinaryClient) DeleteImage(ctx context.Context, publicID string) error {
	_, err := c.client.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID: publicID,
	})
	if err != nil {
		return fmt.Errorf("画像の削除に失敗しました: %v", err)
	}
	return nil
}
