'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, tx } from '@/lib/api';
import { useAgents, useContacts, useLocationLookups } from '@/lib/queries';
import { Badge, Button, Input, Modal, PageHeader, Select, StatusBadge, Table } from '@/components/ui';
import { PropertyForm, fromProperty, toPropertyBody, type PropertyFormValues } from '@/components/property-form';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  RESERVED: 'bg-amber-100 text-amber-700',
  SOLD: 'bg-blue-100 text-blue-700',
  RENTED: 'bg-purple-100 text-purple-700',
  ARCHIVED: 'bg-gray-100 text-gray-400',
};
const STATUSES = ['', 'ACTIVE', 'DRAFT', 'RESERVED', 'SOLD', 'RENTED', 'ARCHIVED'] as const;
const LISTING_TYPES = ['', 'SALE', 'RENT'] as const;
const PROPERTY_TYPES = ['', 'APARTMENT', 'HOUSE', 'VILLA', 'LAND', 'OFFICE', 'SHOP', 'WAREHOUSE', 'BUILDING'] as const;

type PropertyRow = NonNullable<NonNullable<ReturnType<typeof usePropertiesQuery>['data']>['data']>[number];

type PropertyFilters = {
  search: string;
  status: string;
  listingType: string;
  propertyType: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  order: 'ASC' | 'DESC';
  page: number;
};

function usePropertiesQuery(f: PropertyFilters) {
  return useQuery({
    queryKey: ['properties', f],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await api.GET('/api/properties', {
          params: {
            query: {
              page: f.page,
              limit: 20,
              ...(f.search ? { search: f.search } : {}),
              ...(f.status ? { status: f.status as 'ACTIVE' } : {}),
              ...(f.listingType ? { listingType: f.listingType as 'SALE' } : {}),
              ...(f.propertyType ? { propertyType: f.propertyType as 'APARTMENT' } : {}),
              ...(f.city ? { city: f.city } : {}),
              ...(f.minPrice ? { minPrice: Number(f.minPrice) } : {}),
              ...(f.maxPrice ? { maxPrice: Number(f.maxPrice) } : {}),
              ...(f.sort ? { sort: f.sort, order: f.order } : {}),
            },
          },
        })
      ).data,
  });
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading…</div>}>
      <PropertiesPageInner />
    </Suspense>
  );
}

function PropertiesPageInner() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyRow | null>(null);
  const [deleting, setDeleting] = useState<PropertyRow | null>(null);

  // URL is the single source of truth for filters/sort/page, so views are
  // shareable and survive refresh / back-navigation from a detail page.
  const filters: PropertyFilters = {
    search: sp.get('search') ?? '',
    status: sp.get('status') ?? '',
    listingType: sp.get('listingType') ?? '',
    propertyType: sp.get('propertyType') ?? '',
    city: sp.get('city') ?? '',
    minPrice: sp.get('minPrice') ?? '',
    maxPrice: sp.get('maxPrice') ?? '',
    sort: sp.get('sort') ?? '',
    order: (sp.get('order') as 'ASC' | 'DESC') ?? 'DESC',
    page: Math.max(1, Number(sp.get('page') ?? '1') || 1),
  };

  /** Patch URL params; clearing a value drops the key and resets to page 1. */
  function setParams(patch: Record<string, string | number | undefined>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, val] of Object.entries(patch)) {
      if (val === undefined || val === '') next.delete(k);
      else next.set(k, String(val));
    }
    if (!('page' in patch)) next.delete('page');
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  // Debounce the free-text inputs (search + price range) so we don't fire a
  // request and push a history entry on every keystroke.
  const [searchInput, setSearchInput] = useState(filters.search);
  const [minInput, setMinInput] = useState(filters.minPrice);
  const [maxInput, setMaxInput] = useState(filters.maxPrice);
  useEffect(() => {
    const t = setTimeout(() => {
      const patch: Record<string, string> = {};
      if (searchInput !== filters.search) patch.search = searchInput;
      if (minInput !== filters.minPrice) patch.minPrice = minInput;
      if (maxInput !== filters.maxPrice) patch.maxPrice = maxInput;
      if (Object.keys(patch).length) setParams(patch);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, minInput, maxInput]);

  /** Reset every filter — clears both the URL and the local debounced inputs. */
  function clearAll() {
    setSearchInput('');
    setMinInput('');
    setMaxInput('');
    router.replace(pathname, { scroll: false });
  }

  function toggleSort(col: string) {
    if (filters.sort !== col) setParams({ sort: col, order: 'DESC', page: filters.page });
    else setParams({ sort: col, order: filters.order === 'DESC' ? 'ASC' : 'DESC', page: filters.page });
  }

  const { data, isFetching } = usePropertiesQuery(filters);
  const page = filters.page;
  const setPage = (n: number) => setParams({ page: n });

  // Resolve agent/owner names client-side (the property payload carries only IDs).
  const agents = useAgents();
  const owners = useContacts('OWNER');
  const locations = useLocationLookups();
  const cityNames = useMemo(
    () => Array.from(new Set(locations.data?.cities.map((c) => c.name) ?? [])).sort((a, b) => a.localeCompare(b)),
    [locations.data],
  );
  const anyFilter = !!(
    filters.status ||
    filters.listingType ||
    filters.propertyType ||
    filters.city ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.search
  );
  const agentName = (id?: string | null) => agents.data?.find((a) => a.id === id)?.fullName ?? '—';
  const ownerName = (id?: string | null) => owners.data?.find((o) => o.id === id)?.fullName ?? '—';

  // Draft count for the quick-filter chip (independent of the active filters).
  const { data: draftMeta } = useQuery({
    queryKey: ['properties-draft-count'],
    queryFn: async () => (await api.GET('/api/properties', { params: { query: { status: 'DRAFT', limit: 1 } } })).data?.meta,
  });
  const draftCount = draftMeta?.total ?? 0;

  const create = useMutation({
    mutationFn: async (v: PropertyFormValues) => {
      const { data, error } = await api.POST('/api/properties', { body: toPropertyBody(v) });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['properties-draft-count'] });
      setOpen(false);
    },
  });

  const update = useMutation({
    mutationFn: async (v: PropertyFormValues) => {
      if (!editing) return;
      const { data, error } = await api.PATCH('/api/properties/{id}', { params: { path: { id: editing.id } }, body: toPropertyBody(v) });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['properties-draft-count'] });
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/api/properties/{id}', { params: { path: { id } } });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['properties-draft-count'] });
      setDeleting(null);
    },
  });

  return (
    <div className="p-8">
      <PageHeader
        title="Properties"
        subtitle={`${data?.meta.total ?? 0} listings`}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New property
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search title, city, area…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-72"
        />
        <Select value={filters.status} onChange={(e) => setParams({ status: e.target.value })} className="w-40">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s || 'All statuses'}
            </option>
          ))}
        </Select>
        <Select value={filters.listingType} onChange={(e) => setParams({ listingType: e.target.value })} className="w-36">
          {LISTING_TYPES.map((s) => (
            <option key={s} value={s}>
              {s || 'Sale & rent'}
            </option>
          ))}
        </Select>
        <Select value={filters.propertyType} onChange={(e) => setParams({ propertyType: e.target.value })} className="w-40">
          {PROPERTY_TYPES.map((s) => (
            <option key={s} value={s}>
              {s ? s.charAt(0) + s.slice(1).toLowerCase() : 'All types'}
            </option>
          ))}
        </Select>
        <Select value={filters.city} onChange={(e) => setParams({ city: e.target.value })} className="w-40">
          <option value="">All cities</option>
          {cityNames.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Input
          type="number"
          placeholder="Min €"
          value={minInput}
          onChange={(e) => setMinInput(e.target.value)}
          className="w-24"
        />
        <Input
          type="number"
          placeholder="Max €"
          value={maxInput}
          onChange={(e) => setMaxInput(e.target.value)}
          className="w-24"
        />
        {draftCount > 0 && (
          <button
            type="button"
            onClick={() => setParams({ status: filters.status === 'DRAFT' ? '' : 'DRAFT' })}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              filters.status === 'DRAFT'
                ? 'border-amber-300 bg-amber-100 text-amber-800'
                : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
            title="Show only draft properties"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {draftCount} draft{draftCount === 1 ? '' : 's'}
          </button>
        )}
        {anyFilter && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear filters
          </Button>
        )}
      </div>

      <Table
        head={
          <tr>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Listing</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">City</th>
            <th className="px-4 py-3">Agent</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3 text-right">
              <SortHeader label="Price" col="price" sort={filters.sort} order={filters.order} onSort={toggleSort} align="right" />
            </th>
            <th className="px-4 py-3">
              <SortHeader label="Updated" col="updatedAt" sort={filters.sort} order={filters.order} onSort={toggleSort} />
            </th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        }
      >
        {data?.data.map((p) => (
          <tr
            key={p.id}
            onClick={() => router.push(`/properties/${p.id}`)}
            className={`cursor-pointer hover:bg-gray-50 ${p.status === 'DRAFT' ? 'bg-amber-50/40' : ''}`}
          >
            <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.propertyCode}</td>
            <td className="px-4 py-3 font-medium text-gray-800">{tx(p.titleJson)}</td>
            <td className="px-4 py-3 text-gray-600">{typeLabel(p.propertyType)}</td>
            <td className="px-4 py-3">
              <Badge className={p.listingType === 'RENT' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}>
                {p.listingType}
              </Badge>
            </td>
            <td className="px-4 py-3">
              <StatusBadge value={p.status} map={STATUS_STYLES} />
            </td>
            <td className="px-4 py-3 text-gray-600">{p.city}</td>
            <td className="px-4 py-3 text-gray-600">{agentName(p.agentUserId)}</td>
            <td className="px-4 py-3 text-gray-600">{ownerName(p.ownerContactId)}</td>
            <td className="px-4 py-3 text-right font-medium text-brand">
              {p.price.toLocaleString()} {p.currency}
              {p.listingType === 'RENT' && <span className="font-normal text-gray-400">/month</span>}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{formatDate(p.updatedAt)}</td>
            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-end gap-1">
                <Link
                  href={`/properties/${p.id}`}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand"
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => setEditing(p)}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    remove.reset();
                    setDeleting(p);
                  }}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
        {!data?.data.length && (
          <tr>
            <td colSpan={11} className="px-4 py-12 text-center text-sm text-gray-400">
              {isFetching ? (
                'Loading…'
              ) : anyFilter ? (
                <span>
                  No properties match these filters.{' '}
                  <button onClick={clearAll} className="font-medium text-brand hover:underline">
                    Clear filters
                  </button>
                </span>
              ) : (
                <span>
                  No properties yet.{' '}
                  <button onClick={() => setOpen(true)} className="font-medium text-brand hover:underline">
                    Create the first one
                  </button>
                </span>
              )}
            </td>
          </tr>
        )}
      </Table>

      {data && data.meta.total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-gray-500">
            Showing {(data.meta.page - 1) * data.meta.limit + 1}–
            {Math.min(data.meta.page * data.meta.limit, data.meta.total)} of {data.meta.total}
          </span>
          {data.meta.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Prev
              </Button>
              {pageNumbers(data.meta.page, data.meta.totalPages).map((n, i) =>
                n === '…' ? (
                  <span key={`gap-${i}`} className="px-2 text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`min-w-8 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                      n === data.meta.page ? 'bg-brand text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}
              <Button variant="secondary" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New property" wide>
        <PropertyForm onSubmit={(v) => create.mutate(v)} onCancel={() => setOpen(false)} pending={create.isPending} submitLabel="Create property" />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Edit ${editing.propertyCode}` : 'Edit property'} wide>
        {editing && (
          <PropertyForm
            initial={fromProperty(editing)}
            onSubmit={(v) => update.mutate(v)}
            onCancel={() => setEditing(null)}
            pending={update.isPending}
            submitLabel="Save changes"
          />
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => {
          setDeleting(null);
          remove.reset();
        }}
        title="Delete property"
      >
        {deleting && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-800">
                {deleting.propertyCode} — {tx(deleting.titleJson)}
              </span>
              ? This action cannot be undone.
            </p>
            {remove.isError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {deleteErrorMessage(remove.error)}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleting(null);
                  remove.reset();
                }}
                disabled={remove.isPending}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={() => remove.mutate(deleting.id)} disabled={remove.isPending}>
                {remove.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/** A clickable column header that drives the list's sort/order. */
function SortHeader({
  label,
  col,
  sort,
  order,
  onSort,
  align,
}: {
  label: string;
  col: string;
  sort: string;
  order: 'ASC' | 'DESC';
  onSort: (col: string) => void;
  align?: 'right';
}) {
  const active = sort === col;
  const Icon = !active ? ArrowUpDown : order === 'ASC' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className={`inline-flex items-center gap-1 transition hover:text-gray-700 ${active ? 'text-gray-700' : ''} ${
        align === 'right' ? 'flex-row-reverse' : ''
      }`}
      title={`Sort by ${label.toLowerCase()}`}
    >
      {label}
      <Icon className={`h-3.5 w-3.5 ${active ? 'text-brand' : 'text-gray-300'}`} />
    </button>
  );
}

/**
 * Build a compact list of page numbers with ellipses, e.g. [1, '…', 4, 5, 6, '…', 12].
 * Always shows first/last, the current page, and one neighbour on each side.
 */
function pageNumbers(current: number, total: number): (number | '…')[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push('…');
    out.push(n);
    prev = n;
  }
  return out;
}

/** Turn a delete API error into a human-readable reason for the modal. */
function deleteErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  if (e?.code === 'fk_violation') {
    return 'This property can’t be deleted because it has linked records — agreements, offers, deals, viewings, or contracts. Remove or archive those first.';
  }
  return e?.message || 'Something went wrong while deleting. Please try again.';
}

/** "APARTMENT" → "Apartment" for display. */
function typeLabel(t: string) {
  return t.charAt(0) + t.slice(1).toLowerCase();
}

/** Short, locale-friendly date for the list (e.g. "18 Jun 2026"). */
function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}
