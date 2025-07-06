"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import styles from "./QRGenerator.module.css";

const QRGenerator: React.FC = () => {
  const [url, setUrl] = useState("");
  const [qrData, setQrData] = useState("");
  const qrRef = useRef<HTMLImageElement>(null);

  // コンポーネントマウント時にマイページのQRコードを自動生成
  useEffect(() => {
    const generateInitialQR = async () => {
      try {
        const baseUrl = process.env.NODE_ENV === 'production'
          ? 'https://qrsona.vercel.app'
          : 'http://localhost:3000';
        const urlWithTimestamp = `${baseUrl}/mypage?t=${Date.now()}`;
        const response = await axios.post(`/api/generate-qr`, {
          url: urlWithTimestamp,
        });
        setQrData(response.data.qr_data);
        setUrl(`${baseUrl}/mypage`);
      } catch (error) {
        console.error("Error generating initial QR code:", error);
      }
    };

    generateInitialQR();
  }, []);


  const handleReload = async () => {
    if (url) {
      try {
        const urlWithTimestamp = `${url}?t=${Date.now()}`;
        const response = await axios.post(`/api/generate-qr`, {
          url: urlWithTimestamp,
        });
        setQrData(response.data.qr_data);
      } catch (error) {
        console.error("Error regenerating QR code:", error);
      }
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrData;
    link.download = "qrcode.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.qrGenerator}>
      <h1>QRコードの作成</h1>
      {/* <form onSubmit={handleSubmit} className={styles.qrForm}>
        <input
          type='url'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder='Enter URL'
          required
          className={styles.qrInput}
        />
        <button type='submit' className={styles.qrButton}>
          生成
        </button>
      </form> */}
      {qrData && (
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
            <button onClick={handleReload} className={styles.qrActionButton}>
              リロード
            </button>
            <button onClick={handleDownload} className={styles.qrActionButton}>
              ダウンロード
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRGenerator;
