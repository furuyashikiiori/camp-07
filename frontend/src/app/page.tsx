'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaListUl, FaIdBadge, FaCamera } from 'react-icons/fa';
//import Header from '@/components/Header';
//import Footer from '@/components/Footer';
import styles from './page.module.css';

export default function HomePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch((e) => {
        console.error('再生に失敗しました:', e);
      });

      // 5秒後にボタン表示を開始
      const timeout = setTimeout(() => {
        setShowButtons(true);
      }, 2500);

      return () => clearTimeout(timeout);
    }
  }, []);

    const handleBackgroundClick = () => {
    const video = videoRef.current;
    if (video && !video.ended) {
      video.currentTime = video.duration - 0.1; 
      setShowButtons(true);
    }
  };

  return (
    <div className={styles.container}>
{/* <Header /> */}

      <main className={styles.main}>

        <div 
          className={styles.backgroundClickArea}
          onClick={handleBackgroundClick}
        />

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={styles.videoBackground}
          onEnded={(e) => {
            e.currentTarget.pause();
          }}
        >
          <source
            src="/QRsonaMobile.mp4"
            type="video/mp4"
            media="(max-width: 768px)"
          />
          <source
            src="/QRsonaPC.mp4"
            type="video/mp4"
            media="(min-width: 769px)"
          />
          Your browser does not support the video tag.
        </video>

        <div className={styles.overlay}>
          <div
            className={`${styles.buttonRow} ${
              showButtons ? styles.fadeIn : styles.hidden
            }`}
          >
            <button
              className={styles.circleButton}
              onClick={() => router.push('/friends')}
            >
              <FaListUl size={30} />
            </button>
            <button
              className={styles.circleButton}
              onClick={() => router.push('/mypage')}
            >
              <FaIdBadge size={30} />
            </button>
            <button
              className={styles.circleButton}
              onClick={() => router.push('/qrpage')}
            >
              <FaCamera size={30} />
            </button>
          </div>
        </div>
      </main>

      { /* <Footer /> */}
    </div>
  );
}
