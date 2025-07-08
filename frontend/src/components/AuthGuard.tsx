'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUser, getToken } from '@/utils/auth';

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
    const token = getToken();
    const isPublic = publicPaths.includes(pathname);

    console.log('AuthGuard - Path:', pathname);
    console.log('AuthGuard - User:', user);
    console.log('AuthGuard - Token:', token ? 'Present' : 'Missing');
    console.log('AuthGuard - IsPublic:', isPublic);

    if (!user && !isPublic) {
      console.log('AuthGuard - No user, redirecting to auth');
      router.replace('/auth');
    } else if (user && isPublic) {
      console.log('AuthGuard - User exists on public page, redirecting to home');
      router.replace('/');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
