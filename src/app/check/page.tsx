'use client';

import { Suspense } from 'react';
import { CheckPageClient } from '@/components/features/ImageUploadForm';

export default function CheckPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground">Loading scanner...</div>}>
      <CheckPageClient />
    </Suspense>
  );
}
