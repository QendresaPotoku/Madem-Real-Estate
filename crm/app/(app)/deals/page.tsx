'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, req, tx } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAgents, useContacts, useProperties } from '@/lib/queries';
import { Button, Card, Field, Input, Modal, PageHeader, Select, Table } from '@/components/ui';
import { ContactSelect } from '@/components/contact-select';

const STATUSES = ['OPEN', 'PENDING', 'CLOSED_WON', 'CLOSED_LOST', 'CANCELLED'] as const;
const STATUS_FILTERS = ['', ...STATUSES] as const;
const DEAL_TYPES = ['', 'SALE', 'RENT'] as const;
const PAGE_SIZE = 20;
const SUMMARY_LIMIT = 100;

type DealRow = {
  id: string;
  code: string;
  propertyId: string;
  opportunityId: string | null;
  buyerContactId: string | null;
  sellerContactId: string | null;
  agentUserId: string;
  dealType: string;
  finalPrice: number | null;
  mademCommissionValue: number | null;
  commissionPaid: boolean;
  currency: string;
  status: string;
};

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading…</div>}>
      <DealsInner />
    </Suspense>
  );
}

function DealsInner() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; row: DealRow } | null>(null);
  const [deleting, setDeleting] = useState<DealRow | null>(null);

  const props = useProperties();
  const agents = useAgents();
  const propLabel = (id: string) => props.data?.find((x) => x.id === id)?.propertyCode ?? id.slice(0, 8);
  const agentName = (id: string) => agents.data?.find((a) => a.id === id)?.fullName ?? '—';

  const highlightedDealId = sp.get('dealId');
  const status = sp.get('status') ?? '';
  const dealType = sp.get('dealType') ?? '';
  const agentUserId = sp.get('agentUserId') ?? '';
  const sort = sp.get('sort') ?? '';
  const order = (sp.get('order') as 'ASC' | 'DESC') ?? 'DESC';
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1);
  const anyFilter = !!(status || dealType || agentUserId);

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
    queryKey: ['deals', 'list', { status, dealType, agentUserId, sort, order, page }],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      req(
        api.GET('/api/deals', {
          params: {
            query: {
              page,
              limit: PAGE_SIZE,
              ...(status ? { status: status as 'OPEN' } : {}),
              ...(dealType ? { dealType: dealType as 'SALE' } : {}),
              ...(agentUserId ? { agentUserId } : {}),
              ...(sort ? { sort, order } : {}),
            },
          },
        }),
      ),
  });

  // Unfiltered summary across up to SUMMARY_LIMIT deals for the metric cards.
  const summaryQuery = useQuery({
    queryKey: ['deals', 'summary'],
    queryFn: async () => req(api.GET('/api/deals', { params: { query: { limit: SUMMARY_LIMIT } } })),
  });
  const summary = useMemo(() => {
    const all = (summaryQuery.data?.data ?? []) as DealRow[];
    const won = all.filter((d) => d.status === 'CLOSED_WON');
    const totalCommission = won.reduce((s, d) => s + (d.mademCommissionValue ?? 0), 0);
    const unpaidCommission = won.filter((d) => !d.commissionPaid).reduce((s, d) => s + (d.mademCommissionValue ?? 0), 0);
    return {
      open: all.filter((d) => d.status === 'OPEN').length,
      won: won.length,
      totalCommission,
      unpaidCommission,
    };
  }, [summaryQuery.data]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['deals'] });
    qc.invalidateQueries({ queryKey: ['properties'] });
    qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const save = useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: any }) =>
      id ? req(api.PATCH('/api/deals/{id}', { params: { path: { id } }, body })) : req(api.POST('/api/deals', { body })),
    onSuccess: () => {
      invalidate();
      setModal(null);
      toast.success('Deal saved');
    },
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      req(api.PATCH('/api/deals/{id}', { params: { path: { id } }, body: { status: status as 'CLOSED_WON' } })),
    onSuccess: invalidate,
  });
  const updateCommission = useMutation({
    mutationFn: async ({ id, mademCommissionValue }: { id: string; mademCommissionValue: number }) =>
      req(api.PATCH('/api/deals/{id}', { params: { path: { id } }, body: { mademCommissionValue } as any })),
    onSuccess: invalidate,
  });
  const updateCommissionPaid = useMutation({
    mutationFn: async ({ id, commissionPaid }: { id: string; commissionPaid: boolean }) =>
      req(api.PATCH('/api/deals/{id}', { params: { path: { id } }, body: { commissionPaid } as any })),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => req(api.DELETE('/api/deals/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast.success('Deal deleted');
    },
  });

  useEffect(() => {
    if (!highlightedDealId || !data?.data.length) return;
    document.getElementById(`deal-${highlightedDealId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [highlightedDealId, data?.data.length]);

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="p-8">
      <PageHeader
        title="Deals"
        subtitle={`${data?.meta.total ?? 0} transactions`}
        action={
          <Button onClick={() => setModal({ mode: 'create' })}>
            <Plus className="h-4 w-4" /> New deal
          </Button>
        }
      />
      <p className="-mt-4 mb-4 text-xs text-gray-400">Marking a deal CLOSED_WON moves its property to SOLD / RENTED.</p>

      <div className="mb-4 grid grid-cols-4 gap-3">
        <Metric label="Open deals" value={summary.open.toLocaleString()} />
        <Metric label="Closed won" value={summary.won.toLocaleString()} />
        <Metric label="Total commission" value={`${summary.totalCommission.toLocaleString()} EUR`} />
        <Metric
          label="Unpaid commission"
          value={`${summary.unpaidCommission.toLocaleString()} EUR`}
          tone={summary.unpaidCommission > 0 ? 'alert' : undefined}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={status} onChange={(e) => setParams({ status: e.target.value })} className="w-44">
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s ? statusLabel(s) : 'All statuses'}
            </option>
          ))}
        </Select>
        <Select value={dealType} onChange={(e) => setParams({ dealType: e.target.value })} className="w-36">
          {DEAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t ? t.charAt(0) + t.slice(1).toLowerCase() : 'All types'}
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
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Property</th>
            <th className="px-4 py-3">Agent</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3 text-right">
              <SortHeader label="Final price" col="finalPrice" sort={sort} order={order} onSort={toggleSort} align="right" />
            </th>
            <th className="px-4 py-3 text-right">Madem Commission Value (€)</th>
            <th className="px-4 py-3 text-center">Commission collected</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        }
      >
        {data?.data.map((d) => (
          <tr
            id={`deal-${d.id}`}
            key={d.id}
            className={`hover:bg-gray-50 ${highlightedDealId === d.id ? 'bg-gold/10 ring-2 ring-inset ring-gold/50' : ''}`}
          >
            <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.code}</td>
            <td className="px-4 py-3 font-mono text-xs text-gray-500">{propLabel(d.propertyId)}</td>
            <td className="px-4 py-3 text-gray-600">{agentName(d.agentUserId)}</td>
            <td className="px-4 py-3 text-gray-600">{d.dealType}</td>
            <td className="px-4 py-3 text-right font-medium text-brand">
              {d.finalPrice ? `${d.finalPrice.toLocaleString()} ${d.currency}` : '—'}
            </td>
            <td className="px-4 py-3 text-right">
              <CommissionValueInput
                value={(d as any).mademCommissionValue ?? null}
                onSave={(mademCommissionValue) => updateCommission.mutate({ id: d.id, mademCommissionValue })}
              />
            </td>
            <td className="px-4 py-3 text-center">
              <input
                type="checkbox"
                checked={Boolean((d as any).commissionPaid)}
                disabled={d.status !== 'CLOSED_WON'}
                onChange={(e) => updateCommissionPaid.mutate({ id: d.id, commissionPaid: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-brand accent-brand disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Mark commission collected for deal ${d.code}`}
                title={d.status === 'CLOSED_WON' ? 'Commission collected' : 'Only available for closed won deals'}
              />
            </td>
            <td className="px-4 py-3">
              <Select value={d.status} onChange={(e) => setStatus.mutate({ id: d.id, status: e.target.value })} className="w-40 py-1 text-xs">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </Select>
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setModal({ mode: 'edit', row: d as DealRow })}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    remove.reset();
                    setDeleting(d as DealRow);
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
                  No deals match these filters.{' '}
                  <button onClick={() => router.replace(pathname, { scroll: false })} className="font-medium text-brand hover:underline">
                    Clear filters
                  </button>
                </span>
              ) : (
                <span>
                  No deals yet.{' '}
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
        <DealModal
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
        title="Delete deal"
      >
        {deleting && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete deal <span className="font-medium text-gray-800">{deleting.code}</span>? This action cannot be undone.
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

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'alert' }) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === 'alert' ? 'text-red-600' : 'text-gray-850'}`}>{value}</p>
    </Card>
  );
}

function DealModal({ row, onClose, onSubmit, pending }: { row?: DealRow; onClose: () => void; onSubmit: (b: any) => void; pending: boolean }) {
  const props = useProperties();
  const contacts = useContacts();
  const agents = useAgents();
  // Buyer side = buyer/tenant; seller side = owner/landlord. Disjoint by type,
  // so the same contact can never be picked for both sides.
  const buyers = (contacts.data ?? []).filter((c) => c.contactType === 'BUYER' || c.contactType === 'TENANT');
  const sellers = (contacts.data ?? []).filter((c) => c.contactType === 'OWNER' || c.contactType === 'LANDLORD');
  const isEdit = !!row;
  const [f, setF] = useState({
    propertyId: row?.propertyId ?? '',
    opportunityId: row?.opportunityId ?? '',
    buyerContactId: row?.buyerContactId ?? '',
    sellerContactId: row?.sellerContactId ?? '',
    agentUserId: row?.agentUserId ?? '',
    dealType: row?.dealType ?? 'SALE',
    finalPrice: row?.finalPrice != null ? String(row.finalPrice) : '',
    mademCommissionValue: row?.mademCommissionValue != null ? String(row.mademCommissionValue) : '',
    status: row?.status ?? 'OPEN',
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  return (
    <Modal open onClose={onClose} title={isEdit ? `Edit ${row!.code}` : 'New deal'} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isEdit) {
            // updateBody only accepts these fields; property/agent/type are fixed after creation.
            onSubmit({
              finalPrice: f.finalPrice ? Number(f.finalPrice) : undefined,
              mademCommissionValue: f.mademCommissionValue ? Number(f.mademCommissionValue) : undefined,
              status: f.status,
              buyerContactId: f.buyerContactId || undefined,
              sellerContactId: f.sellerContactId || undefined,
            });
          } else {
            onSubmit({
              propertyId: f.propertyId,
              opportunityId: f.opportunityId || undefined,
              buyerContactId: f.buyerContactId || undefined,
              sellerContactId: f.sellerContactId || undefined,
              agentUserId: f.agentUserId,
              dealType: f.dealType,
              finalPrice: f.finalPrice ? Number(f.finalPrice) : undefined,
              mademCommissionValue: f.mademCommissionValue ? Number(f.mademCommissionValue) : undefined,
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
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Buyer">
            <ContactSelect value={f.buyerContactId} onChange={(id) => set('buyerContactId', id)} options={buyers} placeholder="—" />
          </Field>
          <Field label="Seller">
            <ContactSelect value={f.sellerContactId} onChange={(id) => set('sellerContactId', id)} options={sellers} placeholder="—" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {isEdit ? (
            <Field label="Status">
              <Select value={f.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Deal type">
              <Select value={f.dealType} onChange={(e) => set('dealType', e.target.value)}>
                <option>SALE</option>
                <option>RENT</option>
              </Select>
            </Field>
          )}
          <Field label="Final price">
            <Input type="number" value={f.finalPrice} onChange={(e) => set('finalPrice', e.target.value)} />
          </Field>
        </div>
        <Field label="Madem Commission Value (€)">
          <Input type="number" min="0" step="0.01" value={f.mademCommissionValue} onChange={(e) => set('mademCommissionValue', e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create deal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CommissionValueInput({ value, onSave }: { value: number | null; onSave: (value: number) => void }) {
  const [draft, setDraft] = useState(value == null ? '' : String(value));

  function save() {
    const next = draft === '' ? 0 : Number(draft);
    if (Number.isNaN(next) || next < 0 || next === (value ?? 0)) return;
    onSave(next);
  }

  return (
    <Input
      type="number"
      min="0"
      step="0.01"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      className="ml-auto w-36 text-right"
    />
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

/** Turn a delete API error into a human-readable reason for the modal. */
function deleteErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  if (e?.code === 'fk_violation') {
    return 'This deal can’t be deleted because it’s linked to other records (e.g. contracts or commissions). Remove those first.';
  }
  return e?.message || 'Something went wrong while deleting. Please try again.';
}

/** "CLOSED_WON" → "Closed won" for display. */
function statusLabel(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
}
