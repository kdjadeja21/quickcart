"use client";

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { saveSettings } from '@/lib/storage';

type Theme = 'light' | 'dark';

interface UseUserSettingsSyncArgs {
  currency: string;
  setCurrency: (c: string) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  setPlan: (p: number) => void;
}

export function useUserSettingsSync({ currency, setCurrency, theme, setTheme, setPlan }: UseUserSettingsSyncArgs) {
  const { user, isLoaded, isSignedIn } = useUser();
  const initializedUserIdRef = useRef<string | null>(null);

  // Initialize user metadata on first sign-in per user ID
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (initializedUserIdRef.current === user.id) return;

    const ensureUserMetadata = async () => {
      const um = (user.unsafeMetadata || {}) as Record<string, unknown>;

      const hasCurrency = typeof um.currency === 'string';
      const hasTheme = um.theme === 'light' || um.theme === 'dark';

      const nextCurrency = hasCurrency ? (um.currency as string) : 'INR';
      const nextTheme = hasTheme ? (um.theme as Theme) : 'light';

      if (currency !== nextCurrency) setCurrency(nextCurrency);
      if (theme !== nextTheme) setTheme(nextTheme);

      try {
        if (!hasCurrency || !hasTheme) {
          await user.update({
            unsafeMetadata: { ...um, currency: nextCurrency, theme: nextTheme },
          });
        }
      } catch (e) {
        console.error('Failed to initialize user unsafe metadata', e);
      }

      try {
        // Check if user already has a plan before setting defaults
        const planRes = await fetch('/api/user/plan', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (planRes.ok) {
          const planData = (await planRes.json()) as { plan?: unknown };
          const existingPlan = typeof planData.plan === 'number' ? planData.plan as number : 0;
          setPlan(existingPlan);
        } else {
          // Only set default plan if we can't retrieve existing one
          const defaultPlanRes = await fetch('/api/user/plan', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: 0 })
          });
          if (defaultPlanRes.ok) {
            const data = (await defaultPlanRes.json()) as { plan?: unknown };
            console.log(data);
            const planNum = typeof data.plan === 'number' ? (data.plan as number) : 0;
            setPlan(planNum);
          } else {
            setPlan(0);
          }
        }
      } catch (e) {
        console.error('Failed to get/set plan in privateMetadata', e);
        setPlan(0);
      }

      initializedUserIdRef.current = user.id;
    };

    void ensureUserMetadata();
  }, [isLoaded, isSignedIn, user, currency, theme, setCurrency, setTheme, setPlan]);

  // When currency changes, sync to Clerk (if signed in) or local storage (guest)
  useEffect(() => {
    if (!currency) return;
    const syncCurrency = async () => {
      if (isSignedIn && isLoaded && user) {
        const um = (user.unsafeMetadata || {}) as Record<string, unknown>;
        if (um.currency !== currency) {
          try {
            await user.update({ unsafeMetadata: { ...um, currency } });
          } catch (e) {
            console.error('Failed to update currency in user metadata', e);
          }
        }
      } else {
        saveSettings({ currency, theme: 'light' });
      }
    };
    void syncCurrency();
  }, [currency, isLoaded, isSignedIn, user]);

  // When theme changes, sync to Clerk for signed-in user
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    const syncTheme = async () => {
      const um = (user.unsafeMetadata || {}) as Record<string, unknown>;
      const currentTheme = um.theme as Theme | undefined;
      if (currentTheme !== theme) {
        try {
          await user.update({ unsafeMetadata: { ...um, theme } });
        } catch (e) {
          console.error('Failed to update theme in user metadata', e);
        }
      }
    };
    void syncTheme();
  }, [theme, isLoaded, isSignedIn, user]);
}

export default useUserSettingsSync;


