'use client';

// ============================================================================
// Authenticated access context (Supabase OAuth for non-students; legacy student flow)
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserPersona, School, AcademicYear } from '@/lib/types';
import { INITIAL_SCHOOLS, INITIAL_ACADEMIC_YEARS } from '@/lib/services/mock-data';
import { schoolService, academicYearService, authService, storageService, pinSecurityService, passkeyService, STORAGE_KEYS } from '@/lib/services/api';
import { createClient } from '@/lib/supabase/client';
import { resolveUserPhoto, resolveUserName } from '@/lib/utils/avatar';

interface AuthContextType {
  currentUser: UserPersona | null;
  currentSchool: School | null;
  currentYear: AcademicYear | null;
  academicYears: AcademicYear[];
  setCurrentYear: (year: AcademicYear) => void;
  setCurrentSchool: (school: School) => void;
  loginWithGoogle: () => Promise<{ success: boolean; redirectUrl?: string; error?: string }>;
  loginWithPasskey: () => Promise<{ success: boolean; user?: UserPersona; redirectUrl?: string; error?: string }>;
  loginWithIdentifier: (
    identifier: string,
    pass: string,
    schoolCode?: string
  ) => Promise<{ success: boolean; user?: UserPersona; redirectUrl?: string; error?: string }>;
  loginStudent: (
    schoolCode: string,
    registrationNumber: string,
    pass: string
  ) => Promise<{ success: boolean; user?: UserPersona; redirectUrl?: string; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  accessState: 'SUPER_ADMIN' | 'ACTIVE_SCHOOL_USER' | 'PENDING_ACCESS_REQUEST' | 'NO_SCHOOL_ACCESS' | 'DISABLED' | 'REVOKED' | 'ERROR' | null;
  pendingAccessRequest: any | null;
  refreshAccess: () => Promise<void>;
  isPinUnlocked: boolean;
  verifyPin: (
    pin: string
  ) => Promise<{ success: boolean; error?: string; remainingAttempts?: number; isLocked?: boolean }>;
  lockPinSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'school_erp_active_user';
const PIN_UNLOCKED_PREFIX = 'school_erp_pin_unlocked_';

function clearStoredAuthSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('school_erp_active_user');
    sessionStorage.clear();
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith('sb-') ||
        key.startsWith(PIN_UNLOCKED_PREFIX) ||
        key === 'school_erp_session' ||
        key === 'sb-access-token' ||
        key === 'school_erp_user'
      ) {
        localStorage.removeItem(key);
      }
    });
  } catch {}
  syncAuthSessionCookie(null);
}

export function syncAuthSessionCookie(user: UserPersona | null) {
  if (typeof document === 'undefined') return;
  if (user) {
    const data = encodeURIComponent(
      JSON.stringify({
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        school_id: user.school_id,
        login_id: user.login_id,
        photo_url: user.photo_url,
        student_id: user.student_id,
        teacher_id: user.teacher_id,
        staff_id: user.staff_id,
        parent_id: user.parent_id,
      })
    );
    document.cookie = `school_erp_session=${data}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = 'school_erp_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserPersona | null>(null);
  const [currentSchool, setCurrentSchoolState] = useState<School | null>(null);
  const [currentYear, setCurrentYearState] = useState<AcademicYear | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessState, setAccessState] = useState<AuthContextType['accessState']>(null);
  const [pendingAccessRequest, setPendingAccessRequest] = useState<any | null>(null);
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);

  const setCurrentSchool = useCallback((school: School | null) => {
    setCurrentSchoolState(school);
    if (school && typeof window !== 'undefined') {
      const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
      const idx = schools.findIndex((s) => s.id === school.id);
      if (idx !== -1) {
        schools[idx] = school;
      } else {
        schools.unshift(school);
      }
      storageService.setItem(STORAGE_KEYS.SCHOOLS, schools);
    }
  }, []);

  const applyBackendAccess = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/context', { cache: 'no-store', credentials: 'include' });
      if (response.status === 401) return false;
      const context = await response.json();
      if (!response.ok || context.state === 'ERROR') {
        setAccessState('ERROR');
        return false;
      }
      setAccessState(context.state);
      setPendingAccessRequest(context.request || null);
      let activeSchool = context.school || null;
      if (activeSchool && typeof window !== 'undefined') {
        const storedSchools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
        const cached = storedSchools.find((s) => s.id === activeSchool.id);
        if (cached) {
          activeSchool = {
            ...cached,
            ...activeSchool,
            school_hours: (activeSchool.school_hours && typeof activeSchool.school_hours === 'object' && Object.keys(activeSchool.school_hours).length > 0)
              ? activeSchool.school_hours
              : cached.school_hours,
          };
        }
      }
      setCurrentSchool(activeSchool);

      let personaUser = context.user || (context.profile ? {
        id: context.profile.id,
        name: context.profile.display_name || context.profile.name || 'User',
        email: context.profile.email,
        role: context.profile.role || 'unassigned',
        school_id: context.profile.school_id,
        photo_url: context.profile.photo_url || context.profile.avatar_url,
      } : null);

      if (personaUser && !personaUser.photo_url) {
        const resolved = resolveUserPhoto(personaUser, activeSchool);
        if (resolved) {
          personaUser = { ...personaUser, photo_url: resolved };
        }
      }

      if (personaUser) {
        const resolvedName = resolveUserName(personaUser, activeSchool);
        if (resolvedName && resolvedName !== 'User') {
          personaUser = { ...personaUser, name: resolvedName };
        }
      }

      setCurrentUser(personaUser);
      if (personaUser && typeof window !== 'undefined') {
        storageService.setItem(AUTH_STORAGE_KEY, personaUser);
        syncAuthSessionCookie(personaUser);
      }

      if (activeSchool?.id) {
        try {
          const sessionState = await academicYearService.ensureCurrentYear(activeSchool.id);
          setAcademicYears(sessionState.years);
          setCurrentYearState(sessionState.current);
        } catch {
          setAcademicYears(INITIAL_ACADEMIC_YEARS);
          setCurrentYearState(INITIAL_ACADEMIC_YEARS[0]);
        }
      } else {
        setAcademicYears([]);
        setCurrentYearState(null);
      }
      setIsPinUnlocked(context.state === 'SUPER_ADMIN' || context.state === 'ACTIVE_SCHOOL_USER');
      return true;
    } catch (e) {
      console.warn('applyBackendAccess network or parse error:', e);
      return false;
    }
  }, [setCurrentSchool]);

  const refreshAccess = useCallback(async () => {
    setIsLoading(true);
    try { await applyBackendAccess(); } finally { setIsLoading(false); }
  }, [applyBackendAccess]);

  // Sync saved session from client storage and Supabase Auth
  useEffect(() => {
    const initData = async () => {
      try {
        let activeUser: UserPersona | null = null;

        // Check Supabase Auth session if available
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const isConfigured =
          supabaseUrl &&
          supabaseAnonKey &&
          !supabaseUrl.includes('demo.supabase.co') &&
          !supabaseUrl.includes('your-project-id');

        if (isConfigured && typeof window !== 'undefined') {
          try {
            const supabase = createClient();
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session?.user?.email) {
              const handled = await applyBackendAccess();
              if (handled) return;
            }
          } catch (supaErr) {
            console.warn('Supabase session initialization warning:', supaErr);
          }
        }

        if (typeof window !== 'undefined') {
          const saved = storageService.getItem<UserPersona | null>(AUTH_STORAGE_KEY, null);
          if (saved) {
            activeUser = saved;
          } else {
            try {
              const match = document.cookie.match(/(?:^|;\s*)school_erp_session=([^;]+)/);
              if (match && match[1]) {
                const parsed = JSON.parse(decodeURIComponent(match[1]));
                if (parsed && (parsed.id || parsed.role)) {
                  activeUser = parsed as UserPersona;
                }
              }
            } catch {}
          }
        }

        if (activeUser) {
          const schools = await schoolService.getSchools();
          const activeSchool =
            schools.find((s) => s.id === activeUser?.school_id) || schools[0] || INITIAL_SCHOOLS[0];
          setCurrentSchool(activeSchool);

          if (typeof window !== 'undefined') {
            try {
              if (!activeUser.photo_url) {
                const resolved = resolveUserPhoto(activeUser, activeSchool);
                if (resolved) activeUser = { ...activeUser, photo_url: resolved };
              }
              const resolvedName = resolveUserName(activeUser, activeSchool);
              if (resolvedName && resolvedName !== 'User' && resolvedName !== activeUser.name) {
                activeUser = { ...activeUser, name: resolvedName };
              }
              storageService.setItem(AUTH_STORAGE_KEY, activeUser);
            } catch {}
          }

          setCurrentUser(activeUser);
          setAccessState(activeUser.role === 'super_admin' ? 'SUPER_ADMIN' : 'ACTIVE_SCHOOL_USER');
          syncAuthSessionCookie(activeUser);
          if (activeUser.role === 'super_admin') {
            setIsPinUnlocked(true);
          } else {
            const pinStatus = await pinSecurityService.getUserPinStatus(activeUser);
            if (!pinStatus.hasPin) {
              setIsPinUnlocked(true);
            } else if (typeof window !== 'undefined') {
              const isUnlocked =
                sessionStorage.getItem(`${PIN_UNLOCKED_PREFIX}${activeUser.id}`) === 'true' ||
                localStorage.getItem(`${PIN_UNLOCKED_PREFIX}${activeUser.id}`) === 'true';
              setIsPinUnlocked(isUnlocked);
            }
          }

          const years = await academicYearService.getYears(activeSchool.id);
          const activeYears = years.length > 0 ? years : INITIAL_ACADEMIC_YEARS;
          setAcademicYears(activeYears);
          const curr = activeYears.find((y) => y.is_current) || activeYears[0];
          setCurrentYearState(curr);
        }
      } catch (err) {
        console.error('Error initializing school context:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initData();

    const handleStorageSync = (e: any) => {
      if (e?.detail?.key === STORAGE_KEYS.SCHOOLS || e?.key === STORAGE_KEYS.SCHOOLS) {
        const storedSchools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
        setCurrentSchoolState((prev) => {
          if (!prev) return prev;
          const matched = storedSchools.find((s) => s.id === prev.id);
          if (!matched) return prev;
          // Guard: avoid reference change if key properties are identical
          if (
            prev.name === matched.name &&
            prev.code === matched.code &&
            prev.status === matched.status &&
            prev.logo_url === matched.logo_url &&
            prev.address === matched.address &&
            prev.phone === matched.phone &&
            prev.email === matched.email &&
            JSON.stringify(prev.school_hours) === JSON.stringify(matched.school_hours) &&
            JSON.stringify(prev.enabled_features) === JSON.stringify(matched.enabled_features)
          ) {
            return prev;
          }
          return { ...prev, ...matched };
        });
      }
    };

    window.addEventListener('storage', handleStorageSync);
    window.addEventListener('school_erp_data_sync', handleStorageSync);

    return () => {
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('school_erp_data_sync', handleStorageSync);
    };
  }, [applyBackendAccess, setCurrentSchool]);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const isConfigured =
        supabaseUrl &&
        supabaseAnonKey &&
        !supabaseUrl.includes('demo.supabase.co') &&
        !supabaseUrl.includes('your-project-id');

      if (isConfigured && typeof window !== 'undefined') {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: { prompt: 'select_account' },
          },
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      return { success: false, error: 'Google Sign-In is not configured. Set the Supabase URL and anonymous key.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Google sign-in failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithPasskey = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await passkeyService.authenticateWithPasskey();
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setAccessState(res.user.role === 'super_admin' ? 'SUPER_ADMIN' : 'ACTIVE_SCHOOL_USER');
        syncAuthSessionCookie(res.user);
        const pinStatus = await pinSecurityService.getUserPinStatus(res.user);
        setIsPinUnlocked(!pinStatus.hasPin);
        storageService.setItem(AUTH_STORAGE_KEY, res.user);
        if (res.user.school_id) {
          const sch = await schoolService.getSchoolById(res.user.school_id);
          if (sch) setCurrentSchool(sch);
        }
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentSchool]);

  const loginWithIdentifier = useCallback(async (identifier: string, pass: string, schoolCode?: string) => {
    const res = await authService.authenticateWithIdentifierAndPassword(identifier, pass, schoolCode);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setAccessState(res.user.role === 'super_admin' ? 'SUPER_ADMIN' : 'ACTIVE_SCHOOL_USER');
      syncAuthSessionCookie(res.user);
      const pinStatus = await pinSecurityService.getUserPinStatus(res.user);
      setIsPinUnlocked(!pinStatus.hasPin);
      storageService.setItem(AUTH_STORAGE_KEY, res.user);
      if (res.user.school_id) {
        try {
          const sch = await schoolService.getSchoolById(res.user.school_id);
          if (sch) setCurrentSchool(sch);
        } catch (e) {
          console.warn('Could not fetch school details on login:', e);
        }
      }
    }
    return res;
  }, [setCurrentSchool]);

  const loginStudent = useCallback(async (schoolCode: string, registrationNumber: string, pass: string) => {
    const res = await authService.authenticateStudent(schoolCode, registrationNumber, pass);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setAccessState('ACTIVE_SCHOOL_USER');
      syncAuthSessionCookie(res.user);
      const pinStatus = await pinSecurityService.getUserPinStatus(res.user);
      setIsPinUnlocked(!pinStatus.hasPin);
      storageService.setItem(AUTH_STORAGE_KEY, res.user);
      if (res.user.school_id) {
        try {
          const sch = await schoolService.getSchoolById(res.user.school_id);
          if (sch) setCurrentSchool(sch);
        } catch (e) {
          console.warn('Could not fetch school details on login:', e);
        }
      }
    }
    return res;
  }, [setCurrentSchool]);

  const verifyPin = useCallback(async (pin: string) => {
    if (!currentUser) return { success: false, error: 'No authenticated user session' };
    const res = await pinSecurityService.verifyPin(currentUser, pin);
    if (res.success) {
      setIsPinUnlocked(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`${PIN_UNLOCKED_PREFIX}${currentUser.id}`, 'true');
        localStorage.setItem(`${PIN_UNLOCKED_PREFIX}${currentUser.id}`, 'true');
      }
    }
    return res;
  }, [currentUser]);

  const lockPinSession = useCallback(() => {
    setIsPinUnlocked(false);
    if (typeof window !== 'undefined' && currentUser) {
      sessionStorage.removeItem(`${PIN_UNLOCKED_PREFIX}${currentUser.id}`);
      localStorage.removeItem(`${PIN_UNLOCKED_PREFIX}${currentUser.id}`);
    }
  }, [currentUser]);

  const logout = useCallback(async () => {
    // Clear rendered authorization state immediately. Supabase sign-out may need
    // a network round trip, but stale identity must never remain visible meanwhile.
    setCurrentUser(null);
    setCurrentSchoolState(null);
    setAccessState(null);
    setPendingAccessRequest(null);
    setIsPinUnlocked(false);
    syncAuthSessionCookie(null);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const isConfigured =
        supabaseUrl &&
        supabaseAnonKey &&
        !supabaseUrl.includes('demo.supabase.co') &&
        !supabaseUrl.includes('your-project-id');

      if (isConfigured && typeof window !== 'undefined') {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Supabase sign out error:', e);
    }

    if (typeof window !== 'undefined') {
      clearStoredAuthSession();

      // Hard redirect to login to wipe browser history
      window.location.replace('/login');
    }
  }, []);

  const setCurrentYear = useCallback((year: AcademicYear) => {
    setCurrentYearState(year);
  }, []);

  const contextValue = useMemo<AuthContextType>(() => ({
    currentUser,
    currentSchool,
    currentYear,
    academicYears,
    setCurrentYear,
    setCurrentSchool,
    loginWithGoogle,
    loginWithPasskey,
    loginWithIdentifier,
    loginStudent,
    logout,
    isLoading,
    accessState,
    pendingAccessRequest,
    refreshAccess,
    isPinUnlocked,
    verifyPin,
    lockPinSession,
  }), [
    currentUser,
    currentSchool,
    currentYear,
    academicYears,
    setCurrentYear,
    setCurrentSchool,
    loginWithGoogle,
    loginWithPasskey,
    loginWithIdentifier,
    loginStudent,
    logout,
    isLoading,
    accessState,
    pendingAccessRequest,
    refreshAccess,
    isPinUnlocked,
    verifyPin,
    lockPinSession,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
