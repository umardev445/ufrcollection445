import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';

export const Skeleton = ({ className, ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className={cn("animate-pulse bg-brand-cream/50 rounded-lg", className)} />
);

export const ProductCardSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="aspect-[3/4] rounded-2xl" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-6 w-1/4" />
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
    <div className="space-y-4">
      <Skeleton className="aspect-[3/4] rounded-3xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
      </div>
    </div>
    <div className="space-y-8 py-10">
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="space-y-4 pt-10">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="pt-10 flex gap-4">
        <Skeleton className="h-14 w-full rounded-full" />
        <Skeleton className="h-14 w-14 rounded-full" />
      </div>
    </div>
  </div>
);

export const CartItemSkeleton = () => (
  <div className="flex gap-6 py-8 border-b border-brand-beige">
    <Skeleton className="w-24 aspect-[3/4] rounded-xl shrink-0" />
    <div className="flex-grow space-y-4 justify-center flex flex-col">
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  </div>
);

export const OrderTimelineSkeleton = () => (
  <div className="space-y-12 py-10">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex gap-6">
        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
        <div className="flex-grow space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
    ))}
  </div>
);
