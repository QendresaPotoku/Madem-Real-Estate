'use client';

import { Suspense, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, req, tx } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAgents, useContacts, useOpportunities, useProperties } from '@/lib/queries';
import { Badge, Button, Field, Input, Modal, PageHeader, Select, StatusBadge, Table } from '@/components/ui';

const STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
const STATUS_FILTERS = ['', ...STATUSES] as const;
const PAGE_SIZE = 20;

type Row = {
  id: string;
  propertyId: string;
  opportunityId: string | null;
  contactId: string | null;
  agentUserId: string | null;
  scheduledAt: string;
  status: string;
  feedback: string | null;
};

export default function ViewingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading…</div>}>
      <ViewingsInner />
    </Suspense>
  );
}

function ViewingsInner() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; row: Row } | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const props = useProperties();
  const agents = useAgents();
  const contacts = useContacts();
  const opps = useOpportunities();
  const propLabel = (id: string) => {
    const p = props.data?.find((x) => x.id === id);
    return p ? `${p.propertyCode} · ${tx(p.titleJson)}` : id.slice(0, 8);
  };
  const agentName = (id: string | null) => (id ? agents.data?.find((a) => a.id === id)?.fullName ?? '—' : '—');
  const contactName = (id: string | null) => (id ? contacts.data?.find((c) => c.id === id)?.fullName ?? '—' : '—');
  const oppCode = (id: string | null) => (id ? opps.data?.find((o) => o.id === id)?.code ?? '—' : '—');

  // URL is the source of truth for filters/sort/page, so views are shareable.
  const status = sp.get('status') ?? '';
  const agentUserId = sp.get('agentUserId') ?? '';
  const sort = sp.get('sort') ?? '';
  const order = (sp.get('order') as 'ASC' | 'DESC') ?? 'DESC';
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1);
  const anyFilter = !!(status || agentUserId);

  function setParams(patch: Record<string, string | number | undefined>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, val] of Object.entries(patch)) {
      if (val === undefined || val === '') next.delete(k);
      else next.set(k, String(val));
    }
    if (!('page' in patch)) next.delete('page');
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function toggleSort(col: string) {
    if (sort !== col) setParams({ sort: col, order: 'DESC', page });
    else setParams({ sort: col, order: order === 'DESC' ? 'ASC' : 'DESC', page });
  }

  const { data, isFetching } = useQuery({
    queryKey: ['viewings', { status, agentUserId, sort, order, page }],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await api.GET('/api/viewings', {
          params: {
            query: {
              page,
              limit: PAGE_SIZE,
              ...(status ? { status: status as 'SCHEDULED' } : {}),
              ...(agentUserId ? { agentUserId } : {}),
              ...(sort ? { sort, order } : {}),
            },
          },
        })
      ).data,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['viewings'] });

  const save = useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: any }) =>
      id ? req(api.PATCH('/api/viewings/{id}', { params: { path: { id } }, body })) : req(api.POST('/api/viewings', { body })),
    onSuccess: () => {
      invalidate();
      setModal(null);
      toast.success('Viewing saved');
    },
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      req(api.PATCH('/api/viewings/{id}', { params: { path: { id } }, body: { status: status as 'COMPLETED' } })),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => req(api.DELETE('/api/viewings/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast.success('Viewing deleted');
    },
  });

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="p-8">
      <PageHeader
        title="Viewings"
        subtitle={`${data?.meta.total ?? 0} scheduled visits`}
        action={
          <Button onClick={() => setModal({ mode: 'create' })}>
            <Plus className="h-4 w-4" /> Schedule viewing
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={status} onChange={(e) => setParams({ status: e.target.value })} className="w-44">
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s ? statusLabel(s) : 'All statuses'}
            </option>
          ))}
        </Select>
        <Select value={agentUserId} onChange={(e) => setParams({ agentUserId: e.target.value })} className="w-52">
          <option value="">All agents</option>
          {agents.data?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.fullName}
            </option>
          ))}
        </Select>
        {anyFilter && (
          <Button variant="ghost" size="sm" onClick={() => router.replace(pathname, { scroll: false })}>
            Clear filters
          </Button>
        )}
      </div>

      <Table
        head={
          <tr>
            <th className="px-4 py-3">
              <SortHeader label="When" col="scheduledAt" sort={sort} order={order} onSort={toggleSort} />
            </th>
            <th className="px-4 py-3">Property</th>
            <th className="px-4 py-3">Attendee</th>
            <th className="px-4 py-3">Agent</th>
            <th className="px-4 py-3">Opportunity</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Feedback</th>
            <th className="px-4 py-3"></th>
          </tr>
        }
      >
        {data?.data.map((v) => (
          <tr key={v.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 whitespace-nowrap text-gray-700">
              <div className="flex items-center gap-2">
                {formatWhen(v.scheduledAt)}
                {isUpcoming(v.scheduledAt) && v.status === 'SCHEDULED' && <Badge className="bg-blue-100 text-blue-700">Upcoming</Badge>}
              </div>
            </td>
            <td className="px-4 py-3 text-gray-600">{propLabel(v.propertyId)}</td>
            <td className="px-4 py-3 text-gray-600">{contactName(v.contactId)}</td>
            <td className="px-4 py-3 text-gray-600">{agentName(v.agentUserId)}</td>
            <td className="px-4 py-3 font-mono text-xs text-gray-500">{oppCode(v.opportunityId)}</td>
            <td className="px-4 py-3">
              <Select value={v.status} onChange={(e) => setStatus.mutate({ id: v.id, status: e.target.value })} className="w-36 py-1 text-xs">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </Select>
            </td>
            <td className="max-w-48 truncate px-4 py-3 text-gray-500" title={v.feedback ?? ''}>
              {v.feedback ?? '—'}
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setModal({ mode: 'edit', row: v as Row })}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    remove.reset();
                    setDeleting(v as Row);
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
            <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
              {isFetching ? (
                'Loading…'
              ) : anyFilter ? (
                <span>
                  No viewings match these filters.{' '}
                  <button onClick={() => router.replace(pathname, { scroll: false })} className="font-medium text-brand hover:underline">
                    Clear filters
                  </button>
                </span>
              ) : (
                <span>
                  No viewings yet.{' '}
                  <button onClick={() => setModal({ mode: 'create' })} className="font-medium text-brand hover:underline">
                    Schedule the first one
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
        <ViewingModal
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
        title="Delete viewing"
      >
        {deleting && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete the viewing on{' '}
              <span className="font-medium text-gray-800">{formatWhen(deleting.scheduledAt)}</span> for {propLabel(deleting.propertyId)}? This action
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

function ViewingModal({ row, onClose, onSubmit, pending }: { row?: Row; onClose: () => void; onSubmit: (b: any) => void; pending: boolean }) {
  const props = useProperties();
  const opps = useOpportunities();
  const contacts = useContacts();
  const agents = useAgents();
  const [f, setF] = useState({
    propertyId: row?.propertyId ?? '',
    opportunityId: row?.opportunityId ?? '',
    contactId: row?.contactId ?? '',
    agentUserId: row?.agentUserId ?? '',
    scheduledAt: row?.scheduledAt ? toLocalInput(row.scheduledAt) : '',
    feedback: row?.feedback ?? '',
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  return (
    <Modal open onClose={onClose} title={row ? 'Edit viewing' : 'Schedule viewing'}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            propertyId: f.propertyId,
            opportunityId: f.opportunityId || undefined,
            contactId: f.contactId || undefined,
            agentUserId: f.agentUserId || undefined,
            scheduledAt: new Date(f.scheduledAt).toISOString(),
            feedback: f.feedback || undefined,
          });
        }}
        className="space-y-4"
      >
        <Field label="Property">
          <Select value={f.propertyId} onChange={(e) => set('propertyId', e.target.value)} required>
            <option value="">Select property…</option>
            {props.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.propertyCode} · {tx(p.titleJson)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Opportunity (optional)">
            <Select value={f.opportunityId} onChange={(e) => set('opportunityId', e.target.value)}>
              <option value="">—</option>
              {opps.data?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Attendee (optional)">
            <Select value={f.contactId} onChange={(e) => set('contactId', e.target.value)}>
              <option value="">—</option>
              {contacts.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Agent (optional)">
            <Select value={f.agentUserId} onChange={(e) => set('agentUserId', e.target.value)}>
              <option value="">—</option>
              {agents.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="When">
            <Input type="datetime-local" value={f.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} required />
          </Field>
        </div>
        <Field label="Feedback">
          <Input value={f.feedback} onChange={(e) => set('feedback', e.target.value)} placeholder="Notes after the visit…" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : row ? 'Save changes' : 'Schedule'}
          </Button>
        </div>
      </form>
    </Modal>
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
    return 'This viewing can’t be deleted because it’s linked to other records. Remove those links first.';
  }
  return e?.message || 'Something went wrong while deleting. Please try again.';
}

/** "NO_SHOW" → "No show" for display. */
function statusLabel(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Whether a scheduled time is in the future. */
function isUpcoming(value: string) {
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
}

/** Friendly date-time for the list (e.g. "18 Jun 2026, 14:30"). */
function formatWhen(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** ISO timestamp → value for a <input type="datetime-local"> in local time. */
function toLocalInput(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
