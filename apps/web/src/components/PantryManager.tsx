'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('pantrymanager');



import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PantryItem {
  id: number;
  ingredient: string;
  quantity: number;
}

interface PantryManagerProps {
  items: PantryItem[];
  onAdd: (ingredient: string, quantity: number) => Promise<void>;
  onUpdate: (id: number, quantity: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function PantryManager({
  items,
  onAdd,
  onUpdate,
  onDelete,
}: PantryManagerProps) {
  const [newIngredient, setNewIngredient] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [optimisticItems, setOptimisticItems] = useState<PantryItem[]>(items);
  const [pendingOps, setPendingOps] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newIngredient.trim()) {
      const tempId = Date.now(); // Temporary ID for optimistic update
      const newItem: PantryItem = {
        id: tempId,
        ingredient: newIngredient.trim(),
        quantity: newQuantity,
      };

      // Optimistic update
      setOptimisticItems(prev => [...prev, newItem]);
      setPendingOps(prev => new Set(prev).add(tempId));

      try {
        await onAdd(newIngredient.trim(), newQuantity);
        // Update with real item from server (will be in items prop)
        setOptimisticItems(items);
      } catch (error) {
        // Rollback on error
        setOptimisticItems(prev => prev.filter(item => item.id !== tempId));
        _logger.error('Failed to add item:', { error: error instanceof Error ? error.message : String(error) });
      } finally {
        setPendingOps(prev => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
        setNewIngredient('');
        setNewQuantity(1);
      }
    }
  };

  const handleUpdate = async (id: number, quantity: number) => {
    // Optimistic update
    setOptimisticItems(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity } : item))
    );
    setPendingOps(prev => new Set(prev).add(id));

    try {
      await onUpdate(id, quantity);
    } catch (error) {
      // Rollback on error
      setOptimisticItems(items);
      _logger.error('Failed to update item:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setPendingOps(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id: number) => {
    const itemToDelete = optimisticItems.find(item => item.id === id);
    
    // Optimistic update
    setOptimisticItems(prev => prev.filter(item => item.id !== id));
    setPendingOps(prev => new Set(prev).add(id));

    try {
      await onDelete(id);
      setOptimisticItems(items);
    } catch (error) {
      // Rollback on error
      if (itemToDelete) {
        setOptimisticItems(prev => [...prev, itemToDelete].sort((a, b) => a.id - b.id));
      }
      _logger.error('Failed to delete item:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setPendingOps(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <form
        onSubmit={handleAdd}
        className="mb-8 rounded-lg bg-white p-6 shadow-md"
      >
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Add New Item
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ingredient
            </label>
            <input
              type="text"
              value={newIngredient}
              onChange={e => setNewIngredient(e.target.value)}
              placeholder="e.g., tomatoes, chicken breast..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              type="number"
              value={newQuantity}
              onChange={e => setNewQuantity(Number(e.target.value))}
              min="1"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Add Item
            </button>
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Pantry</h2>
        </div>

        {optimisticItems.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No items in your pantry yet. Add some ingredients to get started!
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            <AnimatePresence>
              {optimisticItems.map(item => {
                const isPending = pendingOps.has(item.id);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center justify-between px-6 py-4 ${
                      isPending ? 'opacity-50' : ''
                    }`}
                  >
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {item.ingredient}
                  </h3>
                </div>
                  <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleUpdate(item.id, Math.max(1, item.quantity - 1))
                      }
                      disabled={isPending}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdate(item.id, item.quantity + 1)}
                      disabled={isPending}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isPending}
                    aria-label="Delete"
                    className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
