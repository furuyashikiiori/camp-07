/* -----------------------------------------
   Exchange List Page (icon-free 版)
   ▶／▼ を文字で出し、CSS でレイアウト
------------------------------------------*/
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { getUser, authenticatedFetch } from '@/utils/auth';

type Contact = {
  id: number;
  name: string;
  profileTitle: string;
  exchangeDate: string;
};

export default function ListPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [openYear, setOpenYear] = useState<Record<string, boolean>>({});
  const [openDate, setOpenDate] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConnections = async () => {
      const user = getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const response = await authenticatedFetch(`http://localhost:8080/api/users/${user.id}/connections`);
        if (!response.ok) {
          throw new Error('交換済みユーザーの取得に失敗しました');
        }
        
        const data = await response.json();
        const connections = data.connections || [];
        
        // APIレスポンスをContact型に変換
        const contactList: Contact[] = connections.map((conn: any) => ({
          id: conn.connected_profile_id,
          name: conn.connected_user_name,
          profileTitle: conn.connected_profile_title,
          exchangeDate: conn.connected_at.split('T')[0], // 日付部分のみ抽出
        }));
        
        setContacts(contactList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [router]);

  /* 年 → 日付 → Contact[] にまとめる */
  const grouped = contacts.reduce<Record<string, Record<string, Contact[]>>>(
    (acc, c) => {
      const year = new Date(c.exchangeDate).getFullYear().toString();
      const md = c.exchangeDate.slice(5);
      acc[year] ??= {};
      acc[year][md] ??= [];
      acc[year][md].push(c);
      return acc;
    },
    {},
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          &lt; Back StartPage
        </Link>
        <div className={styles.overlay}>
          <h1 className={styles.title}>Exchange List</h1>
          <p className={styles.message}>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          &lt; Back StartPage
        </Link>
        <div className={styles.overlay}>
          <h1 className={styles.title}>Exchange List</h1>
          <p className={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        &lt; Back StartPage
      </Link>
      <div className={styles.overlay}>
        <h1 className={styles.title}>Exchange List</h1>

        {contacts.length === 0 && (
          <p className={styles.message}>誰かとQRコードを交換してください</p>
        )}

        {/* ─ 年 → 日付 → 名前 ─ */}
        {Object.keys(grouped).sort().reverse().map(year => (
          <section key={year} className={styles.section}>
            {/* 年トグル */}
            <button
              className={styles.yearToggle}
              onClick={() => setOpenYear(o => ({ ...o, [year]: !o[year] }))}
            >
              <span>{year}</span>
              <span className={styles.arrow}>
                {openYear[year] ? '▼' : '▶'}
              </span>
            </button>

            {openYear[year] &&
              Object.keys(grouped[year]).sort().reverse().map(md => {
                const key = `${year}-${md}`;
                return (
                  <div key={md}>
                    {/* 月日トグル */}
                    <button
                      className={styles.dateToggle}
                      onClick={() => setOpenDate(d => ({ ...d, [key]: !d[key] }))}
                    >
                      <span>{md.replace('-', '.')}</span>
                      <span className={styles.arrowSmall}>
                        {openDate[key] ? '▼' : '▶'}
                      </span>
                    </button>

                    {/* 名前とプロフィールタイトルリスト */}
                    {openDate[key] &&
                      grouped[year][md].map(p => (
                        <Link
                          key={p.id}
                          href={`/profile/${p.id}`}
                          className={styles.nameLink}
                        >
                          <div className={styles.contactInfo}>
                            <span className={styles.userName}>{p.name}</span>
                            <span className={styles.profileTitle}>{p.profileTitle}</span>
                          </div>
                        </Link>
                      ))}
                  </div>
                );
              })}
          </section>
        ))}
      </div>
    </div>
  );
}