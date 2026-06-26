'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, Bell, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, req, tx } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAgents, useContacts, useDeals, useProperties } from '@/lib/queries';
import { Badge, Button, Field, Input, Modal, PageHeader, Select, StatusBadge, Table } from '@/components/ui';

const STATUSES = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED', 'COMPLETED'] as const;
const STATUS_FILTERS = ['', ...STATUSES] as const;
const TYPE_FILTERS = ['', 'RENTAL', 'SALE'] as const;
const PAGE_SIZE = 20;
const EXPIRING_DAYS = 30;

type Row = {
  id: string;
  code: string;
  dealId: string | null;
  propertyId: string;
  ownerContactId: string;
  counterpartyContactId: string | null;
  agentUserId: string | null;
  startDate: string;
  endDate: string | null;
  contractType: string;
  status: string;
};

/** Whole-day difference between an end date (YYYY-MM-DD) and today, in the local zone. */
function daysUntil(endDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

/** Urgency badge for a contract's end date. */
function ExpiryBadge({ endDate, status }: { endDate: string | null; status: string }) {
  if (!endDate) return <span className="text-xs text-gray-400">—</span>;
  if (['TERMINATED', 'COMPLETED', 'RENEWED'].includes(status)) return <span className="text-xs text-gray-400">—</span>;
  const days = daysUntil(endDate);
  if (days < 0) return <Badge className="bg-gray-100 text-gray-500">Expired</Badge>;
  if (days === 0) return <Badge className="bg-red-100 text-red-700">Expires today</Badge>;
  const cls = days <= 7 ? 'bg-red-100 text-red-700' : days <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
  return (
    <Badge className={cls}>
      In {days} day{days === 1 ? '' : 's'}
    </Badge>
  );
}

export default function ContractsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading…</div>}>
      <ContractsInner />
    </Suspense>
  );
}

function ContractsInner() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; row: Row } | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [remindersFor, setRemindersFor] = useState<string | null>(null);

  const props = useProperties();
  const agents = useAgents();
  const contacts = useContacts();
  const propLabel = (id: string) => props.data?.find((x) => x.id === id)?.propertyCode ?? id.slice(0, 8);
  const agentName = (id: string | null) => (id ? agents.data?.find((a) => a.id === id)?.fullName ?? '—' : '—');
  const contactName = (id: string | null) => (id ? contacts.data?.find((c) => c.id === id)?.fullName ?? '—' : '—');

  // URL is the source of truth for filters/sort/page, so views are shareable.
  const status = sp.get('status') ?? '';
  const contractType = sp.get('contractType') ?? '';
  const agentUserId = sp.get('agentUserId') ?? '';
  const expiring = sp.get('expiring') === '1';
  const sort = sp.get('sort') ?? '';
  const order = (sp.get('order') as 'ASC' | 'DESC') ?? 'DESC';
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1);
  const anyFilter = !!(status || contractType || agentUserId || expiring);

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
    queryKey: ['contracts', { status, contractType, agentUserId, expiring, sort, order, page }],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await api.GET('/api/contracts', {
          params: {
            query: {
              page,
              limit: PAGE_SIZE,
              ...(status ? { status: status as 'ACTIVE' } : {}),
              ...(contractType ? { contractType: contractType as 'RENTAL' } : {}),
              ...(agentUserId ? { agentUserId } : {}),
              ...(expiring ? { expiringInDays: EXPIRING_DAYS, sort: 'endDate', order: 'ASC' as const } : sort ? { sort, order } : {}),
            },
          },
        })
      ).data,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['contracts'] });

  const save = useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: any }) =>
      id ? req(api.PATCH('/api/contracts/{id}', { params: { path: { id } }, body })) : req(api.POST('/api/contracts', { body })),
    onSuccess: () => {
      invalidate();
      setModal(null);
      toast.success('Contract saved');
    },
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      req(api.PATCH('/api/contracts/{id}', { params: { path: { id } }, body: { status: status as 'ACTIVE' } })),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => req(api.DELETE('/api/contracts/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast.success('Contract deleted');
    },
  });

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="p-8">
      <PageHeader
        title="Contracts"
        subtitle={`${data?.meta.total ?? 0} contracts`}
        action={
          <Button onClick={() => setModal({ mode: 'create' })}>
            <Plus className="h-4 w-4" /> New contract
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={status} onChange={(e) => setParams({ status: e.target.value })} className="w-40">
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s ? statusLabel(s) : 'All statuses'}
            </option>
          ))}
        </Select>
        <Select value={contractType} onChange={(e) => setParams({ contractType: e.target.value })} className="w-36">
          {TYPE_FILTERS.map((t) => (
            <option key={t} value={t}>
              {t ? statusLabel(t) : 'All types'}
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
          title={`Active contracts ending within ${EXPIRING_DAYS} days`}
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
            <th className="px-4 py-3">Counterparty</th>
            <th className="px-4 py-3">Agent</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">
              <SortHeader label="Period" col="endDate" sort={sort} order={order} onSort={toggleSort} />
            </th>
            <th className="px-4 py-3">Expiry</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        }
      >
        {data?.data.map((c) => (
          <tr key={c.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.code}</td>
            <td className="px-4 py-3 font-mono text-xs text-gray-500">
              <Link href={`/properties/${c.propertyId}`} className="hover:text-brand hover:underline">
                {propLabel(c.propertyId)}
              </Link>
            </td>
            <td className="px-4 py-3 text-gray-600">{contactName(c.counterpartyContactId)}</td>
            <td className="px-4 py-3 text-gray-600">{agentName(c.agentUserId)}</td>
            <td className="px-4 py-3 text-gray-600">{c.contractType}</td>
            <td className="px-4 py-3 whitespace-nowrap text-gray-600">
              {formatDate(c.startDate)}
              {c.endDate ? ` → ${formatDate(c.endDate)}` : ''}
            </td>
            <td className="px-4 py-3">
              <ExpiryBadge endDate={c.endDate} status={c.status} />
            </td>
            <td className="px-4 py-3">
              <Select value={c.status} onChange={(e) => setStatus.mutate({ id: c.id, status: e.target.value })} className="w-36 py-1 text-xs">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </Select>
            </td>
            <td className="px-4 py-3 text-right">
              <div className="flex items-center justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => setRemindersFor(c.id)}>
                  <Bell className="h-4 w-4" /> Reminders
                </Button>
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
            <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">
              {isFetching ? (
                'Loading…'
              ) : anyFilter ? (
                <span>
                  No contracts match these filters.{' '}
                  <button onClick={() => router.replace(pathname, { scroll: false })} className="font-medium text-brand hover:underline">
                    Clear filters
                  </button>
                </span>
              ) : (
                <span>
                  No contracts yet.{' '}
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
        <ContractModal
          row={modal.mode === 'edit' ? modal.row : undefined}
          onClose={() => setModal(null)}
          onSubmit={(body) => save.mutate({ id: modal.mode === 'edit' ? modal.row.id : undefined, body })}
          pending={save.isPending}
        />
      )}
      {remindersFor && <RemindersModal contractId={remindersFor} onClose={() => setRemindersFor(null)} />}

      <Modal
        open={!!deleting}
        onClose={() => {
          setDeleting(null);
          remove.reset();
        }}
        title="Delete contract"
      >
        {deleting && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete contract <span className="font-medium text-gray-800">{deleting.code}</span>? This action cannot be
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

function ContractModal({ row, onClose, onSubmit, pending }: { row?: Row; onClose: () => void; onSubmit: (b: any) => void; pending: boolean }) {
  const props = useProperties();
  const deals = useDeals();
  const contacts = useContacts();
  const agents = useAgents();
  const isEdit = !!row;
  // Owner side = seller/landlord; counterparty = buyer/tenant. Disjoint by type,
  // so the same contact can never be picked for both sides.
  const owners = (contacts.data ?? []).filter((c) => c.contactType === 'OWNER' || c.contactType === 'LANDLORD');
  const counterparties = (contacts.data ?? []).filter((c) => c.contactType === 'BUYER' || c.contactType === 'TENANT');
  const [f, setF] = useState({
    propertyId: row?.propertyId ?? '',
    dealId: row?.dealId ?? '',
    ownerContactId: row?.ownerContactId ?? '',
    counterpartyContactId: row?.counterpartyContactId ?? '',
    agentUserId: row?.agentUserId ?? '',
    startDate: row?.startDate ?? '',
    endDate: row?.endDate ?? '',
    contractType: row?.contractType ?? 'RENTAL',
    status: row?.status ?? 'DRAFT',
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  return (
    <Modal open onClose={onClose} title={isEdit ? `Edit ${row!.code}` : 'New contract'} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isEdit) {
            // updateBody only accepts these fields; property/owner/type/start are fixed after creation.
            onSubmit({
              endDate: f.endDate || undefined,
              agentUserId: f.agentUserId || undefined,
              counterpartyContactId: f.counterpartyContactId || undefined,
              status: f.status,
            });
          } else {
            onSubmit({
              propertyId: f.propertyId,
              dealId: f.dealId || undefined,
              ownerContactId: f.ownerContactId,
              counterpartyContactId: f.counterpartyContactId || undefined,
              agentUserId: f.agentUserId || undefined,
              startDate: f.startDate,
              endDate: f.endDate || undefined,
              contractType: f.contractType,
              status: f.status,
            });
          }
        }}
        className="space-y-4"
      >
        {!isEdit && (
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
            <Field label="Deal (optional)">
              <Select value={f.dealId} onChange={(e) => set('dealId', e.target.value)}>
                <option value="">—</option>
                {deals.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          {!isEdit && (
            <Field label="Owner (seller/landlord)">
              <Select value={f.ownerContactId} onChange={(e) => set('ownerContactId', e.target.value)} required>
                <option value="">Select…</option>
                {owners.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.contactType})
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Counterparty (buyer/tenant)">
            <Select value={f.counterpartyContactId} onChange={(e) => set('counterpartyContactId', e.target.value)}>
              <option value="">—</option>
              {counterparties.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.contactType})
                </option>
              ))}
            </Select>
          </Field>
          {isEdit && (
            <Field label="Status">
              <Select value={f.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {!isEdit && (
            <Field label="Type">
              <Select value={f.contractType} onChange={(e) => set('contractType', e.target.value)}>
                <option>RENTAL</option>
                <option>SALE</option>
              </Select>
            </Field>
          )}
          <Field label="Agent">
            <Select value={f.agentUserId} onChange={(e) => set('agentUserId', e.target.value)}>
              <option value="">—</option>
              {agents.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName}
                </option>
              ))}
            </Select>
          </Field>
          {!isEdit && (
            <Field label="Start date">
              <Input type="date" value={f.startDate} onChange={(e) => set('startDate', e.target.value)} required />
            </Field>
          )}
          <Field label="End date (rental)">
            <Input type="date" value={f.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </Field>
        </div>
        <p className="text-xs text-gray-400">Rental contracts require an end date and auto-generate expiry reminders (30/7/0 days).</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create contract'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RemindersModal({ contractId, onClose }: { contractId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['contract-reminders', contractId],
    queryFn: async () => (await api.GET('/api/contracts/{id}/reminders', { params: { path: { id: contractId } } })).data,
  });
  return (
    <Modal open onClose={onClose} title="Contract reminders">
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !data?.length ? (
        <p className="text-sm text-gray-400">No reminders (only rental contracts generate them).</p>
      ) : (
        <ul className="space-y-3">
          {data.map((r) => (
            <li key={r.id} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 rounded bg-gold/30 px-1.5 py-0.5 text-[11px] font-medium text-brand">
                {new Date(r.remindAt).toLocaleDateString()}
              </span>
              <span className="flex-1 text-gray-600">{r.message}</span>
              <StatusBadge value={r.status} />
            </li>
          ))}
        </ul>
      )}
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
    return 'This contract can’t be deleted because it’s linked to other records. Set it to Terminated or Completed instead.';
  }
  return e?.message || 'Something went wrong while deleting. Please try again.';
}

/** "RENTAL" → "Rental" for display. */
function statusLabel(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Short, locale-friendly date (e.g. "18 Jun 2026"). */
function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}
