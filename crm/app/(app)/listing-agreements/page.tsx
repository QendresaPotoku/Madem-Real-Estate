'use client';

import { Suspense, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, req, tx } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAgents, useContacts, useProperties } from '@/lib/queries';
import { Badge, Button, Field, Input, Modal, PageHeader, Select, StatusBadge, Table } from '@/components/ui';

const TYPES = ['OPEN', 'EXCLUSIVE'] as const;
const STATUSES = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED'] as const;
const STATUS_FILTERS = ['', 'DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED'] as const;

/** Whole-day difference between an end date (YYYY-MM-DD) and today, in the local zone. */
function daysUntil(endDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

/** Urgency badge for an agreement's end date. */
function ExpiryBadge({ endDate }: { endDate: string | null }) {
  if (!endDate) return <span className="text-xs text-gray-400">No end date</span>;
  const days = daysUntil(endDate);
  if (days < 0) return <Badge className="bg-gray-100 text-gray-500">Expired</Badge>;
  if (days === 0) return <Badge className="bg-red-100 text-red-700">Expires today</Badge>;
  const cls = days <= 7 ? 'bg-red-100 text-red-700' : days <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
  return <Badge className={cls}>Expires in {days} day{days === 1 ? '' : 's'}</Badge>;
}

type Row = { id: string; code: string; propertyId: string; ownerContactId: string; agentUserId: string; agreementType: string; startDate: string; endDate: string | null; commissionPercentage: number | null; status: string };

const PAGE_SIZE = 20;
const EXPIRING_DAYS = 30;

export default function ListingAgreementsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading…</div>}>
      <ListingAgreementsInner />
    </Suspense>
  );
}

function ListingAgreementsInner() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; row: Row } | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const props = useProperties();
  const agents = useAgents();
  const owners = useContacts('OWNER');
  const propLabel = (id: string) => props.data?.find((x) => x.id === id)?.propertyCode ?? id.slice(0, 8);
  const agentName = (id: string) => agents.data?.find((a) => a.id === id)?.fullName ?? '—';
  const ownerName = (id: string) => owners.data?.find((o) => o.id === id)?.fullName ?? '—';

  // URL is the source of truth for filters/page, so views are shareable.
  const status = sp.get('status') ?? '';
  const agentUserId = sp.get('agentUserId') ?? '';
  const expiring = sp.get('expiring') === '1';
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1);
  const anyFilter = !!(status || agentUserId || expiring);

  function setParams(patch: Record<string, string | number | undefined>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, val] of Object.entries(patch)) {
      if (val === undefined || val === '') next.delete(k);
      else next.set(k, String(val));
    }
    if (!('page' in patch)) next.delete('page');
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const { data, isFetching } = useQuery({
    queryKey: ['listing-agreements', { status, agentUserId, expiring, page }],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await api.GET('/api/listing-agreements', {
          params: {
            query: {
              page,
              limit: PAGE_SIZE,
              ...(status ? { status: status as 'ACTIVE' } : {}),
              ...(agentUserId ? { agentUserId } : {}),
              ...(expiring ? { expiringInDays: EXPIRING_DAYS, sort: 'endDate', order: 'ASC' as const } : {}),
            },
          },
        })
      ).data,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['listing-agreements'] });

  const save = useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: any }) =>
      id
        ? req(api.PATCH('/api/listing-agreements/{id}', { params: { path: { id } }, body }))
        : req(api.POST('/api/listing-agreements', { body })),
    onSuccess: () => {
      invalidate();
      setModal(null);
      toast.success('Agreement saved');
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => req(api.DELETE('/api/listing-agreements/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast.success('Agreement deleted');
    },
  });

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="p-8">
      <PageHeader
        title="Listing agreements"
        subtitle={`${data?.meta.total ?? 0} mandates`}
        action={
          <Button onClick={() => setModal({ mode: 'create' })}>
            <Plus className="h-4 w-4" /> New agreement
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={status} onChange={(e) => setParams({ status: e.target.value })} className="w-44">
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s || 'All statuses'}
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
        <button
          type="button"
          onClick={() => setParams({ expiring: expiring ? '' : '1' })}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            expiring
              ? 'border-amber-300 bg-amber-100 text-amber-800'
              : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
          title={`Active agreements ending within ${EXPIRING_DAYS} days`}
        >
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Expiring soon
        </button>
        {anyFilter && (
          <Button variant="ghost" size="sm" onClick={() => router.replace(pathname, { scroll: false })}>
            Clear filters
          </Button>
        )}
      </div>

      <Table
        head={
          <tr>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Property</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Agent</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Period</th>
            <th className="px-4 py-3">Expiry</th>
            <th className="px-4 py-3 text-right">Commission</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        }
      >
        {data?.data.map((a) => (
          <tr key={a.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.code}</td>
            <td className="px-4 py-3 font-mono text-xs text-gray-500">{propLabel(a.propertyId)}</td>
            <td className="px-4 py-3 text-gray-600">{ownerName(a.ownerContactId)}</td>
            <td className="px-4 py-3 text-gray-600">{agentName(a.agentUserId)}</td>
            <td className="px-4 py-3">
              <StatusBadge value={a.agreementType} />
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-gray-600">
              {formatDate(a.startDate)}
              {a.endDate ? ` → ${formatDate(a.endDate)}` : ''}
            </td>
            <td className="px-4 py-3">
              <ExpiryBadge endDate={a.endDate} />
            </td>
            <td className="px-4 py-3 text-right text-gray-600">{a.commissionPercentage != null ? `${a.commissionPercentage}%` : '—'}</td>
            <td className="px-4 py-3">
              <StatusBadge value={a.status} />
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setModal({ mode: 'edit', row: a as Row })}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    remove.reset();
                    setDeleting(a as Row);
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
            <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
              {isFetching ? (
                'Loading…'
              ) : anyFilter ? (
                <span>
                  No agreements match these filters.{' '}
                  <button onClick={() => router.replace(pathname, { scroll: false })} className="font-medium text-brand hover:underline">
                    Clear filters
                  </button>
                </span>
              ) : (
                <span>
                  No agreements yet.{' '}
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
        <AgreementModal
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
        title="Delete agreement"
      >
        {deleting && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete agreement <span className="font-medium text-gray-800">{deleting.code}</span>? This action cannot be
              undone.
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

/** Turn a delete API error into a human-readable reason for the modal. */
function deleteErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  if (e?.code === 'fk_violation') {
    return 'This agreement can’t be deleted because it’s linked to other records. Set it to Expired or Terminated instead.';
  }
  return e?.message || 'Something went wrong while deleting. Please try again.';
}

/** Short, locale-friendly date (e.g. "18 Jun 2026"). */
function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function AgreementModal({ row, onClose, onSubmit, pending }: { row?: Row; onClose: () => void; onSubmit: (b: any) => void; pending: boolean }) {
  const props = useProperties();
  const owners = useContacts('OWNER');
  const agents = useAgents();
  const [f, setF] = useState({
    propertyId: row?.propertyId ?? '',
    ownerContactId: row?.ownerContactId ?? '',
    agentUserId: row?.agentUserId ?? '',
    agreementType: row?.agreementType ?? 'EXCLUSIVE',
    startDate: row?.startDate ?? '',
    endDate: row?.endDate ?? '',
    commissionPercentage: row?.commissionPercentage != null ? String(row.commissionPercentage) : '',
    status: row?.status ?? 'DRAFT',
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  return (
    <Modal open onClose={onClose} title={row ? `Edit ${row.code}` : 'New listing agreement'} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            propertyId: f.propertyId,
            ownerContactId: f.ownerContactId,
            agentUserId: f.agentUserId,
            agreementType: f.agreementType,
            startDate: f.startDate,
            endDate: f.endDate || undefined,
            commissionPercentage: f.commissionPercentage ? Number(f.commissionPercentage) : undefined,
            status: f.status,
          });
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
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
          <Field label="Owner">
            <Select value={f.ownerContactId} onChange={(e) => set('ownerContactId', e.target.value)} required>
              <option value="">Select owner…</option>
              {owners.data?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.fullName}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Agent">
            <Select value={f.agentUserId} onChange={(e) => set('agentUserId', e.target.value)} required>
              <option value="">Select agent…</option>
              {agents.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select value={f.agreementType} onChange={(e) => set('agreementType', e.target.value)}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Field label="Start date">
            <Input type="date" value={f.startDate} onChange={(e) => set('startDate', e.target.value)} required />
          </Field>
          <Field label="End date">
            <Input type="date" value={f.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </Field>
          <Field label="Commission %">
            <Input type="number" value={f.commissionPercentage} onChange={(e) => set('commissionPercentage', e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={f.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
