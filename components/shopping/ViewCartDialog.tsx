import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, getCurrencyByCode } from '@/lib/currency';
import type { ShoppingCart } from '@/lib/cartService';
import { Globe, Pencil, Trash2 } from 'lucide-react';
import ShoppingSummary from '@/components/shopping/ShoppingSummary';

interface ViewCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: ShoppingCart | null;
  currency: any;
}

interface ShoppingItemsListProps {
  items: any[];
  currencyObj: any;
}

const ShoppingItemsList: React.FC<ShoppingItemsListProps> = ({ items, currencyObj }) => {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border transition-all duration-200 bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600/50 hover:shadow-md hover:bg-gray-100 dark:hover:bg-slate-600/50"
        >
          <div className="flex flex-1 flex-row items-center gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                {item.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 truncate">
                Qty: {item.quantity} × {formatCurrency(item.price, currencyObj)}
              </p>
            </div>
            <div className="text-right mt-2 sm:mt-0 sm:ml-auto">
              <p className="font-bold text-lg text-gray-900 dark:text-slate-100 whitespace-nowrap">
                {formatCurrency(item.total ?? (item.price * item.quantity), currencyObj)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>

  );
};

const ViewCartDialog: React.FC<ViewCartDialogProps> = ({ open, onOpenChange, cart, currency }) => {
  const items = cart?.items || [];
  const currencyObj = typeof currency === 'string' ? getCurrencyByCode(currency) : currency;
  const totalAmount = items.reduce((sum, item) => sum + (item.total ?? (item.price * item.quantity)), 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92%] sm:w-[95vw] max-w-3xl max-h-[90vh] p-0 overflow-auto">
        <div className="flex flex-col h-full min-h-0">
          <DialogHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700">
            <div className="flex items-center gap-2 sm:gap-3">
              <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 dark:text-blue-300" />
              <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {cart?.name || 'Untitled Cart'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mt-1">
              View all items and details for this cart
            </DialogDescription>            
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-2 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-900">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400 dark:text-slate-500">
                <svg className="mx-auto h-16 w-16 sm:h-20 sm:w-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 dark:text-slate-400 text-sm">No items have been added to this cart yet.</p>
              </div>
            ) : (
              <>
                {/* Use ShoppingSummary component for summary card */}
                <ShoppingSummary
                  totalItems={items.length}
                  totalQuantity={totalQuantity}
                  totalAmountFormatted={formatCurrency(totalAmount, currencyObj)}
                />
                {/* Responsive Shopping Items List for all breakpoints */}
                <ShoppingItemsList items={items} currencyObj={currencyObj} />
              </>
            )}
          </div>

          <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-gray-50 dark:bg-slate-800">
            <DialogClose asChild>
              <Button variant="outline" className="px-6 w-full sm:w-auto">Close</Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewCartDialog;
