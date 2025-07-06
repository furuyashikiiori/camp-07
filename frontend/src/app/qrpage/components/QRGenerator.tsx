"use client";

import React, { useState, useRef } from "react";
import axios from "axios";
import styles from "./QRGenerator.module.css";

const QRGenerator: React.FC = () => {
  const [url, setUrl] = useState("");
  const [qrData, setQrData] = useState("");
  const qrRef = useRef<HTMLImageElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const urlWithTimestamp = `${url}?t=${Date.now()}`;
      const response = await axios.post("http://localhost:8080/api/generate-qr", {
        url: urlWithTimestamp,
      });
      setQrData(response.data.qr_data);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const handleReload = async () => {
    if (url) {
      try {
        const urlWithTimestamp = `${url}?t=${Date.now()}`;
        const response = await axios.post("http://localhost:8080/api/generate-qr", {
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
      <form onSubmit={handleSubmit} className={styles.qrForm}>
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
      </form>
      {qrData && (
        <div className={styles.qrResult}>
          <img
            ref={qrRef}
            src={qrData}
            alt='QR Code'
            className={styles.qrImage}
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
