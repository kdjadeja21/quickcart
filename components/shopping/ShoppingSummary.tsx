"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ShoppingSummaryProps {
  totalItems: number;
  totalQuantity: number;
  totalAmountFormatted: string;
}

export function ShoppingSummary({ totalItems, totalQuantity, totalAmountFormatted }: ShoppingSummaryProps) {
  return (
    <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-700/20 border border-green-200/50 dark:border-emerald-600/30 shadow-xl">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-700 dark:text-emerald-300">{totalItems}</p>
            <p className="text-sm text-green-600 dark:text-emerald-400">Total Items</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-700 dark:text-emerald-300">{totalQuantity}</p>
            <p className="text-sm text-green-600 dark:text-emerald-400">Total Quantity</p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-2xl font-bold text-green-700 dark:text-emerald-300">{totalAmountFormatted}</p>
            <p className="text-sm text-green-600 dark:text-emerald-400">Total Amount</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ShoppingSummary;


