'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { api, req } from '@/lib/api';
import { Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import { ShareButton } from '@/components/share-property';

function scoreTone(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-700';
  if (score >= 60) return 'bg-amber-100 text-amber-700';
  if (score >= 40) return 'bg-orange-100 text-orange-700';
  return 'bg-gray-100 text-gray-600';
}

function budgetLabel(min: number | null, max: number | null) {
  if (min == null && max == null) return null;
  const fmt = (n: number) => `${n.toLocaleString()}`;
  if (min != null && max != null) return `${fmt(min)}–${fmt(max)} EUR`;
  if (max != null) return `up to ${fmt(max)} EUR`;
  return `from ${fmt(min!)} EUR`;
}

/** Matching opportunities for a property - shown on the property page under the media. */
export function PropertyMatches({ propertyId, propertyCode, propertyTitle }: { propertyId: string; propertyCode: string; propertyTitle?: string }) {
  const qc = useQueryClient();
  const key = ['property-matches', propertyId];
  const { data: matches, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => (await api.GET('/api/properties/{id}/matches', { params: { path: { id: propertyId } } })).data ?? [],
  });

  const setShared = useMutation({
    mutationFn: async (matchId: string) =>
      req(api.PATCH('/api/matches/{id}', { params: { path: { id: matchId } }, body: { status: 'SHARED' } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand" />
        <h3 className="text-sm font-semibold text-gray-700">Matching opportunities ({matches?.length ?? 0})</h3>
      </div>

      {isLoading ? (
        <ul className="space-y-2">
          {[0, 1].map((i) => (
            <li key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </ul>
      ) : !matches?.length ? (
        <p className="text-sm text-gray-400">
          No matching open opportunities yet. Matches appear here once a buyer/tenant request fits this listing.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {matches.map((m) => {
            const o = m.opportunity;
            const score = m.matchScore ?? 0;
            const budget = o ? budgetLabel(o.budgetMin, o.budgetMax) : null;
            return (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/opportunities?opportunityId=${m.opportunityId}`}
                      className="inline-flex items-center gap-1 font-medium text-gray-800 hover:text-brand hover:underline"
                    >
                      {o?.contactName || o?.code || 'Opportunity'}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                    </Link>
                    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', scoreTone(score))}>{score}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">{m.status}</span>
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {o?.code} · {o?.propertyType?.toLowerCase()} · {o?.listingType?.toLowerCase()}
                    {o?.city ? ` · ${o.city}` : ''}
                    {o?.area ? `, ${o.area}` : ''}
                    {budget ? ` · ${budget}` : ''}
                  </p>
                </div>
                <ShareButton code={propertyCode} title={propertyTitle} onShared={() => setShared.mutate(m.id)} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
