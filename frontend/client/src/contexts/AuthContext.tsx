import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { mockUsers, type User } from '@/lib/mock-data';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('logistics_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      // 尝试调用后端 API
      const result = await authApi.login(username, password);
      const userData: User & { token?: string } = {
        id: result.id,
        username: result.username,
        fullName: result.fullName,
        role: result.role as User['role'],
        orgId: result.orgId,
        orgName: result.orgName,
        token: result.token,
      };
      setUser(userData);
      localStorage.setItem('logistics_user', JSON.stringify(userData));
      return true;
    } catch {
      // 后端不可用时降级到 mock 数据
      console.warn('API不可用，使用mock数据登录');
      const found = mockUsers.find(u => u.username === username);
      if (found) {
        setUser(found);
        localStorage.setItem('logistics_user', JSON.stringify(found));
        return true;
      }
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('logistics_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
