'use client';

import QRGenerator from "./components/QRGenerator";
import Link from 'next/link';
import styles from "./page.module.css";

export default function QRPage() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <Link href="/" className={styles.backLink}>
          &lt; Back StartPage
        </Link>

        <h1 className={styles.title}>QRコードページ</h1>

        <div className={styles.card}>
          <QRGenerator />
          <p className={styles.paragraph}>このQRコードをスキャンして、特定の情報にアクセスできます。</p>
          <p className={styles.paragraph}>localhost:3000/mypagenoのURLをQRコードにして表示してる状態</p>
        </div>
      </main>
    </div>
  );
}
