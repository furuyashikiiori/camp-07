'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUser } from '@/utils/auth';

/**  
 * 認証ガード  
 * - ログインしていなければ /auth へ  
 * - ログイン済みで /auth|/login|/signup に来たら /mypage へ  
 */
export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // 認証不要ページ
  const publicPaths = ['/auth', '/login', '/signup'];

  useEffect(() => {
    const user = getUser();
    const isPublic = publicPaths.includes(pathname);

    if (!user && !isPublic) {
      router.replace('/auth');
    } else if (user && isPublic) {
      router.replace('/');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
