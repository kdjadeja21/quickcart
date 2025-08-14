"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Minus, Plus } from 'lucide-react';

interface AddItemFormProps {
  name: string;
  price: string;
  quantity: number;
  currencySymbol: string;
  onNameChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onSubmit: () => void;
  onEnterPress?: () => void;
  isSubmitting?: boolean;
}

export function AddItemForm({
  name,
  price,
  quantity,
  currencySymbol,
  onNameChange,
  onPriceChange,
  onQuantityChange,
  onSubmit,
  onEnterPress,
  isSubmitting,
}: AddItemFormProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onEnterPress) onEnterPress();
  };

  return (
    <Card className="mb-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl">Add New Item</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Product Name
            </label>
            <Input
              type="text"
              placeholder="Enter product name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-base h-12"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Price Per Item ({currencySymbol})
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-base h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Quantity
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                aria-label="Decrease quantity"
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                onFocus={(e) => e.currentTarget.select()}
                onKeyPress={handleKeyPress}
                className="text-base h-12 w-24 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                aria-label="Increase quantity"
                onClick={() => onQuantityChange(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <Button
          onClick={onSubmit}
          className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Item
        </Button>
      </CardContent>
    </Card>
  );
}

export default AddItemForm;


