'use client';

import Link from 'next/link';
import styles from './page.module.css';

export default function AuthChoice() {
  return (
    <div className={styles.container}>
      <div className={styles.overlay}>
        <h1 className={styles.title}>Welcome</h1>
        <p className={styles.text}>まずはアカウントを用意しましょう</p>

        <div className={styles.buttons}>
          <Link href="/login" className={styles.btn}>
            ログイン
          </Link>
          <Link href="/signup" className={styles.btnOutline}>
            サインアップ
          </Link>
        </div>
      </div>
    </div>
  );
}
