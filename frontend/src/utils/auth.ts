export type User = {
  id: number;
  name: string;
  email: string;
};

const KEY = 'user';

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as User) : null;
};

export const setUser = (user: User) => {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(user));
};

export const clearUser = () => {
  if (typeof window !== 'undefined') localStorage.removeItem(KEY);
};
