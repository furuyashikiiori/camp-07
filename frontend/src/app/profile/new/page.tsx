'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

export default function NewProfilePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: プロフィール作成のロジックを実装
    console.log('新しいプロフィール:', { name, description });
    router.push('/mypage');
  };

  return (
    <div className={styles.container}>
      <Link href="/mypage" className={styles.backLink}>
        &lt; Back MyPage
      </Link>
      <div className={styles.overlay}>
        <h1 className={styles.title}>New Profile</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label}>
              プロフィール名
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="description" className={styles.label}>
              説明
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              rows={4}
              required
            />
          </div>
          
          <button type="submit" className={styles.submitButton}>
            作成
          </button>
        </form>
      </div>
    </div>
  );
}