/* -----------------------------------------
   Exchange List Page (icon-free 版)
   ▶／▼ を文字で出し、CSS でレイアウト
------------------------------------------*/
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

type Contact = {
  id: number;
  name: string;
  exchangeDate: string; 
};

export default function ListPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [openYear, setOpenYear] = useState<Record<string, boolean>>({});
  const [openDate, setOpenDate] = useState<Record<string, boolean>>({});

  /* ===== ここの部分はダミーデータ表示です ===== */
  useEffect(() => {

    const dummyContacts: Contact[] = [
      { id: 1, name: '青メッシュ', exchangeDate: '2025-06-30' },
      { id: 2, name: 'Ori',       exchangeDate: '2025-06-30' },
      { id: 3, name: 'みっくん',   exchangeDate: '2025-06-11' },
      { id: 4, name: 'たちょ',     exchangeDate: '2025-05-09' },
    ];
    setContacts(dummyContacts);
  }, []);

  /* =====ここの部分はダミーデータ表示です====== */

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

                    {/* 名前リスト */}
                    {openDate[key] &&
                      grouped[year][md].map(p => (
                        <Link
                          key={p.id}
                          href={`/profile/${p.id}`}
                          className={styles.nameLink}
                        >
                          {p.name}
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