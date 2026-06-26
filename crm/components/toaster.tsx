'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { toast, type Toast } from '@/lib/toast';
import { cn } from '@/lib/cn';

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => toast.subscribe(setItems), []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm shadow-lg',
            t.type === 'success' && 'border-green-200 bg-green-50 text-green-800',
            t.type === 'error' && 'border-red-200 bg-red-50 text-red-800',
            t.type === 'info' && 'border-gray-200 bg-white text-gray-800',
          )}
        >
          {t.type === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          {t.type === 'error' && <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          {t.type === 'info' && <Info className="mt-0.5 h-4 w-4 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => toast.dismiss(t.id)} className="text-current/60 hover:text-current">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
