import React from 'react';

export const Skeleton = ({ className = '' }) => {
  return (
    <div className={`skeleton ${className}`} aria-hidden="true" />
  );
};

export const SkeletonCard = () => {
  return <Skeleton className="h-32 w-full" />;
};

export const SkeletonChart = () => {
  return <Skeleton className="h-64 w-full" />;
};

export const SkeletonList = () => {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
};
