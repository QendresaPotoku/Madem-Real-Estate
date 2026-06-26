'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { CheckCircle2, Clipboard, Filter, Plus, X } from 'lucide-react';
import { api, req, tx } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useContacts, useOpportunities, useProperties } from '@/lib/queries';
import { Button, Card, EmptyRow, Field, Input, Modal, PageHeader, Select, StatusBadge, Table, Textarea } from '@/components/ui';
import { RowActions } from '@/components/row-actions';

const STATUSES = ['SUBMITTED', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'] as const;

type OfferRow = {
  id: string;
  propertyId: string;
  opportunityId: string | null;
  buyerContactId: string;
  offeredAmount: number;
  currency: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function OffersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; row: OfferRow } | null>(null);
  const [filters, setFilters] = useState({ status: '', propertyId: '', buyerContactId: '' });
  const props = useProperties();
  const buyers = useContacts();
  const opps = useOpportunities();

  const propertyById = useMemo(() => new Map((props.data ?? []).map((p) => [p.id, p])), [props.data]);
  const buyerById = useMemo(() => new Map((buyers.data ?? []).map((c) => [c.id, c])), [buyers.data]);
  const oppById = useMemo(() => new Map((opps.data ?? []).map((o) => [o.id, o])), [opps.data]);

  const { data, isFetching } = useQuery({
    queryKey: ['offers'],
    placeholderData: keepPreviousData,
    queryFn: async () => (await api.GET('/api/offers', { params: { query: { limit: 100 } } })).data,
  });

  const offers = (data?.data ?? []) as OfferRow[];
  const filtered = offers.filter((o) => {
    if (filters.status && o.status !== filters.status) return false;
    if (filters.propertyId && o.propertyId !== filters.propertyId) return false;
    if (filters.buyerContactId && o.buyerContactId !== filters.buyerContactId) return false;
    return true;
  });

  const summary = useMemo(() => {
    const active = offers.filter((o) => !['REJECTED', 'WITHDRAWN'].includes(o.status));
    const accepted = offers.filter((o) => o.status === 'ACCEPTED');
    const totalAccepted = accepted.reduce((sum, o) => sum + o.offeredAmount, 0);
    return {
      active: active.length,
      accepted: accepted.length,
      totalAccepted,
      latest: offers[0]?.createdAt,
    };
  }, [offers]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['offers'] });
  const save = useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: any }) =>
      id ? req(api.PATCH('/api/offers/{id}', { params: { path: { id } }, body })) : req(api.POST('/api/offers', { body })),
    onSuccess: () => {
      invalidate();
      setModal(null);
      toast.success('Offer saved');
    },
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      req(api.PATCH('/api/offers/{id}', { params: { path: { id } }, body: { status: status as 'ACCEPTED' } })),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => req(api.DELETE('/api/offers/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      invalidate();
      toast.success('Offer deleted');
    },
  });

  const resetFilters = () => setFilters({ status: '', propertyId: '', buyerContactId: '' });

  return (
    <div className="p-8">
      <PageHeader
        title="Offers"
        subtitle={`${filtered.length} shown of ${data?.meta.total ?? 0} offers`}
        action={
          <Button onClick={() => setModal({ mode: 'create' })}>
            <Plus className="h-4 w-4" /> New offer
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        <Metric label="Active offers" value={summary.active.toLocaleString()} />
        <Metric label="Accepted" value={summary.accepted.toLocaleString()} icon={<CheckCircle2 className="h-4 w-4" />} />
        <Metric label="Accepted value" value={`${summary.totalAccepted.toLocaleString()} EUR`} />
        <Metric label="Latest offer" value={summary.latest ? formatDate(summary.latest) : '-'} />
      </div>

      <Card className="mb-4 px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 pb-2 text-sm font-medium text-gray-600">
            <Filter className="h-4 w-4" /> Focus list
          </div>
          <Field label="Status" className="w-36">
            <Select value={filters.status} onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Property" className="w-48">
            <Select value={filters.propertyId} onChange={(e) => setFilters((s) => ({ ...s, propertyId: e.target.value }))}>
              <option value="">All properties</option>
              {props.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.propertyCode} - {tx(p.titleJson)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Buyer" className="w-44">
            <Select value={filters.buyerContactId} onChange={(e) => setFilters((s) => ({ ...s, buyerContactId: e.target.value }))}>
              <option value="">All buyers</option>
              {buyers.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </Select>
          </Field>
          {(filters.status || filters.propertyId || filters.buyerContactId) && (
            <Button type="button" variant="ghost" onClick={resetFilters} className="mb-0.5">
              <X className="h-4 w-4" /> Clear
            </Button>
          )}
        </div>
      </Card>

      <Table
        head={
          <tr>
            <th className="px-4 py-3">Offer</th>
            <th className="px-4 py-3">Buyer</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3 text-right">Vs list</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3"></th>
          </tr>
        }
      >
        {filtered.map((o) => {
          const property = propertyById.get(o.propertyId);
          const buyer = buyerById.get(o.buyerContactId);
          const opportunity = o.opportunityId ? oppById.get(o.opportunityId) : undefined;
          const delta = getOfferDelta(o.offeredAmount, property?.price ?? null);
          return (
            <tr key={o.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <p className="font-mono text-xs text-gray-500">{property?.propertyCode ?? o.propertyId.slice(0, 8)}</p>
                <p className="max-w-64 truncate font-medium text-gray-800">{property ? tx(property.titleJson) : 'Unknown property'}</p>
                <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-gray-700">{buyer?.fullName ?? o.buyerContactId.slice(0, 8)}</p>
                <p className="text-xs text-gray-400">{opportunity ? opportunity.code : 'No opportunity linked'}</p>
              </td>
              <td className="px-4 py-3 text-right font-medium text-brand">
                {o.offeredAmount.toLocaleString()} {o.currency}
              </td>
              <td className="px-4 py-3 text-right">
                {delta ? (
                  <div>
                    <p className={delta.amount < 0 ? 'font-medium text-amber-700' : 'font-medium text-green-700'}>
                      {delta.amount > 0 ? '+' : ''}
                      {delta.amount.toLocaleString()} {o.currency}
                    </p>
                    <p className="text-xs text-gray-400">{delta.percent}%</p>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Select value={o.status} onChange={(e) => setStatus.mutate({ id: o.id, status: e.target.value })} className="w-36 py-1 text-xs">
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </td>
              <td className="max-w-72 px-4 py-3 text-gray-500">
                <p className="line-clamp-2">{o.notes ?? '-'}</p>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand"
                    title="Copy offer summary"
                    onClick={() => copyOfferSummary(o, property?.propertyCode, buyer?.fullName)}
                  >
                    <Clipboard className="h-4 w-4" />
                  </button>
                  <RowActions onEdit={() => setModal({ mode: 'edit', row: o })} onDelete={() => remove.mutate(o.id)} confirmLabel="Delete this offer?" />
                </div>
              </td>
            </tr>
          );
        })}
        {!filtered.length && <EmptyRow cols={7} loading={isFetching} />}
      </Table>

      {modal && (
        <OfferModal
          row={modal.mode === 'edit' ? modal.row : undefined}
          onClose={() => setModal(null)}
          onSubmit={(body) => save.mutate({ id: modal.mode === 'edit' ? modal.row.id : undefined, body })}
          pending={save.isPending}
        />
      )}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
          <p className="mt-1 text-lg font-semibold text-gray-850">{value}</p>
        </div>
        {icon && <div className="rounded-lg bg-green-50 p-2 text-green-700">{icon}</div>}
      </div>
    </Card>
  );
}

function OfferModal({ row, onClose, onSubmit, pending }: { row?: OfferRow; onClose: () => void; onSubmit: (b: any) => void; pending: boolean }) {
  const props = useProperties();
  const opps = useOpportunities();
  const buyers = useContacts();
  const [f, setF] = useState({
    propertyId: row?.propertyId ?? '',
    opportunityId: row?.opportunityId ?? '',
    buyerContactId: row?.buyerContactId ?? '',
    offeredAmount: row ? String(row.offeredAmount) : '',
    currency: row?.currency ?? 'EUR',
    status: row?.status ?? 'SUBMITTED',
    notes: row?.notes ?? '',
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  return (
    <Modal open onClose={onClose} title={row ? 'Edit offer' : 'New offer'} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const body: any = {
            offeredAmount: Number(f.offeredAmount),
            status: f.status,
            notes: f.notes || undefined,
          };
          if (!row) {
            body.propertyId = f.propertyId;
            body.opportunityId = f.opportunityId || undefined;
            body.buyerContactId = f.buyerContactId;
            body.currency = f.currency || 'EUR';
          }
          onSubmit(body);
        }}
        className="space-y-4"
      >
        {!row && (
          <Field label="Property">
            <Select value={f.propertyId} onChange={(e) => set('propertyId', e.target.value)} required>
              <option value="">Select property...</option>
              {props.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.propertyCode} - {tx(p.titleJson)}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {!row && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Buyer">
              <Select value={f.buyerContactId} onChange={(e) => set('buyerContactId', e.target.value)} required>
                <option value="">Select buyer...</option>
                {buyers.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.contactType})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Opportunity">
              <Select value={f.opportunityId} onChange={(e) => set('opportunityId', e.target.value)}>
                <option value="">Not linked</option>
                {opps.data?.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.code}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          <Field label="Offered amount">
            <Input type="number" min="0" value={f.offeredAmount} onChange={(e) => set('offeredAmount', e.target.value)} required />
          </Field>
          {!row && (
            <Field label="Currency">
              <Input value={f.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} maxLength={3} required />
            </Field>
          )}
          <Field label="Status">
            <Select value={f.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Notes">
          <Textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save offer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function getOfferDelta(amount: number, listPrice: number | null) {
  if (!listPrice) return null;
  const delta = amount - listPrice;
  return { amount: delta, percent: `${delta > 0 ? '+' : ''}${Math.round((delta / listPrice) * 100)}` };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

async function copyOfferSummary(row: OfferRow, propertyCode?: string, buyerName?: string) {
  const text = [
    `Offer ${row.status}`,
    `Property: ${propertyCode ?? row.propertyId}`,
    `Buyer: ${buyerName ?? row.buyerContactId}`,
    `Amount: ${row.offeredAmount.toLocaleString()} ${row.currency}`,
    row.notes ? `Notes: ${row.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  await navigator.clipboard.writeText(text);
  toast.success('Offer summary copied');
}
