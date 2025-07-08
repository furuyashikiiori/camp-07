'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaListUl, FaIdBadge, FaCamera } from 'react-icons/fa';
import LogoutButton from '@/components/LogoutButton';
import { getUser, getToken } from '@/utils/auth';
import styles from './page.module.css';

/*──────────────────────────────────────
  Home Page
──────────────────────────────────────*/
export default function HomePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showButtons, setShowButtons] = useState(false);

  /* 認証状態チェック */
  useEffect(() => {
    const user = getUser();
    const token = getToken();

    console.log('HomePage - User:', user);
    console.log('HomePage - Token:', token ? 'Present' : 'Missing');

    if (!user) {
      console.log('No user found, redirecting to auth');
      router.push('/auth');
      return;
    }
  }, [router]);

  /* 背景動画の再生 & ボタン表示タイミング */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.play().catch((e) => console.error('再生に失敗しました:', e));

    const timeout = setTimeout(() => setShowButtons(true), 5000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={styles.container}>
      {/* ★ 右上にログアウトボタン */}
      <div style={{ position: 'absolute', top: 30, right: 30, zIndex: 20 }}>
        <LogoutButton />
      </div>

      <main className={styles.main}>
        {/* ─ 背景動画 ─ */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={styles.videoBackground}
          onEnded={(e) => e.currentTarget.pause()}
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

        {/* ─ オーバーレイ（遅延フェードインの 3 ボタン） ─ */}
        <div className={styles.overlay}>
          <div
            className={`${styles.buttonRow} ${showButtons ? styles.fadeIn : styles.hidden
              }`}
          >
            <button
              className={styles.circleButton}
              onClick={() => router.push('/listpage')}
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
    </div>
  );
}
