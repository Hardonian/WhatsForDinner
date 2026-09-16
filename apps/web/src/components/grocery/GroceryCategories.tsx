/**
 * Grocery Categories Component
 * Animated category grid with hover effects and interactions
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('grocerycategories');



import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GroceryCategory } from '@/lib/grocery/types';
import { groceryManager } from '@/lib/grocery/grocery-manager';

interface GroceryCategoriesProps {
  onCategorySelect?: (category: GroceryCategory) => void;
  selectedCategory?: string;
  animated?: boolean;
}

export function GroceryCategories({
  onCategorySelect,
  selectedCategory,
  animated = true,
}: GroceryCategoriesProps) {
  const [categories, setCategories] = useState<GroceryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const cats = await groceryManager.getCategories();
      setCategories(cats);
    } catch (error) {
      _logger.error('Failed to load categories:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10,
      },
    },
  };

  const hoverVariants = {
    hover: {
      scale: 1.05,
      y: -5,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="h-32 animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={animated ? containerVariants : undefined}
      initial={animated ? 'hidden' : false}
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      <AnimatePresence>
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          const isHovered = hoveredCategory === category.id;

          return (
            <motion.div
              key={category.id}
              variants={animated ? itemVariants : undefined}
              whileHover={animated ? hoverVariants.hover : undefined}
              whileTap={animated ? hoverVariants.tap : undefined}
              onHoverStart={() => setHoveredCategory(category.id)}
              onHoverEnd={() => setHoveredCategory(null)}
              onClick={() => onCategorySelect?.(category)}
              className="cursor-pointer"
            >
              <Card
                className={`
                  h-32 relative overflow-hidden transition-all duration-300
                  ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                  ${isHovered ? 'shadow-lg' : 'shadow-md'}
                `}
                style={{
                  backgroundColor: category.color ? `${category.color}15` : undefined,
                  borderColor: category.color || undefined,
                }}
              >
                <CardContent className="p-4 h-full flex flex-col items-center justify-center gap-2">
                  {/* Icon */}
                  <motion.div
                    animate={isHovered ? { rotate: [0, -10, 10, -10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-4xl"
                  >
                    {category.icon || '📦'}
                  </motion.div>

                  {/* Name */}
                  <motion.div
                    animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
                    className="text-sm font-semibold text-center"
                  >
                    {category.displayName}
                  </motion.div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2"
                    >
                      <Badge variant="default" className="text-xs">
                        ✓
                      </Badge>
                    </motion.div>
                  )}

                  {/* Hover overlay */}
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-primary/10 backdrop-blur-sm"
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
