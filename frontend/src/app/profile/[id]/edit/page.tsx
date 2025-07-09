'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link';
import { authenticatedFetch } from '@/utils/auth';

type Profile = {
  id: number;
  user_id: number;
  display_name: string;
  icon_url?: string;
  aka?: string;
  hometown?: string;
  birthdate?: string;
  hobby?: string;
  comment?: string;
  title?: string;
  description?: string;
};

export default function ProfileEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    aka: '',
    hometown: '',
    birthdate: '',
    hobby: '',
    comment: '',
    title: '',
    description: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authenticatedFetch(`/api/profiles/${params.id}`);
        if (!response.ok) {
          throw new Error('プロフィールの取得に失敗しました');
        }
        const profileData = await response.json();
        setProfile(profileData);
        
        // フォームデータを設定
        setFormData({
          display_name: profileData.display_name || '',
          aka: profileData.aka || '',
          hometown: profileData.hometown || '',
          birthdate: profileData.birthdate ? profileData.birthdate.split('T')[0] : '',
          hobby: profileData.hobby || '',
          comment: profileData.comment || '',
          title: profileData.title || '',
          description: profileData.description || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await authenticatedFetch(`/api/profiles/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('プロフィールの更新に失敗しました');
      }

      alert('プロフィールを更新しました！');
      router.push(`/profile/${params.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新中にエラーが発生しました');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.overlay}>
          <p className={styles.message}>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.overlay}>
          <p className={styles.message}>{error || 'プロフィールが見つかりませんでした。'}</p>
          <button className={styles.backButton} onClick={() => router.back()}>
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href={`/profile/${params.id}`} className={styles.backLink}>
        &lt; Back Profile
      </Link>

      <div className={styles.overlay}>
        <h1 className={styles.title}>プロフィール編集</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            表示名：
            <input
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            タイトル：
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
            />
          </label>

          <label>
            肩書き：
            <input
              type="text"
              name="aka"
              value={formData.aka}
              onChange={handleChange}
            />
          </label>

          <label>
            出身地：
            <input
              type="text"
              name="hometown"
              value={formData.hometown}
              onChange={handleChange}
            />
          </label>

          <label>
            誕生日：
            <input
              type="date"
              name="birthdate"
              value={formData.birthdate}
              onChange={handleChange}
            />
          </label>

          <label>
            趣味：
            <input
              type="text"
              name="hobby"
              value={formData.hobby}
              onChange={handleChange}
            />
          </label>

          <label>
            コメント：
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              rows={3}
            />
          </label>

          <label>
            説明：
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
            />
          </label>

          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.submitButton}>
              更新する
            </button>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={() => router.push(`/profile/${params.id}`)}
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}