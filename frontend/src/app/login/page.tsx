'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setUser, setToken } from '@/utils/auth';
import { getApiBaseUrl } from '@/utils/config';
import styles from './page.module.css';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('ログインに失敗しました');

      const data = await res.json();
      console.log('Login response:', data);
      setUser(data.user);
      if (data.token) {
        setToken(data.token);
        console.log('Token saved successfully');
      }
      router.replace('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/auth" className={styles.backLink}>
        &lt; Back Page
      </Link>

      <div className={styles.overlay}>
        <h1 className={styles.title}>LoginPage</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            メールアドレス
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </label>

          <label>
            パスワード
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitButton}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
