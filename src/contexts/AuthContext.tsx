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
import {
  buildDemoUser,
  clearDemoSession,
  loadDemoSession,
  saveDemoSession,
} from '@/lib/auth/demo-auth';
import {
  isPhoneSessionCacheEnabled,
  savePhoneSession,
} from '@/lib/auth/phone-session-cache';
import {
  clearStoredTokens,
  fetchCoupons,
  fetchCurrentUser,
  fetchLoyaltyBalance,
  getStoredTokens,
  logoutSession,
  mapApiCouponToUi,
  mapProfileToUser,
  storeTokens,
  type ApiTokenPair,
} from '@/lib/api/loyalty';

const STORAGE_KEY = 'ce_auth';

interface AuthState {
  user: User | null;
  coupons: Coupon[];
  isLoading: boolean;
  isNewUser: boolean;
  isDemo: boolean;
}

interface AuthContextValue extends AuthState {
  loginWithTokens: (tokens: ApiTokenPair, countryId: string, phone?: string) => Promise<User>;
  loginDemo: (countryId: string) => User;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  refreshCoupons: () => Promise<void>;
  purchaseDemoCoupon: (coupon: Coupon, beansSpent?: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    coupons: [],
    isLoading: true,
    isNewUser: false,
    isDemo: false,
  });

  const loadFromApi = useCallback(async (countryId: string) => {
    const [profile, balance, couponsPage] = await Promise.all([
      fetchCurrentUser(),
      fetchLoyaltyBalance(),
      fetchCoupons({ limit: 100 }),
    ]);
    const user = mapProfileToUser(profile, balance.balance, countryId);
    const coupons = couponsPage.items.map((c) => mapApiCouponToUi(c));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
    setState((prev) => ({ ...prev, user, coupons, isDemo: false }));
    return user;
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const demo = loadDemoSession();
        if (demo) {
          setState({
            user: demo.user,
            coupons: demo.coupons,
            isLoading: false,
            isNewUser: false,
            isDemo: true,
          });
          return;
        }

        if (!getStoredTokens()) {
          setState({
            user: null,
            coupons: [],
            isLoading: false,
            isNewUser: false,
            isDemo: false,
          });
          return;
        }
        const stored = localStorage.getItem(STORAGE_KEY);
        const fallbackCountry = stored
          ? (JSON.parse(stored) as User).countryId
          : 'RU';
        await loadFromApi(fallbackCountry);
        setState((prev) => ({ ...prev, isLoading: false }));
      } catch {
        clearStoredTokens();
        clearDemoSession();
        setState({
          user: null,
          coupons: [],
          isLoading: false,
          isNewUser: false,
          isDemo: false,
        });
      }
    }
    void init();
  }, [loadFromApi]);

  const loginWithTokens = useCallback(
    async (tokens: ApiTokenPair, countryId: string, phone?: string) => {
      clearDemoSession();
      storeTokens(tokens);
      setState((prev) => ({ ...prev, isNewUser: tokens.is_new, isDemo: false }));
      const user = await loadFromApi(countryId);
      if (isPhoneSessionCacheEnabled() && phone) {
        savePhoneSession(phone, tokens);
      }
      return user;
    },
    [loadFromApi],
  );

  const loginDemo = useCallback((countryId: string) => {
    clearStoredTokens();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const user = buildDemoUser(countryId);
    const session = { user, coupons: [] as Coupon[] };
    saveDemoSession(session);
    setState({
      user,
      coupons: [],
      isLoading: false,
      isNewUser: false,
      isDemo: true,
    });
    return user;
  }, []);

  const purchaseDemoCoupon = useCallback((coupon: Coupon, beansSpent?: number) => {
    setState((prev) => {
      if (!prev.user || !prev.isDemo) return prev;
      const user =
        beansSpent != null
          ? {
              ...prev.user,
              loyaltyPoints: Math.max(0, prev.user.loyaltyPoints - beansSpent),
            }
          : prev.user;
      const coupons = [coupon, ...prev.coupons];
      saveDemoSession({ user, coupons });
      return { ...prev, user, coupons };
    });
  }, []);

  const logout = useCallback(async () => {
    if (state.isDemo || loadDemoSession()) {
      clearDemoSession();
    } else {
      const tokens = getStoredTokens();
      if (tokens?.refresh_token) {
        try {
          await logoutSession(tokens.refresh_token);
        } catch {
          clearStoredTokens();
        }
      } else {
        clearStoredTokens();
      }
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setState({
      user: null,
      coupons: [],
      isLoading: false,
      isNewUser: false,
      isDemo: false,
    });
  }, [state.isDemo]);

  const refreshUserData = useCallback(async () => {
    if (state.isDemo) {
      const demo = loadDemoSession();
      if (demo) {
        setState((prev) => ({ ...prev, user: demo.user, coupons: demo.coupons }));
      }
      return;
    }
    if (!getStoredTokens()) return;
    const countryId = state.user?.countryId ?? 'RU';
    try {
      await loadFromApi(countryId);
    } catch {
      clearStoredTokens();
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setState({
        user: null,
        coupons: [],
        isLoading: false,
        isNewUser: false,
        isDemo: false,
      });
    }
  }, [loadFromApi, state.isDemo, state.user?.countryId]);

  const refreshCoupons = useCallback(async () => {
    if (state.isDemo) {
      const demo = loadDemoSession();
      if (demo) setState((prev) => ({ ...prev, coupons: demo.coupons }));
      return;
    }
    if (!getStoredTokens()) return;
    try {
      const page = await fetchCoupons({ limit: 100 });
      const coupons = page.items.map((c) => mapApiCouponToUi(c));
      setState((prev) => ({ ...prev, coupons }));
    } catch {
      /* ignore */
    }
  }, [state.isDemo]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginWithTokens,
        loginDemo,
        logout,
        refreshUserData,
        refreshCoupons,
        purchaseDemoCoupon,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
