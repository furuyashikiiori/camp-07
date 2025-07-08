'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link';
import { getUser, User, authenticatedFetch, getToken } from '../../utils/auth';

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
    const token = getToken();

    console.log('User:', user);
    console.log('Token:', token ? 'Present' : 'Missing');

    if (!user) {
      // ログインしていない場合はログインページにリダイレクト
      console.log('No user found, redirecting to login');
      router.push('/login');
      return;
    }

    setCurrentUser(user);

    // トークンがない場合の処理
    if (!token) {
      console.error('No authentication token found, showing test data');
      // テストデータを設定
      const testProfiles: Profile[] = [
        {
          id: 1,
          user_id: user.id,
          display_name: user.name,
          title: 'ビジネス用プロフィール(no token)',
          description: 'トークンがない場合のテストデータです。',
          aka: 'エンジニア',
          hometown: '東京',
          hobby: 'プログラミング',
          comment: 'よろしくお願いします。'
        }
      ];
      setProfiles(testProfiles);
      setLoading(false);
      return;
    }

    const fetchProfiles = async () => {
      try {
        console.log('Fetching profiles for user ID:', user.id);
        const response = await authenticatedFetch(`http://localhost:8080/api/users/${user.id}/profiles`);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);

          // バックエンドが起動していない場合のテストデータ
          console.warn('Backend not available, using test data');
          const testProfiles: Profile[] = [
            {
              id: 1,
              user_id: user.id,
              display_name: user.name,
              title: 'ビジネス用プロフィール(test)',
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
              title: '趣味用プロフィール(test)',
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
        console.log('Received data:', data);
        setProfiles(data.profiles || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('プロフィールの取得に失敗しました。');
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
