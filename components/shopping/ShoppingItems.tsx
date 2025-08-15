"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Pencil, Trash2, X, Minus, Plus, Loader2 } from 'lucide-react';
import { ShoppingItem } from '@/lib/storage';
import { Currency, formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';

interface ShoppingItemsProps {
  items: ShoppingItem[];
  currency: Currency;
  onClearAll: () => void;
  onDeleteItem: (id: string) => Promise<void>;
  onUpdateItem: (id: string, updates: Pick<ShoppingItem, 'name' | 'price' | 'quantity' | 'total'>) => Promise<void>;
  canEdit?: boolean;
  onRequirePro?: () => void;
}

export function ShoppingItems({ items, currency, onClearAll, onDeleteItem, onUpdateItem, canEdit, onRequirePro }: ShoppingItemsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState<string>('');
  const [priceDraft, setPriceDraft] = useState<string>('');
  const [quantityDraft, setQuantityDraft] = useState<number>(1);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
    // Reset drafts to original values
    const original = items.find(i => i.id === editingId);
    if (original) {
      setNameDraft(original.name);
      setPriceDraft(String(original.price));
      setQuantityDraft(original.quantity);
    }
  };

  const saveEdit = async (id: string) => {
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
    
    setProcessingId(id);
    try {
      const total = priceNum * qtyNum;
      await onUpdateItem(id, { name, price: priceNum, quantity: qtyNum, total });
      setEditingId(null);
      toast.success('Item updated successfully');
    } catch (error) {
      toast.error('Failed to update item', { description: 'Please try again.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setProcessingId(id);
    try {
      await onDeleteItem(id);
      toast.success('Item removed');
    } catch (error) {
      toast.error('Failed to remove item', { description: 'Please try again.' });
    } finally {
      setProcessingId(null);
    }
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
          <CardTitle className="text-xl">Shopping Items ({items.length})</CardTitle>
          <Button
            variant="destructive"
            onClick={onClearAll}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transition-all duration-200"
            disabled={items.length === 0}
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
            const isProcessing = processingId === item.id;
            const isNameValid = nameDraft.trim().length > 0;
            const isPriceValid = !isEditing || (priceDraft && !isNaN(parseFloat(priceDraft)) && parseFloat(priceDraft) > 0);
            
            return (
              <div
                key={item.id}
                className={`group relative flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                  isEditing 
                    ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-lg' 
                    : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600/50 hover:shadow-md hover:bg-gray-100 dark:hover:bg-slate-600/50'
                }`}
                onKeyDown={isEditing ? onRowKeyDown : undefined}
              >
                {/* Processing overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 rounded-lg flex items-center justify-center z-10">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-sm text-blue-600 font-medium">Processing...</span>
                    </div>
                  </div>
                )}
                
                <div className="flex-1">
                  {!isEditing ? (
                    <div className="transition-all duration-200 ease-in-out">
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        Qty: {item.quantity} × {formatCurrency(item.price, currency)}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in slide-in-from-left-2 duration-200">
                      <div className="space-y-1">
                        <Input
                          type="text"
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          placeholder="Product name"
                          className={`h-10 transition-all duration-200 ${
                            !isNameValid ? 'border-red-300 focus:border-red-500' : 'border-green-300 focus:border-green-500'
                          }`}
                          autoFocus
                        />
                        {!isNameValid && (
                          <p className="text-xs text-red-500 animate-in slide-in-from-top-1 duration-200">Name is required</p>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={priceDraft}
                          onChange={(e) => setPriceDraft(e.target.value)}
                          onFocus={(e) => e.currentTarget.select()}
                          placeholder="0.00"
                          className={`h-10 transition-all duration-200 ${
                            !isPriceValid ? 'border-red-300 focus:border-red-500' : 'border-green-300 focus:border-green-500'
                          } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />
                        {!isPriceValid && (
                          <p className="text-xs text-red-500 animate-in slide-in-from-top-1 duration-200">Valid price required</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                          onClick={() => setQuantityDraft(Math.max(1, quantityDraft - 1))}
                          disabled={isProcessing || quantityDraft <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={quantityDraft}
                          onChange={(e) => setQuantityDraft(Math.max(1, parseInt(e.target.value) || 1))}
                          onFocus={(e) => e.currentTarget.select()}
                          className="h-10 w-24 text-center border-green-300 focus:border-green-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          disabled={isProcessing}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                          onClick={() => setQuantityDraft(quantityDraft + 1)}
                          disabled={isProcessing}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {!isEditing ? (
                    <>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900 dark:text-slate-100">
                          {formatCurrency(item.total, currency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(item)}
                            className="h-9 w-9 p-0 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-105 active:scale-95"
                            aria-label="Edit item"
                            title="Edit item"
                            disabled={isProcessing}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="h-9 w-9 p-0 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 hover:scale-105 active:scale-95"
                          aria-label="Delete item"
                          title="Delete item"
                          disabled={isProcessing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900 dark:text-slate-100">
                          {formatCurrency((parseFloat(priceDraft || '0') * Math.max(1, quantityDraft)) || 0, currency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEdit(item.id)}
                          className={`h-9 w-9 p-0 transition-all duration-200 hover:scale-105 active:scale-95 ${
                            isNameValid && isPriceValid
                              ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50/60 dark:hover:bg-green-950/20'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          aria-label="Save item"
                          title="Save changes"
                          disabled={!isNameValid || !isPriceValid || isProcessing}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                          className="h-9 w-9 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50/60 dark:hover:bg-slate-900/40 transition-all duration-200 hover:scale-105 active:scale-95"
                          aria-label="Cancel edit"
                          title="Cancel changes"
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
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


