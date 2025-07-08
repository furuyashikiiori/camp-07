"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import styles from "./QRGenerator.module.css";

interface QRGeneratorProps {
  profileId: number;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ profileId }) => {
  const [url, setUrl] = useState("");
  const [qrData, setQrData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qrRef = useRef<HTMLImageElement>(null);

  // プロフィールIDが変更されたときにQRコードを生成
  useEffect(() => {
    const generateProfileQR = async () => {
      if (!profileId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        // 環境に応じたベースURLの決定
        const getBaseUrl = () => {
          if (process.env.NODE_ENV === "development") {
            return "http://localhost:3000";
          }
          
          // 本番環境での分岐
          if (typeof window !== "undefined") {
            const hostname = window.location.hostname;
            if (hostname === "qrsona-dev.vercel.app") {
              return "https://qrsona-dev.vercel.app";
            }
          }
          
          // デフォルトは本番環境
          return "https://qrsona.vercel.app";
        };
        
        const baseUrl = getBaseUrl();
        const profileUrl = `${baseUrl}/profile/${profileId}`;
        const urlWithTimestamp = `${profileUrl}?t=${Date.now()}`;
        const response = await axios.post(`/api/generate-qr`, {
          url: urlWithTimestamp,
        });

        if (response.data && response.data.qr_data) {
          setQrData(response.data.qr_data);
          setUrl(profileUrl);
        } else {
          throw new Error("QRコードデータが見つかりません");
        }
      } catch (error) {
        console.error("Error generating profile QR code:", error);
        setError("QRコードの生成に失敗しました。再試行してください。");
      } finally {
        setIsLoading(false);
      }
    };

    generateProfileQR();
  }, [profileId]);

  const handleReload = async () => {
    if (!url) return;

    setIsLoading(true);
    setError(null);
    try {
      const urlWithTimestamp = `${url}?t=${Date.now()}`;
      const response = await axios.post(`/api/generate-qr`, {
        url: urlWithTimestamp,
      });

      if (response.data && response.data.qr_data) {
        setQrData(response.data.qr_data);
      } else {
        throw new Error("QRコードデータが見つかりません");
      }
    } catch (error) {
      console.error("Error regenerating QR code:", error);
      setError("QRコードの再生成に失敗しました。再試行してください。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrData) {
      setError("ダウンロードするQRコードがありません");
      return;
    }

    try {
      const link = document.createElement("a");
      link.href = qrData;
      link.download = "qrcode.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      setError("ダウンロードに失敗しました");
    }
  };

  return (
    <div className={styles.qrGenerator}>
      <h1>QRコードの作成</h1>
      <p className={styles.urlDisplay}>生成対象URL: {url}</p>

      {/* エラーメッセージ表示 */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button
            onClick={() => {
              setError(null);
              handleReload();
            }}
            className={styles.retryButton}
          >
            再試行
          </button>
        </div>
      )}

      {/* ローディング表示 */}
      {isLoading && <div className={styles.loading}>QRコードを生成中...</div>}

      {/* QRコード表示 */}
      {qrData && !isLoading && (
        <div className={styles.qrResult}>
          <Image
            ref={qrRef}
            src={qrData}
            alt='QR Code'
            className={styles.qrImage}
            width={256}
            height={256}
            unoptimized
          />
          <div className={styles.qrActions}>
            <button
              onClick={handleReload}
              className={styles.qrActionButton}
              disabled={isLoading}
            >
              {isLoading ? "生成中..." : "リロード"}
            </button>
            <button
              onClick={handleDownload}
              className={styles.qrActionButton}
              disabled={isLoading}
            >
              ダウンロード
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRGenerator;
