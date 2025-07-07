/* -------------------------------------------------
   プロフィール詳細（フロント専用ダミー版）
   /profile/[id] にアクセスすると下記ダミーを表示
--------------------------------------------------*/
'use client';

import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import Link from 'next/link';

/* 型定義（new ページに合わせる） */
type Profile = {
  id: number;
  name: string;
  title?: string;
  bio?: string;
  birthday?: string;     // ISO 例: 2000-04-01
  birthplace?: string;
  hobby?: string;
  sns?: string;          // URL or @handle
  optionalFields?: { label: string; value: string }[];
};

/* ───── ダミーデータ ───── */
const dummyProfiles: Profile[] = [
  {
    id: 1,
    name: '青メッシュ',
    title: 'Frontend Engineer',
    bio: 'デザインが大好き!',
    birthday: '2004-04-07',
    birthplace: '山口県',
    hobby: 'ホッケー',
    sns: '@blue_mesh',
    optionalFields: [
      { label: '好きな言語', value: 'React, css' },
      { label: '資格', value: '応用秦野技術者試験' },
    ],
  },
  {
    id: 2,
    name: 'Ori',
    title: 'Backend / Infra',
    bio: 'Go と Kubernetes が主食。',
    birthday: '2004-10-14',
    birthplace: '長野県',
    hobby: 'ゲーム',
    sns: '@ori_dev',
    optionalFields: [
      { label: '好きな DB', value: 'PostgreSQL' },
    ],
  },
  {
    id: 3,
    name: 'あべゆー',
    title: '学生エンジニア',
    bio: '大学で情報工学を専攻中。',
    birthplace: '秦野県',
    hobby: 'カラオケ',
    sns: '@Aby__1202',
  },
  {
    id: 4,
    name: 'たちょ',
    bio: 'ミセスグリーンアップルが大好物です',
    hobby: 'ライブ',
    sns: '@tacyo',
  },
];

/* ───── コンポーネント ───── */
export default function ProfileDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const profile = dummyProfiles.find((p) => p.id === Number(params.id));

  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.overlay}>
          <p className={styles.message}>プロフィールが見つかりませんでした。</p>
          <button className={styles.backButton} onClick={() => router.back()}>
            戻る
          </button>
        </div>
      </div>
    );
  }

  /* 誕生日の整形 (任意) */
  const birthdayJP =
    profile.birthday &&
    new Date(profile.birthday).toLocaleDateString('ja-JP', {
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
        <h1 className={styles.title}>{profile.name}</h1>
        {profile.title && <p className={styles.subtitle}>{profile.title}</p>}

        <div className={styles.section}>
          {profile.bio && (
            <div className={styles.row}>
              <span className={styles.label}>Bio</span>
              <span className={styles.value}>{profile.bio}</span>
            </div>
          )}

          {birthdayJP && (
            <div className={styles.row}>
              <span className={styles.label}>誕生日</span>
              <span className={styles.value}>{birthdayJP}</span>
            </div>
          )}

          {profile.birthplace && (
            <div className={styles.row}>
              <span className={styles.label}>出身地</span>
              <span className={styles.value}>{profile.birthplace}</span>
            </div>
          )}

          {profile.hobby && (
            <div className={styles.row}>
              <span className={styles.label}>趣味</span>
              <span className={styles.value}>{profile.hobby}</span>
            </div>
          )}

          {profile.sns && (
            <div className={styles.row}>
              <span className={styles.label}>SNS</span>
              <span className={styles.value}>
                <a
                  href={
                    profile.sns.startsWith('@')
                      ? `https://twitter.com/${profile.sns.slice(1)}`
                      : profile.sns
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {profile.sns}
                </a>
              </span>
            </div>
          )}

          {/* 任意項目 */}
          {profile.optionalFields?.map(
            (field, idx) =>
              field.label &&
              field.value && (
                <div className={styles.row} key={idx}>
                  <span className={styles.label}>{field.label}</span>
                  <span className={styles.value}>{field.value}</span>
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
