'use client';

import { useRouter } from 'next/navigation';
// import Header from '@/components/Header';
// import Footer from '@/components/Footer';
import styles from './list.module.css';

export default function ListPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      {/* <Header /> */}
      
      <main className={styles.main}>
        <h1 className={styles.title}>リストページ</h1>
        <p className={styles.description}>ここにリスト機能を実装します</p>
        
        <button 
          className={styles.backButton}
          onClick={() => router.push('/')}
        >
          ホームに戻る
        </button>
      </main>
      
      {/* <Footer /> */}
    </div>
  );
}
