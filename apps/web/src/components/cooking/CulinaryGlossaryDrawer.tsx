'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  Volume2,
  X,
  Utensils,
  Wrench,
  Flame,
  Globe,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  CULINARY_GLOSSARY,
  GlossaryEntry,
} from '@/lib/culinary/culinary-glossary';
import { speakCulinaryText } from '@/lib/culinary/culinary-translator';
import { soundEffects } from '@/lib/audio/sound-effects';

interface CulinaryGlossaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function CulinaryGlossaryDrawer({
  isOpen,
  onClose,
  initialQuery = '',
}: CulinaryGlossaryDrawerProps) {
  const [search, setSearch] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<'all' | 'ingredient' | 'instrument' | 'technique'>('all');
  const [speakingTerm, setSpeakingTerm] = useState<string | null>(null);

  const filteredEntries = CULINARY_GLOSSARY.filter(entry => {
    const matchesCategory = activeCategory === 'all' || entry.category === activeCategory;
    const matchesQuery =
      !search ||
      entry.term.toLowerCase().includes(search.toLowerCase()) ||
      entry.definition.toLowerCase().includes(search.toLowerCase()) ||
      entry.usageTip.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handlePronounce = (entry: GlossaryEntry) => {
    soundEffects.playClick();
    setSpeakingTerm(entry.term);
    speakCulinaryText(`${entry.term}. ${entry.definition}`, 'en', () => {
      setSpeakingTerm(null);
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Culinary Lexicon &amp; Tool Glossary</span>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-mono">
                    {CULINARY_GLOSSARY.length} Master Terms
                  </Badge>
                </h2>
                <p className="text-xs text-slate-400">
                  Phonetic pronunciation, kitchen instruments, classical techniques &amp; pantry substitutions.
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white rounded-xl"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search & Category Filter */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search ingredients, instruments, or techniques (e.g. Mirin, Mandoline, Deglazing)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-2xl bg-slate-900 border-slate-800 text-sm text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Button
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory('all')}
                className="h-7 text-xs rounded-xl font-semibold"
              >
                All Terms ({CULINARY_GLOSSARY.length})
              </Button>
              <Button
                variant={activeCategory === 'ingredient' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory('ingredient')}
                className="h-7 text-xs rounded-xl font-semibold border-emerald-500/30 text-emerald-300"
              >
                <Utensils className="w-3 h-3 mr-1" />
                Ingredients
              </Button>
              <Button
                variant={activeCategory === 'instrument' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory('instrument')}
                className="h-7 text-xs rounded-xl font-semibold border-blue-500/30 text-blue-300"
              >
                <Wrench className="w-3 h-3 mr-1" />
                Instruments
              </Button>
              <Button
                variant={activeCategory === 'technique' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory('technique')}
                className="h-7 text-xs rounded-xl font-semibold border-amber-500/30 text-amber-300"
              >
                <Flame className="w-3 h-3 mr-1" />
                Techniques
              </Button>
            </div>
          </div>

          {/* Glossary List */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-800/40">
            {filteredEntries.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No culinary entries found for &ldquo;{search}&rdquo;.
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry.term} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-white">{entry.term}</span>
                        <span className="font-mono text-xs text-amber-400/90 italic">/{entry.phonetic}/</span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase font-bold tracking-wider capitalize px-2 py-0"
                        >
                          {entry.category}
                        </Badge>
                      </div>
                      {entry.origin && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Globe className="w-3 h-3 text-slate-500" />
                          {entry.origin}
                        </span>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePronounce(entry)}
                      className="h-8 text-xs px-2.5 rounded-xl border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200"
                    >
                      <Volume2 className={`w-3.5 h-3.5 mr-1 text-primary ${speakingTerm === entry.term ? 'animate-pulse text-amber-400' : ''}`} />
                      <span>Pronounce</span>
                    </Button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{entry.definition}</p>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] space-y-1">
                    <div className="text-amber-300 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Chef&apos;s Pro Tip:</span>
                    </div>
                    <p className="text-slate-400">{entry.usageTip}</p>
                    {entry.substituteOrAlternative && (
                      <p className="text-slate-400 pt-1 border-t border-slate-800/40">
                        <strong className="text-slate-300">Quick Swap:</strong> {entry.substituteOrAlternative}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
