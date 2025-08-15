"use client";

import { useRouteChange } from '@/hooks/useRouteChange';
import { Loader } from '@/components/ui/loader';

export function RouteChangeLoader() {
  const { isRouteChanging } = useRouteChange();

  return (
    <Loader 
      isLoading={isRouteChanging} 
      message="Loading..." 
    />
  );
}

export default RouteChangeLoader;
