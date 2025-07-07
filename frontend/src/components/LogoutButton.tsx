'use client';

import { clearUser } from '@/utils/auth';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    clearUser();        // localStorage から user を削除
    router.replace('/auth'); // 認証ガードが働くので /auth に遷移
  };

  return (
    <button onClick={handleLogout} style={styles.btn}>
      ログアウト
    </button>
  );
}

/* シンプルなインラインスタイル。必要に応じて CSS に移してOK */
const styles: Record<string, React.CSSProperties> = {
  btn: {
    backgroundColor: '#77a0ed',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
};
