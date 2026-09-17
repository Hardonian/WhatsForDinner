'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbStructuredData } from '@/components/StructuredData';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items = [] }: { items?: BreadcrumbItem[] }) {
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    ...items,
  ];

  return (
    <>
      <BreadcrumbStructuredData items={breadcrumbItems} />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            
            return (
              <li key={item.url} className="flex items-center">
                {index === 0 ? (
                  <Home className="h-4 w-4 mr-1" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-4 w-4 mx-1" aria-hidden="true" />
                )}
                {isLast ? (
                  <span className="text-foreground font-medium" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

export default Breadcrumb;
