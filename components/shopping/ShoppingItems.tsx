"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ShoppingItem } from '@/lib/storage';
import { Currency, formatCurrency } from '@/lib/currency';

interface ShoppingItemsProps {
  items: ShoppingItem[];
  currency: Currency;
  onClearAll: () => void;
  onDeleteItem: (id: string) => void;
}

export function ShoppingItems({ items, currency, onClearAll, onDeleteItem }: ShoppingItemsProps) {
  if (items.length === 0) {
    return (
      <Card className="mb-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-xl">
        <CardContent className="py-12 text-center">
          <div className="text-gray-400 dark:text-slate-500 mb-4">
            <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Your shopping list is empty</h3>
          <p className="text-gray-600 dark:text-slate-400">Add your first item using the form above</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Shopping Items</CardTitle>
          <Button
            variant="destructive"
            onClick={onClearAll}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600/50 hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">{item.name}</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Qty: {item.quantity} x {formatCurrency(item.price, currency)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900 dark:text-slate-100">
                    {formatCurrency(item.total, currency)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteItem(item.id)}
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ShoppingItems;


