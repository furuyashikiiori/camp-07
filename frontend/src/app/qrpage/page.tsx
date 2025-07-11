'use client';

import { useState, useEffect } from 'react';
import QRGenerator from "./components/QRGenerator";
import QRScanner from "./components/QRScanner";
import Link from 'next/link';
import styles from "./page.module.css";
import { getUser, authenticatedFetch } from '@/utils/auth';
import { useRouter } from 'next/navigation';

type Profile = {
  id: number;
  user_id: number;
  display_name: string;
  title: string;
  description?: string;
};

export default function QRPage() {
  const router = useRouter();
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [exchangedMessage, setExchangedMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      const user = getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const response = await authenticatedFetch(`/api/users/${user.id}/profiles`);
        if (!response.ok) {
          throw new Error('プロフィールの取得に失敗しました');
        }
        const data = await response.json();
        const fetchedProfiles = data.profiles || [];
        setProfiles(fetchedProfiles);
        
        // 最初のプロフィールをデフォルトで選択
        if (fetchedProfiles.length > 0) {
          setSelectedProfile(fetchedProfiles[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
    
    // URLパラメータから交換成功メッセージを確認
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('exchanged') === 'true') {
      setExchangedMessage('プロフィール交換が完了しました！');
      // URLパラメータを削除
      window.history.replaceState({}, '', '/qrpage');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProfile(Number(e.target.value));
  };

  const handleScanClick = () => {
    setIsScannerOpen(true);
  };

  const handleScanResult = (result: string) => {
    console.log('Scanned QR code:', result);
    // URLの場合は該当ページに遷移
    try {
      const url = new URL(result);
      if (url.origin === window.location.origin) {
        // プロフィールページのURLかチェック
        const profileMatch = url.pathname.match(/^\/profile\/(\d+)$/);
        if (profileMatch) {
          const profileId = profileMatch[1];
          // 交換ページに遷移
          router.push(`/exchange?profileId=${profileId}`);
        } else {
          router.push(url.pathname);
        }
      } else {
        window.open(result, '_blank');
      }
    } catch {
      // URLでない場合はアラートで表示
      alert(`スキャン結果: ${result}`);
    }
  };

  const handleScannerClose = () => {
    setIsScannerOpen(false);
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <Link href="/" className={styles.backLink}>
            ⬅︎ HOME
        </Link>

        <h1 className={styles.title}>QRコードページ</h1>

        {exchangedMessage && (
          <div className={styles.successMessage}>
            {exchangedMessage}
            <button onClick={() => setExchangedMessage(null)} className={styles.closeButton}>
              ×
            </button>
          </div>
        )}

        <div className={styles.card}>
          {loading ? (
            <p>読み込み中...</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : profiles.length === 0 ? (
            <p>プロフィールがありません。</p>
          ) : (
            <>
              <label htmlFor="profileSelect" className={styles.selectLabel}>
                表示するプロフィールを選択：
              </label>
              <select
                id="profileSelect"
                value={selectedProfile || ''}
                onChange={handleChange}
                className={styles.select}
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.title} - {profile.display_name}
                  </option>
                ))}
              </select>

              {selectedProfile && <QRGenerator profileId={selectedProfile} />}

              <p className={styles.paragraph}>選択中のプロフィールID: {selectedProfile}</p>
            </>
          )}

          <button className={styles.scanButton} onClick={handleScanClick}>
            QRコードを読み取る
          </button>
        </div>
      </main>

      <QRScanner
        isOpen={isScannerOpen}
        onClose={handleScannerClose}
        onScan={handleScanResult}
      />
    </div>
  );
}
