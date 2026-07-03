'use client';

import { useState } from 'react';
import { Copy, MessageCircle, Share2 } from 'lucide-react';
import { toast } from '@/lib/toast';

/** Public website base URL - what clients receive in a shared link. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5173').replace(/\/$/, '');

/** Public listing page for a property code, e.g. https://site/properties/PR-0001. */
export function propertyPublicUrl(code: string) {
  return `${SITE_URL}/properties/${encodeURIComponent(code)}`;
}

/**
 * Share a property's public link via WhatsApp or copy-to-clipboard. `onShared`
 * fires after a successful share action (used to flip a match's status to SHARED).
 */
export function ShareButton({
  code,
  title,
  onShared,
}: {
  code: string;
  title?: string;
  onShared?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const url = propertyPublicUrl(code);
  const message = title ? `${title}\n${url}` : url;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    onShared?.();
    setOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
      onShared?.();
    } catch {
      toast.error('Could not copy the link');
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
        title="Share this property"
      >
        <Share2 className="h-3.5 w-3.5" /> Share
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={shareWhatsApp}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <Copy className="h-4 w-4 text-gray-500" /> Copy link
            </button>
          </div>
        </>
      )}
    </div>
  );
}
