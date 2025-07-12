export type User = {
  id: number;
  name: string;
  email: string;
};

import { getApiBaseUrl } from './config';

const USER_KEY = 'user';
const TOKEN_KEY = 'token';

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
};

export const setUser = (user: User) => {
  if (typeof window !== 'undefined') localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearUser = () => {
  if (typeof window !== 'undefined') localStorage.removeItem(USER_KEY);
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
};

export const logout = () => {
  clearUser();
  clearToken();
};

// 認証されたAPIリクエストを行うためのヘルパー関数
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  if (!token) {
    console.error('No authentication token found');
    throw new Error('No authentication token found');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  console.log('Making authenticated request to:', url);
  console.log('With token:', token ? 'Present' : 'Missing');
  
  // 相対パスの場合、バックエンドのベースURLを追加
  const apiUrl = url.startsWith('/api') 
    ? `${getApiBaseUrl()}${url}` 
    : url;
    
  console.log('Final API URL:', apiUrl);
    
  return fetch(apiUrl, {
    ...options,
    headers,
  });
};
