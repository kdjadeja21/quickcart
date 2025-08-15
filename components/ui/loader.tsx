"use client";

import React from 'react';
import { Loader2, ShoppingCart, Sparkles } from 'lucide-react';

interface LoaderProps {
  isLoading: boolean;
  message?: string;
}

export function Loader({ isLoading, message = "Loading..." }: LoaderProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xl">
        {/* App Name - matching header styling */}
        {/* <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight leading-tight bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-600 dark:from-indigo-300 dark:via-sky-300 dark:to-cyan-200 bg-clip-text text-transparent">
            Quick Cart
          </h1>
        </div> */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="relative inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-600 text-white shadow ring-1 ring-white/20">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <h1 className="inline-block whitespace-nowrap text-xl sm:text-3xl font-semibold tracking-tight leading-tight bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-600 dark:from-indigo-300 dark:via-sky-300 dark:to-cyan-200 bg-clip-text text-transparent">Quick Cart</h1>
          </div>
        </div>

        {/* Loading Message and Spinner */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
            {message}
          </p>
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-300" />
        </div>
      </div>
    </div>
  );
}

export default Loader;
