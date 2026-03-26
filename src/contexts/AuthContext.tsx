'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Coupon, User } from '@/types';
import { MOCK_COUPONS, generateCouponId } from '@/lib/mock-data';

const STORAGE_KEY = 'ce_auth';
const COUPONS_KEY = 'ce_coupons';

interface AuthState {
  user: User | null;
  coupons: Coupon[];
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  addCoupon: (coupon: Omit<Coupon, 'id'>) => Coupon;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USERS: Record<string, User> = {
  default: {
    id: 'user_1',
    name: 'Алексей Козлов',
    phone: '',
    loyaltyLevel: 'Silver',
    loyaltyPoints: 2340,
    countryId: 'RU',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    coupons: [],
    isLoading: true,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedCoupons = localStorage.getItem(COUPONS_KEY);

      const user = stored ? (JSON.parse(stored) as User) : null;
      const coupons = storedCoupons
        ? (JSON.parse(storedCoupons) as Coupon[])
        : MOCK_COUPONS;

      setState({ user, coupons, isLoading: false });
    } catch {
      setState({ user: null, coupons: MOCK_COUPONS, isLoading: false });
    }
  }, []);

  const login = useCallback((user: User) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {}
    setState((prev) => ({ ...prev, user }));
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setState((prev) => ({ ...prev, user: null }));
  }, []);

  const addCoupon = useCallback((couponData: Omit<Coupon, 'id'>): Coupon => {
    const coupon: Coupon = { ...couponData, id: generateCouponId() };
    setState((prev) => {
      const updated = [coupon, ...prev.coupons];
      try {
        localStorage.setItem(COUPONS_KEY, JSON.stringify(updated));
      } catch {}
      return { ...prev, coupons: updated };
    });
    return coupon;
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, addCoupon }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// Helper to build a mock user from phone
export function buildMockUser(phone: string, name: string, countryId: string): User {
  const base = MOCK_USERS['default'];
  return { ...base, phone, name: name || base.name, countryId };
}

/** Готовый демо-аккаунт без SMS — для тестов из любой страны (нет реального бэкенда). */
export function createDemoUser(countryId: string): User {
  const base = MOCK_USERS['default'];
  return {
    ...base,
    id: 'demo_user',
    name: 'Демо-пользователь',
    phone: '+66800001234',
    loyaltyLevel: 'Gold',
    loyaltyPoints: 5000,
    countryId,
  };
}
