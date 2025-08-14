"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  show: boolean;
  onClick: () => void;
}

export function ScrollToTopButton({ show, onClick }: ScrollToTopButtonProps) {
  if (!show) return null;
  return (
    <Button
      onClick={onClick}
      className="fixed right-6 bottom-24 sm:bottom-6 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
      size="icon"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}

export default ScrollToTopButton;


