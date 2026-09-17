'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
  hover?: boolean;
  className?: string;
}

export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, delay = 0, hover = true, className, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        { threshold: 0.1 }
      );

      if (cardRef.current) {
        observer.observe(cardRef.current);
      }

      return () => {
        if (cardRef.current) {
          observer.unobserve(cardRef.current);
        }
      };
    }, []);

    return (
      <div
        ref={cardRef}
        className={cn(
          'transition-all duration-500',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          hover && 'hover-lift',
          className
        )}
        style={{
          transitionDelay: `${delay}ms`,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AnimatedCard.displayName = 'AnimatedCard';

interface AnimatedCardWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedCardWrapper({ children, className }: AnimatedCardWrapperProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-300 hover:shadow-lg hover:border-primary/50',
        className
      )}
    >
      {children}
    </Card>
  );
}

export default AnimatedCard;
