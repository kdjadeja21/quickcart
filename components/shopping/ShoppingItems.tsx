"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Pencil, Trash2, X, Minus, Plus } from 'lucide-react';
import { ShoppingItem } from '@/lib/storage';
import { Currency, formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';

interface ShoppingItemsProps {
  items: ShoppingItem[];
  currency: Currency;
  onClearAll: () => void;
  onDeleteItem: (id: string) => void;
  onUpdateItem: (id: string, updates: Pick<ShoppingItem, 'name' | 'price' | 'quantity' | 'total'>) => void;
  canEdit?: boolean;
  onRequirePro?: () => void;
}

export function ShoppingItems({ items, currency, onClearAll, onDeleteItem, onUpdateItem, canEdit, onRequirePro }: ShoppingItemsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState<string>('');
  const [priceDraft, setPriceDraft] = useState<string>('');
  const [quantityDraft, setQuantityDraft] = useState<number>(1);

  const startEdit = (item: ShoppingItem) => {
    if (!canEdit) {
      onRequirePro?.();
      return;
    }
    setEditingId(item.id);
    setNameDraft(item.name);
    setPriceDraft(String(item.price));
    setQuantityDraft(item.quantity);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    const name = nameDraft.trim();
    const priceNum = parseFloat(priceDraft);
    const qtyNum = Math.max(1, Number.isFinite(quantityDraft) ? quantityDraft : 1);
    if (!name) {
      toast.error('Name required', { description: 'Please enter a product name.' });
      return;
    }
    if (!priceDraft || isNaN(priceNum) || priceNum <= 0) {
      toast.error('Invalid price', { description: 'Please enter a valid positive price.' });
      return;
    }
    const original = items.find(i => i.id === id);
    if (original && original.name === name && original.price === priceNum && original.quantity === qtyNum) {
      setEditingId(null);
      toast.info('No changes to save');
      return;
    }
    const total = priceNum * qtyNum;
    onUpdateItem(id, { name, price: priceNum, quantity: qtyNum, total });
    setEditingId(null);
    toast.success('Item updated');
  };

  const onRowKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!editingId) return;
    if (e.key === 'Enter') {
      saveEdit(editingId);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

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
          {items.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600/50 hover:shadow-md transition-shadow"
                onKeyDown={isEditing ? onRowKeyDown : undefined}
              >
                <div className="flex-1">
                  {!isEditing ? (
                    <>
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100">{item.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        Qty: {item.quantity} x {formatCurrency(item.price, currency)}
                      </p>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        type="text"
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        placeholder="Product name"
                        className="h-10"
                        autoFocus
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceDraft}
                        onChange={(e) => setPriceDraft(e.target.value)}
                        onFocus={(e) => e.currentTarget.select()}
                        placeholder="0.00"
                        className="h-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          aria-label="Decrease quantity"
                          onClick={() => setQuantityDraft(Math.max(1, quantityDraft - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={quantityDraft}
                          onChange={(e) => setQuantityDraft(Math.max(1, parseInt(e.target.value) || 1))}
                          onFocus={(e) => e.currentTarget.select()}
                          className="h-10 w-24 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          aria-label="Increase quantity"
                          onClick={() => setQuantityDraft(quantityDraft + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900 dark:text-slate-100">
                      {formatCurrency(isEditing ? (parseFloat(priceDraft || '0') * Math.max(1, quantityDraft)) || 0 : item.total, currency)}
                    </p>
                  </div>
                  {!isEditing ? (
                    <>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(item)}
                          className="cursor-pointer h-8 w-8 p-0 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50/60 dark:hover:bg-blue-950/20"
                          aria-label="Edit item"
                          title="Edit item"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteItem(item.id)}
                        className="cursor-pointer h-8 w-8 p-0 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                        aria-label="Delete item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => saveEdit(item.id)}
                        className="cursor-pointer h-8 w-8 p-0 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50/60 dark:hover:bg-green-950/20"
                        aria-label="Save item"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelEdit}
                        className="cursor-pointer h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50/60 dark:hover:bg-slate-900/40"
                        aria-label="Cancel edit"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default ShoppingItems;


