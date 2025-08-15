"use client";

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function useRouteChange() {
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const [previousPath, setPreviousPath] = useState<string>('');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // If this is the first render, just set the initial path
    if (!previousPath) {
      setPreviousPath(pathname);
      return;
    }

    // If the path has changed, show loading state
    if (previousPath !== pathname) {
      setIsRouteChanging(true);
      
      // Clear loading state after a delay to allow the new page to render
      const timer = setTimeout(() => {
        setIsRouteChanging(false);
      }, 500);

      setPreviousPath(pathname);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [pathname, previousPath]);

  // Also detect search params changes
  useEffect(() => {
    if (previousPath) {
      setIsRouteChanging(true);
      
      const timer = setTimeout(() => {
        setIsRouteChanging(false);
      }, 300);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [searchParams, previousPath]);

  return { isRouteChanging };
}

export default useRouteChange;
