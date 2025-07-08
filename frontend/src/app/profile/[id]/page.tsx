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
  option_profiles?: { label: string; value: string }[];
};

type OptionProfile = {
  id: number;
  title: string;
  content: string;
  profile_id: number;
};

export default function ProfileDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [optionProfiles, setOptionProfiles] = useState<OptionProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileResponse, optionResponse] = await Promise.all([
          authenticatedFetch(`/api/profiles/${params.id}`),
          authenticatedFetch(`/api/profiles/${params.id}/option-profiles`)
        ]);

        if (!profileResponse.ok) {
          throw new Error('プロフィールの取得に失敗しました');
        }
        const profileData = await profileResponse.json();
        setProfile(profileData);

        if (optionResponse.ok) {
          const optionData = await optionResponse.json();
          console.log('Option profiles data:', optionData);
          setOptionProfiles(optionData.option_profiles || []);
        } else {
          console.log('Option profiles response error:', optionResponse.status);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

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

  const birthdayJP =
    profile.birthdate &&
    new Date(profile.birthdate).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        &lt; Back StartPage
      </Link>

      <div className={styles.overlay}>
        <h1 className={styles.title}>{profile.display_name}</h1>
        {profile.title && <p className={styles.subtitle}>{profile.title}</p>}

        <div className={styles.section}>
          {profile.aka && (
            <div className={styles.row}>
              <span className={styles.label}>肩書き</span>
              <span className={styles.value}>{profile.aka}</span>
            </div>
          )}

          {profile.comment && (
            <div className={styles.row}>
              <span className={styles.label}>コメント</span>
              <span className={styles.value}>{profile.comment}</span>
            </div>
          )}

          {profile.description && (
            <div className={styles.row}>
              <span className={styles.label}>説明</span>
              <span className={styles.value}>{profile.description}</span>
            </div>
          )}

          {birthdayJP && (
            <div className={styles.row}>
              <span className={styles.label}>誕生日</span>
              <span className={styles.value}>{birthdayJP}</span>
            </div>
          )}

          {profile.hometown && (
            <div className={styles.row}>
              <span className={styles.label}>出身地</span>
              <span className={styles.value}>{profile.hometown}</span>
            </div>
          )}

          {profile.hobby && (
            <div className={styles.row}>
              <span className={styles.label}>趣味</span>
              <span className={styles.value}>{profile.hobby}</span>
            </div>
          )}

          {optionProfiles.map(
            (optionProfile, idx) => (
              <div className={styles.row} key={idx}>
                <span className={styles.label}>{optionProfile.title}</span>
                <span className={styles.value}>{optionProfile.content}</span>
              </div>
            ),
          )}
        </div>

        <button className={styles.backButton} onClick={() => router.back()}>
          戻る
        </button>
      </div>
    </div>
  );
}
