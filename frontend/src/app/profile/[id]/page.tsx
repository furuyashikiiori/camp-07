/* -------------------------------------------------
   ダミー用プロフィールページ
   id をキーに簡易データを取得して表示するだけ
--------------------------------------------------*/
'use client';

import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

type DummyProfile = {
  id: number;
  name: string;
  twitter: string;
  description: string;
};

/* 仮データ */
const dummyProfiles: DummyProfile[] = [
  { id: 1, name: '青メッシュ', twitter: '@blue_mesh', description: 'フロントエンドエンジニアです。' },
  { id: 2, name: 'Ori',       twitter: '@ori_dev',   description: 'バックエンドとインフラが得意。' },
  { id: 3, name: 'みっくん',   twitter: '@mikkun',    description: '大学で情報工学を専攻中。' },
  { id: 4, name: 'たちょ',     twitter: '@tacyo',     description: '趣味でIoTやってます。' },
];

export default function ProfileDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const profile = dummyProfiles.find(p => p.id === Number(params.id));

  if (!profile) {
    return (
      <div style={{ padding: 40 }}>
        <p>プロフィールが見つかりませんでした。</p>
        <button onClick={() => router.back()}>戻る</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: '0 auto' }}>
      <h1>{profile.name}</h1>
      <p>{profile.description}</p>
      <p>
        Twitter: <a href={`https://twitter.com/${profile.twitter.slice(1)}`} target="_blank">{profile.twitter}</a>
      </p>
      <button onClick={() => router.back()} style={{ marginTop: 20 }}>
        戻る
      </button>
    </div>
  );
}