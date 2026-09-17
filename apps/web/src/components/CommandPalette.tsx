'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  Camera,
  Utensils,
  ShoppingCart,
  Activity,
  Refrigerator,
  CreditCard,
  Moon,
  Sun,
  X,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/components/ThemeProvider';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: 'Actions' | 'Navigation' | 'Culinary AI';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands: CommandItem[] = [
    {
      id: 'cmd-cook',
      title: 'Launch OmniChef™ Voice Cooking HUD',
      description: 'Hands-free voice steps, multi-timers, & live substitutions',
      category: 'Culinary AI',
      icon: Utensils,
      action: () => router.push('/cook/demo'),
      shortcut: 'C',
    },
    {
      id: 'cmd-vision',
      title: 'VisionPantry™ Multimodal Scanner',
      description: 'Scan fridge photo or receipt with shelf-life decay modeling',
      category: 'Culinary AI',
      icon: Camera,
      action: () => router.push('/onboarding'),
      shortcut: 'V',
    },
    {
      id: 'cmd-cart',
      title: 'OmniCart™ Multi-Retailer Arbitrage',
      description: 'Compare Instacart, Amazon Fresh, Walmart, & Kroger prices',
      category: 'Culinary AI',
      icon: ShoppingCart,
      action: () => router.push('/grocery'),
      shortcut: 'G',
    },
    {
      id: 'cmd-metabolic',
      title: 'Precision Metabolic & Glycemic Profile',
      description: 'Review glycemic load, satiety index, and workout sync',
      category: 'Culinary AI',
      icon: Activity,
      action: () => router.push('/nutrition'),
      shortcut: 'M',
    },
    {
      id: 'cmd-surprise',
      title: 'Dinner Roulette (Surprise Me)',
      description: '1-Click meal generation for spontaneous cooking',
      category: 'Actions',
      icon: Sparkles,
      action: () => router.push('/surprise-me'),
    },
    {
      id: 'cmd-dashboard',
      title: 'Go to Smart Dashboard',
      description: 'Access meal plans, daily retention streaks, and pantry',
      category: 'Navigation',
      icon: Refrigerator,
      action: () => router.push('/dashboard'),
    },
    {
      id: 'cmd-pricing',
      title: 'Unlock WhatsForDinner Pro ($9.99/mo)',
      description: 'Unlimited AI regenerations, family syncing, & custom macros',
      category: 'Navigation',
      icon: CreditCard,
      action: () => router.push('/pricing'),
    },
    {
      id: 'cmd-theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      description: 'Toggle UI color theme for kitchen or evening viewing',
      category: 'Actions',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
  ];

  const filteredCommands = commands.filter(
    cmd =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation within the palette
  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          selected.action();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [isOpen, selectedIndex, filteredCommands]);

  return (
    <>
      {/* Floating Spotlight Hint Trigger Button for Mobile / Non-Keyboard users */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-primary/95 text-primary-foreground hover:bg-primary shadow-2xl p-3.5 rounded-full flex items-center gap-2 font-bold text-xs backdrop-blur border border-primary-foreground/20 hover:scale-105 transition-all group"
        aria-label="Open Kitchen Command Center"
      >
        <Sparkles className="w-4 h-4 animate-spin-slow text-amber-300" />
        <span className="hidden sm:inline">Omni Command</span>
        <kbd className="hidden sm:inline bg-black/20 px-1.5 py-0.5 rounded text-[10px] font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Spotlight Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              className="w-full max-w-xl bg-background border shadow-2xl rounded-3xl overflow-hidden"
            >
              {/* Search Input */}
              <div className="flex items-center px-4 border-b">
                <Search className="w-5 h-5 text-muted-foreground mr-3" />
                <input
                  type="text"
                  placeholder="Type a command or search (e.g. Cook, Vision, Salmon, Macros)..."
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  autoFocus
                  className="w-full py-4 text-base bg-transparent border-none outline-none placeholder:text-muted-foreground/60"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Command List */}
              <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                {filteredCommands.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No culinary commands found for &quot;{query}&quot;
                  </div>
                ) : (
                  filteredCommands.map((cmd, idx) => {
                    const Icon = cmd.icon;
                    const isSelected = selectedIndex === idx;

                    return (
                      <div
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          setIsOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`p-3 rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{cmd.title}</p>
                            <p
                              className={`text-xs truncate ${
                                isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                              }`}
                            >
                              {cmd.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pl-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] hidden sm:inline-block ${
                              isSelected
                                ? 'border-primary-foreground/40 text-primary-foreground'
                                : 'border-muted text-muted-foreground'
                            }`}
                          >
                            {cmd.category}
                          </Badge>
                          {isSelected && <ArrowRight className="w-4 h-4" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Helper */}
              <div className="px-4 py-2.5 bg-muted/40 border-t flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <div className="flex items-center gap-3">
                  <span>
                    Use <kbd className="font-mono bg-background border px-1 rounded">↑</kbd>{' '}
                    <kbd className="font-mono bg-background border px-1 rounded">↓</kbd> to navigate
                  </span>
                  <span>
                    <kbd className="font-mono bg-background border px-1 rounded">↵</kbd> to select
                  </span>
                  <span>
                    <kbd className="font-mono bg-background border px-1 rounded">esc</kbd> to close
                  </span>
                </div>
                <span className="font-bold text-primary">WhatsForDinner Omni v2.5</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
