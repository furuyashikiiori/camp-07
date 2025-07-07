'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link'

type Profile = {
  id: number;
  user_id: number;
  display_name: string;
  icon_path?: string;
  icon_url?: string;
  aka?: string;
  hometown?: string;
  birthdate?: string;
  hobby?: string;
  comment?: string;
  title: string;
  description?: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const userId = 16; //ログイン機能を実装していないため、固定のユーザーIDを使用

        const response = await fetch(`/api/users/${userId}/profiles`);
        if (!response.ok) {
          // バックエンドが起動していない場合のテストデータ
          console.warn('Backend not available, using test data');
          const testProfiles: Profile[] = [
            {
              id: 1,
              user_id: 16,
              display_name: 'Test User',
              title: 'ビジネス用プロフィール',
              description: 'ビジネス用のプロフィールです。',
              aka: 'エンジニア',
              hometown: '東京',
              hobby: 'プログラミング',
              comment: 'よろしくお願いします。'
            },
            {
              id: 2,
              user_id: 16,
              display_name: 'Test User',
              title: '趣味用プロフィール',
              description: '趣味・SNS用のプロフィールです。',
              aka: '写真家',
              hometown: '神奈川',
              hobby: '写真撮影',
              comment: '写真を撮るのが好きです。'
            }
          ];
          setProfiles(testProfiles);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setProfiles(data.profiles || []);
      } catch (err) {
        setError('プロフィールの取得に失敗しました。');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        &lt; Back StartPage
      </Link>
      <div className={styles.overlay}>
        <h1 className={styles.title}>MyProfile Page</h1>

        <button
          className={styles.newProfileButton}
          onClick={() => router.push('/profile/new')}
        >
          NewProfile ＋
        </button>

        <div className={styles.profileList}>
          {loading ? (
            <p className={styles.message}>読み込み中...</p>
          ) : error ? (
            <p className={styles.message}>{error}</p>
          ) : profiles.length === 0 ? (
            <p className={styles.message}>プロフィールがまだありません。</p>
          ) : (
            profiles.map((profile) => (
              <div key={profile.id} className={styles.profileCard}>
                <h2 className={styles.cardTitle}>{profile.title}</h2>
                <p className={styles.cardDescription}>{profile.description || '説明なし'}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
