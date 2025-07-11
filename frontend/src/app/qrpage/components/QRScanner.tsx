'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import styles from './QRScanner.module.css';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(true);

      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      const videoInputDevices = await readerRef.current.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('カメラが見つかりません');
      }

      // 背面カメラを優先的に選択
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      ) || videoInputDevices[0];

      if (videoRef.current) {
        await readerRef.current.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              const scannedText = result.getText();
              onScan(scannedText);
              onClose();
            }
            if (error && !(error.name === 'NotFoundException')) {
              console.error('Scanning error:', error);
            }
          }
        );
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(err instanceof Error ? err.message : 'カメラの起動に失敗しました');
      setIsScanning(false);
    }
  }, [onScan, onClose]);

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen, startScanning]);

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>QRコードをスキャン</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          {error ? (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={startScanning} className={styles.retryButton}>
                再試行
              </button>
            </div>
          ) : (
            <div className={styles.videoContainer}>
              <video
                ref={videoRef}
                className={styles.video}
                autoPlay
                playsInline
                muted
              />
              {isScanning && (
                <div className={styles.scanningIndicator}>
                  <div className={styles.scanLine}></div>
                  <p>QRコードをカメラに向けてください</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button onClick={handleClose} className={styles.cancelButton}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;