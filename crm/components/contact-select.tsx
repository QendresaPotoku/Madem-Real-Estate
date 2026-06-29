'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ContactOption = {
  id: string;
  fullName: string;
  phone?: string | null;
  contactType?: string | null;
};

/** Small searchable dropdown for picking a contact. Shows the phone (and type) in a
 *  smaller font next to the name so same-named people can be told apart, and filters
 *  by name OR phone as you type — something a native <select> can't do. */
export function ContactSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
}: {
  value: string;
  onChange: (id: string) => void;
  options: ContactOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selected = options.find((o) => o.id === value);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((o) => o.fullName.toLowerCase().includes(q) || (o.phone ?? '').toLowerCase().includes(q))
    : options;

  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  const subtitle = (o: ContactOption) => [o.phone, o.contactType].filter(Boolean).join(' · ');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      >
        <span className="flex items-baseline gap-2 truncate">
          {selected ? (
            <>
              <span className="truncate text-gray-800">{selected.fullName}</span>
              {subtitle(selected) && <span className="shrink-0 text-xs text-gray-400">{subtitle(selected)}</span>}
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or phone…"
              className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto pb-1 text-sm">
            <li>
              <button type="button" onClick={() => choose('')} className="w-full px-3 py-2 text-left text-gray-400 hover:bg-gray-50">
                —
              </button>
            </li>
            {filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => choose(o.id)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50"
                >
                  <span className="flex items-baseline gap-2 truncate">
                    <span className="truncate text-gray-800">{o.fullName}</span>
                    {subtitle(o) && <span className="shrink-0 text-xs text-gray-400">{subtitle(o)}</span>}
                  </span>
                  {o.id === value && <Check className="h-4 w-4 shrink-0 text-brand" />}
                </button>
              </li>
            ))}
            {!filtered.length && <li className="px-3 py-3 text-center text-gray-400">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
