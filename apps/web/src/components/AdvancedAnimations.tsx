/**
 * Advanced Animations Component
 * Celebration animations, micro-interactions, and delightful feedback
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, Trophy, Heart, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CelebrationProps {
  type: 'success' | 'achievement' | 'streak' | 'recipe';
  onComplete?: () => void;
}

export function Celebration({ type, onComplete }: CelebrationProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          message: 'Success!',
        };
      case 'achievement':
        return {
          icon: Trophy,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          message: 'Achievement Unlocked!',
        };
      case 'streak':
        return {
          icon: Sparkles,
          color: 'text-orange-500',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20',
          message: 'Streak Continued!',
        };
      case 'recipe':
        return {
          icon: Heart,
          color: 'text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          message: 'Recipe Saved!',
        };
      default:
        return {
          icon: Star,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          message: 'Great!',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: -50 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            className={`${config.bgColor} rounded-full p-8 border-4 border-current ${config.color}`}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: 1,
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, 360],
              }}
              transition={{
                duration: 0.8,
                repeat: 1,
              }}
            >
              <Icon className="w-16 h-16" />
            </motion.div>
          </motion.div>

          {/* Confetti effect */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full"
              initial={{
                x: '50vw',
                y: '50vh',
                opacity: 1,
              }}
              animate={{
                x: `${50 + (Math.random() - 0.5) * 100}vw`,
                y: `${50 + (Math.random() - 0.5) * 100}vh`,
                opacity: 0,
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
              }}
            />
          ))}

          {/* Message */}
          <motion.div
            className="absolute bottom-1/4 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={`text-2xl font-bold ${config.color}`}>
              {config.message}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import type { ReactNode } from 'react';
import type { HTMLMotionProps } from 'framer-motion';

/**
 * Micro-interaction: Button press animation
 */

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode;
}

export function AnimatedButton({ children, onClick, ...props }: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * Loading animation with personality
 */
export function PersonalityLoader({ message = 'Finding something delicious...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
      />
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-muted-foreground"
      >
        {message}
      </motion.p>
    </div>
  );
}

/**
 * Success checkmark animation
 */
export function SuccessCheckmark() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center"
    >
      <motion.div
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <CheckCircle2 className="w-10 h-10 text-white" />
      </motion.div>
    </motion.div>
  );
}
