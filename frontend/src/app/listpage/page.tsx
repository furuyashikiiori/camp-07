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
  eventName?: string;
  eventDate?: string;
  memo?: string;
};

export default function ListPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [openYear, setOpenYear] = useState<Record<string, boolean>>({});
  const [openDate, setOpenDate] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // タブ切り替え用の状態: 'date'=日付順, 'following'=フォロー中
  // LocalStorageから前回の選択状態を復元
  const [activeTab, setActiveTab] = useState<'date' | 'following'>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('listPageTab');
      return (savedTab === 'following' ? 'following' : 'date');
    }
    return 'date';
  });

  useEffect(() => {
    const fetchConnections = async () => {
      const user = getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const response = await authenticatedFetch(`/api/users/${user.id}/connections`);
        if (!response.ok) {
          throw new Error('交換済みユーザーの取得に失敗しました');
        }
        
        const data = await response.json();
        const connections = data.connections || [];
        
        // APIレスポンスをContact型に変換
        const contactList: Contact[] = connections.map((conn: {
          connected_profile_id: number;
          connected_user_name: string;
          connected_profile_title: string;
          connected_at: string;
          event_name?: string;
          event_date?: string;
          memo?: string;
        }) => ({
          id: conn.connected_profile_id,
          name: conn.connected_user_name,
          profileTitle: conn.connected_profile_title,
          exchangeDate: conn.connected_at.split('T')[0], // 日付部分のみ抽出
          eventName: conn.event_name || '',
          eventDate: conn.event_date || '',
          memo: conn.memo || '',
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

        {/* タブ切り替えUI */}
        <div className={styles.tabContainer}>
          <div className={styles.tabButtons}>
            <button 
              className={`${styles.tab} ${activeTab === 'date' ? styles.tabActive : ''}`}
              onClick={() => {
                setActiveTab('date');
                if (typeof window !== 'undefined') {
                  localStorage.setItem('listPageTab', 'date');
                }
              }}
            >
              日付順
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'following' ? styles.tabActive : ''}`}
              onClick={() => {
                setActiveTab('following');
                if (typeof window !== 'undefined') {
                  localStorage.setItem('listPageTab', 'following');
                }
              }}
            >
              フォロー中
            </button>
          </div>
        </div>

        {contacts.length === 0 && (
          <p className={styles.message}>誰かとQRコードを交換してください</p>
        )}

        {activeTab === 'date' && contacts.length > 0 && (
          <>
            {/* 日付順タブのコンテンツ - 年 → 日付 → 名前 */}
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
                          onClick={() => sessionStorage.setItem('referrer', 'listpage')}
                        >
                          <div className={styles.contactInfo}>
                            <span className={styles.userName}>{p.name}</span>
                            <span className={styles.profileTitle}>{p.profileTitle}</span>
                            
                            {/* イベント情報があれば表示 */}
                            {(p.eventName || p.eventDate || p.memo) && (
                              <div className={styles.eventInfo}>
                                {p.eventName && (
                                  <div className={styles.eventDetail}>
                                    <span className={styles.eventIcon}>📌</span>
                                    <span>{p.eventName}</span>
                                  </div>
                                )}
                                {p.eventDate && (
                                  <div className={styles.eventDetail}>
                                    <span className={styles.eventIcon}>📅</span>
                                    <span>{p.eventDate}</span>
                                  </div>
                                )}
                                {p.memo && (
                                  <div className={styles.memo}>
                                    {p.memo}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                  </div>
                );
              })}
          </section>
        ))}
          </>
        )}

        {/* フォロー中タブのコンテンツ */}
        {activeTab === 'following' && contacts.length > 0 && (
          <div className={styles.followingList}>
            {contacts
              .sort((a, b) => new Date(b.exchangeDate).getTime() - new Date(a.exchangeDate).getTime())
              .map(contact => (
                <Link 
                  key={contact.id}
                  href={`/profile/${contact.id}`}
                  className={styles.followingItem}
                  onClick={() => sessionStorage.setItem('referrer', 'listpage')}
                >
                  <div>
                    <div className={styles.followingName}>{contact.name}</div>
                    <div className={styles.followingProfile}>{contact.profileTitle}</div>
                  </div>
                </Link>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}