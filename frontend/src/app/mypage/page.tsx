'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link';
import { getUser, User } from '../../utils/auth';

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // ログイン中のユーザー情報を取得
    const user = getUser();
    if (!user) {
      // ログインしていない場合はログインページにリダイレクト
      router.push('/login');
      return;
    }
    setCurrentUser(user);

    const fetchProfiles = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/users/${user.id}/profiles`);
        if (!response.ok) {
          // バックエンドが起動していない場合のテストデータ
          console.warn('Backend not available, using test data');
          const testProfiles: Profile[] = [
            {
              id: 1,
              user_id: user.id,
              display_name: user.name,
              title: 'ビジネス用プロフィール',
              description: 'ビジネス用のプロフィールです。',
              aka: 'エンジニア',
              hometown: '東京',
              hobby: 'プログラミング',
              comment: 'よろしくお願いします。'
            },
            {
              id: 2,
              user_id: user.id,
              display_name: user.name,
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
  }, [router]);

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        &lt; Back StartPage
      </Link>
      <div className={styles.overlay}>
        <h1 className={styles.title}>
          {currentUser ? `${currentUser.name}のプロフィール` : 'MyProfile Page'}
        </h1>

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
                <p className={styles.cardDescription}>{profile.description || 'プロフィールの説明がありません'}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
