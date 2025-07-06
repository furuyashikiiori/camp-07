'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

type Profile = {
  id: number;
  name: string;
  description: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const dummyProfiles: Profile[] = [
      {
        id: 1,
        name: 'ビジネス用',
        description: '仕事用のプロフィールです。',
      },
      {
        id: 2,
        name: '趣味用',
        description: '趣味・SNS用プロフィールです。',
      },
    ];
    setProfiles(dummyProfiles);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.overlay}>
        <h1 className={styles.title}>MyProfile Page</h1>

        <button
          className={styles.newProfileButton}
          onClick={() => router.push('/profile/new')}
        >
          NewProfile ＋
        </button>

        <div className={styles.profileList}>
          {profiles.length === 0 ? (
            <p className={styles.message}>プロフィールがまだありません。</p>
          ) : (
            profiles.map((profile) => (
              <div key={profile.id} className={styles.profileCard}>
                <h2 className={styles.cardTitle}>{profile.name}</h2>
                <p className={styles.cardDescription}>{profile.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
