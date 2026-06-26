'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, req } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button, Input, Modal, PageHeader, Select, StatusBadge, Table } from '@/components/ui';
import { ContactModal } from '@/components/contact-modal';

const CONTACT_TYPES = ['', 'OWNER', 'BUYER', 'TENANT', 'LANDLORD', 'INVESTOR'] as const;
const SOURCES = ['', 'WEBSITE', 'REFERRAL', 'WALK_IN', 'PHONE', 'SOCIAL', 'OTHER'] as const;
const PAGE_SIZE = 20;

type Row = {
  id: string;
  code: string;
  fullName: string;
  contactType: string;
  source: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading…</div>}>
      <ContactsInner />
    </Suspense>
  );
}

function ContactsInner() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; row: Row } | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  // URL is the source of truth for filters/sort/page, so views are shareable.
  const search = sp.get('search') ?? '';
  const contactType = sp.get('contactType') ?? '';
  const source = sp.get('source') ?? '';
  const sort = sp.get('sort') ?? '';
  const order = (sp.get('order') as 'ASC' | 'DESC') ?? 'ASC';
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1);
  const anyFilter = !!(search || contactType || source);

  function setParams(patch: Record<string, string | number | undefined>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, val] of Object.entries(patch)) {
      if (val === undefined || val === '') next.delete(k);
      else next.set(k, String(val));
    }
    if (!('page' in patch)) next.delete('page');
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  // Debounce the search box so we don't fire a request on every keystroke.
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) setParams({ search: searchInput });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function clearAll() {
    setSearchInput('');
    router.replace(pathname, { scroll: false });
  }

  function toggleSort(col: string) {
    if (sort !== col) setParams({ sort: col, order: 'ASC', page });
    else setParams({ sort: col, order: order === 'ASC' ? 'DESC' : 'ASC', page });
  }

  const { data, isFetching } = useQuery({
    queryKey: ['contacts', { search, contactType, source, sort, order, page }],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await api.GET('/api/contacts', {
          params: {
            query: {
              page,
              limit: PAGE_SIZE,
              ...(search ? { search } : {}),
              ...(contactType ? { contactType: contactType as 'OWNER' } : {}),
              ...(source ? { source: source as 'WEBSITE' } : {}),
              ...(sort ? { sort, order } : {}),
            },
          },
        })
      ).data,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['contacts'] });

  const save = useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: any }) =>
      id ? req(api.PATCH('/api/contacts/{id}', { params: { path: { id } }, body })) : req(api.POST('/api/contacts', { body })),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['contacts-options'] });
      setModal(null);
      toast.success('Contact saved');
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => req(api.DELETE('/api/contacts/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['contacts-options'] });
      setDeleting(null);
      toast.success('Contact deleted');
    },
  });

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="p-8">
      <PageHeader
        title="Contacts"
        subtitle={`${data?.meta.total ?? 0} people`}
        action={
          <Button onClick={() => setModal({ mode: 'create' })}>
            <Plus className="h-4 w-4" /> New contact
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, email, phone…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-72"
        />
        <Select value={contactType} onChange={(e) => setParams({ contactType: e.target.value })} className="w-44">
          {CONTACT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t ? typeLabel(t) : 'All types'}
            </option>
          ))}
        </Select>
        <Select value={source} onChange={(e) => setParams({ source: e.target.value })} className="w-44">
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s ? typeLabel(s) : 'All sources'}
            </option>
          ))}
        </Select>
        {anyFilter && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear filters
          </Button>
        )}
      </div>

      <Table
        head={
          <tr>
            <th className="px-4 py-3">
              <SortHeader label="Code" col="code" sort={sort} order={order} onSort={toggleSort} />
            </th>
            <th className="px-4 py-3">
              <SortHeader label="Name" col="fullName" sort={sort} order={order} onSort={toggleSort} />
            </th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3"></th>
          </tr>
        }
      >
        {data?.data.map((c) => (
          <tr key={c.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-mono text-xs text-gray-500">
              <Link href={`/contacts/${c.id}`} className="hover:text-brand">
                {c.code}
              </Link>
            </td>
            <td className="px-4 py-3 font-medium text-gray-800">
              <Link href={`/contacts/${c.id}`} className="hover:text-brand">
                {c.fullName}
              </Link>
            </td>
            <td className="px-4 py-3">
              <StatusBadge value={c.contactType} />
            </td>
            <td className="px-4 py-3 text-gray-600">
              <div className="flex items-center gap-2">
                {typeLabel(c.source)}
                {(c.opportunityCount ?? 0) > 0 && (
                  <Link
                    href={`/contacts/${c.id}`}
                    className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 hover:bg-green-200"
                    title="Submitted a property request — has a linked opportunity"
                  >
                    Request{(c.opportunityCount ?? 0) > 1 ? ` ×${c.opportunityCount}` : ''}
                  </Link>
                )}
              </div>
            </td>
            <td className="px-4 py-3 text-gray-600">
              {c.phone ? (
                <a href={`tel:${c.phone}`} className="hover:text-brand">
                  {c.phone}
                </a>
              ) : (
                '—'
              )}
            </td>
            <td className="px-4 py-3 text-gray-600">
              {c.email ? (
                <a href={`mailto:${c.email}`} className="hover:text-brand">
                  {c.email}
                </a>
              ) : (
                '—'
              )}
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setModal({ mode: 'edit', row: c as Row })}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    remove.reset();
                    setDeleting(c as Row);
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
            <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
              {isFetching ? (
                'Loading…'
              ) : anyFilter ? (
                <span>
                  No contacts match these filters.{' '}
                  <button onClick={clearAll} className="font-medium text-brand hover:underline">
                    Clear filters
                  </button>
                </span>
              ) : (
                <span>
                  No contacts yet.{' '}
                  <button onClick={() => setModal({ mode: 'create' })} className="font-medium text-brand hover:underline">
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
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.meta.total)} of {data.meta.total}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setParams({ page: page - 1 })}>
                Prev
              </Button>
              <span className="px-2 text-gray-500">
                Page {page} of {totalPages}
              </span>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setParams({ page: page + 1 })}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {modal && (
        <ContactModal
          row={modal.mode === 'edit' ? modal.row : undefined}
          onClose={() => setModal(null)}
          onSubmit={(body) => save.mutate({ id: modal.mode === 'edit' ? modal.row.id : undefined, body })}
          pending={save.isPending}
        />
      )}

      <Modal
        open={!!deleting}
        onClose={() => {
          setDeleting(null);
          remove.reset();
        }}
        title="Delete contact"
      >
        {deleting && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <span className="font-medium text-gray-800">{deleting.fullName}</span> ({deleting.code})? This action
              cannot be undone.
            </p>
            {remove.isError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{deleteErrorMessage(remove.error)}</div>
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
}: {
  label: string;
  col: string;
  sort: string;
  order: 'ASC' | 'DESC';
  onSort: (col: string) => void;
}) {
  const active = sort === col;
  const Icon = !active ? ArrowUpDown : order === 'ASC' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className={`inline-flex items-center gap-1 transition hover:text-gray-700 ${active ? 'text-gray-700' : ''}`}
      title={`Sort by ${label.toLowerCase()}`}
    >
      {label}
      <Icon className={`h-3.5 w-3.5 ${active ? 'text-brand' : 'text-gray-300'}`} />
    </button>
  );
}

/** Turn a delete API error into a human-readable reason for the modal. */
function deleteErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  if (e?.code === 'fk_violation') {
    return 'This contact can’t be deleted because they’re linked to properties, agreements, deals, or other records. Remove those links first.';
  }
  return e?.message || 'Something went wrong while deleting. Please try again.';
}

/** "WALK_IN" → "Walk in" for display. */
function typeLabel(v: string) {
  return v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, ' ');
}
