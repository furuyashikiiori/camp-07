package utils

import (
	"bytes"
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

	fmt.Printf("Cloudinary env check - CloudName: %s, APIKey: %s, APISecret: %s\n", 
		cloudName, 
		func() string { if apiKey != "" { return "***set***" } else { return "***empty***" } }(),
		func() string { if apiSecret != "" { return "***set***" } else { return "***empty***" } }())

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		return nil, fmt.Errorf("cloudinary環境変数が設定されていません")
	}

	fmt.Printf("Creating Cloudinary client with cloud name: %s\n", cloudName)
	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, fmt.Errorf("cloudinaryクライアントの作成に失敗しました: %v", err)
	}

	fmt.Printf("Cloudinary client created successfully\n")
	return &CloudinaryClient{client: cld}, nil
}

// UploadImage は画像をCloudinaryにアップロードします
func (c *CloudinaryClient) UploadImage(ctx context.Context, imageData []byte, filename string) (string, error) {
	fmt.Printf("Cloudinary upload start - filename: %s, data size: %d bytes\n", filename, len(imageData))
	
	// データサイズをチェック（10MB制限）
	if len(imageData) > 10*1024*1024 {
		return "", fmt.Errorf("画像サイズが大きすぎます: %d bytes", len(imageData))
	}

	// バイト配列をReaderに変換
	reader := bytes.NewReader(imageData)

	// アップロードパラメータの設定（シンプルにする）
	uploadParams := uploader.UploadParams{
		PublicID:     filename,
		Folder:       "qrsona/profiles",
		ResourceType: "image",
		// Transformationを削除（アップロード時の負荷を軽減）
	}

	fmt.Printf("Upload params: PublicID=%s, Folder=%s\n", uploadParams.PublicID, uploadParams.Folder)

	// 画像をアップロード（ReaderをFile parameterとして使用）
	result, err := c.client.Upload.Upload(ctx, reader, uploadParams)
	if err != nil {
		fmt.Printf("Cloudinary upload failed: %v\n", err)
		return "", fmt.Errorf("画像のアップロードに失敗しました: %v", err)
	}

	fmt.Printf("Cloudinary upload success - SecureURL: %s\n", result.SecureURL)
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
