'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { api, req, tx } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAgents, useContacts, useLocationLookups } from '@/lib/queries';
import { Button, Field, Input, Modal, PageHeader, Select, Table } from '@/components/ui';
import { ContactModal } from '@/components/contact-modal';
import { cn } from '@/lib/cn';

const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'VILLA', 'LAND', 'OFFICE', 'SHOP', 'WAREHOUSE', 'BUILDING'] as const;
const LISTING_TYPES = ['SALE', 'RENT'] as const;
const STATUSES = ['NEW', 'QUALIFIED', 'VIEWING', 'NEGOTIATING', 'WON', 'LOST'] as const;
const STATUS_FILTERS = ['', ...STATUSES] as const;
const TYPE_FILTERS = ['', ...PROPERTY_TYPES] as const;
const LISTING_FILTERS = ['', ...LISTING_TYPES] as const;
const PAGE_SIZE = 20;
const BOARD_LIMIT = 100;

/** Background tint per pipeline stage, used for the board column headers. */
const STAGE_TINT: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  QUALIFIED: 'bg-blue-100 text-blue-700',
  VIEWING: 'bg-amber-100 text-amber-700',
  NEGOTIATING: 'bg-purple-100 text-purple-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
};

/* ── Per-type buyer/tenant requirements (stored in requirements_json) ──────── */
type ReqField =
  | { key: string; label: string; type: 'number' | 'text' }
  | { key: string; label: string; type: 'boolean' }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[] };

const ORIENT = [
  { value: 'NORTH', label: 'North' },
  { value: 'SOUTH', label: 'South' },
  { value: 'EAST', label: 'East' },
  { value: 'WEST', label: 'West' },
];
const HEATING = [
  { value: 'ELECTRICITY', label: 'Electricity' },
  { value: 'HEAT_PUMP', label: 'Heat pump' },
  { value: 'DISTRICT_HEATING', label: 'District heating' },
  { value: 'AC', label: 'AC' },
  { value: 'PELLET', label: 'Pellet' },
  { value: 'WOOD', label: 'Wood' },
];
const CONSTRUCTION_STATUS = [
  { value: 'UNDER_CONSTRUCTION', label: 'Under construction' },
  { value: 'COMPLETED', label: 'Completed' },
];
const BUILDING_COND = [
  { value: 'NEW_CONSTRUCTION', label: 'New construction' },
  { value: 'OLD_CONSTRUCTION', label: 'Old construction' },
];
const PURPOSE = [
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'RESIDENTIAL', label: 'Residential' },
];
const DOCS = [
  { value: 'OWNERSHIP', label: 'Ownership certificate' },
  { value: 'NOTARY', label: 'Notary' },
  { value: 'LAWYER', label: 'Lawyer' },
];
const LAND_SUBTYPE = [
  { value: 'CONSTRUCTION', label: 'Construction land' },
  { value: 'AGRICULTURAL', label: 'Agricultural' },
  { value: 'HOUSE_CONSTRUCTION', label: 'House construction' },
  { value: 'COMMERCIAL_DEVELOPMENT', label: 'Commercial development' },
];

const COMMERCIAL: ReqField[] = [
  { key: 'workspaces', label: 'Number of workspaces', type: 'number' },
  { key: 'size_m2', label: 'Size (m²)', type: 'number' },
  { key: 'main_road_access', label: 'Main road location', type: 'boolean' },
  { key: 'bathroom', label: 'Bathroom', type: 'boolean' },
  { key: 'office_use', label: 'Office use', type: 'boolean' },
];

const REQUIREMENTS_BY_TYPE: Record<string, ReqField[]> = {
  APARTMENT: [
    { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
    { key: 'max_size_m2', label: 'Max size (m²)', type: 'number' },
    { key: 'floor', label: 'Floor', type: 'number' },
    { key: 'orientation', label: 'Orientation', type: 'select', options: ORIENT },
    { key: 'heating_type', label: 'Heating', type: 'select', options: HEATING },
    { key: 'construction_status', label: 'Construction', type: 'select', options: CONSTRUCTION_STATUS },
    { key: 'building_condition', label: 'Condition', type: 'select', options: BUILDING_COND },
    { key: 'purpose', label: 'Purpose', type: 'select', options: PURPOSE },
    { key: 'documentation', label: 'Documentation', type: 'select', options: DOCS },
    { key: 'furnished', label: 'Furnished', type: 'boolean' },
    { key: 'elevator', label: 'Elevator', type: 'boolean' },
  ],
  VILLA: [
    { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
    { key: 'max_size_m2', label: 'Max size (m²)', type: 'number' },
    { key: 'land_size_are', label: 'Land size (Are)', type: 'number' },
    { key: 'orientation', label: 'Orientation', type: 'select', options: ORIENT },
    { key: 'heating_type', label: 'Heating', type: 'select', options: HEATING },
    { key: 'construction_status', label: 'Construction', type: 'select', options: CONSTRUCTION_STATUS },
    { key: 'documentation', label: 'Documentation', type: 'select', options: DOCS },
    { key: 'furnished', label: 'Furnished', type: 'boolean' },
    { key: 'garage', label: 'Garage', type: 'boolean' },
  ],
  HOUSE: [
    { key: 'rooms', label: 'Number of rooms', type: 'number' },
    { key: 'land_size_are', label: 'Land size (Are)', type: 'number' },
    { key: 'orientation', label: 'Orientation', type: 'select', options: ORIENT },
    { key: 'heating_type', label: 'Heating', type: 'select', options: HEATING },
    { key: 'construction_status', label: 'Construction', type: 'select', options: CONSTRUCTION_STATUS },
    { key: 'documentation', label: 'Documentation', type: 'select', options: DOCS },
    { key: 'furnished', label: 'Furnished', type: 'boolean' },
    { key: 'garage', label: 'Garage', type: 'boolean' },
  ],
  LAND: [
    { key: 'land_size_are', label: 'Land size (Are)', type: 'number' },
    { key: 'land_subtype', label: 'Land subtype', type: 'select', options: LAND_SUBTYPE },
    { key: 'main_road_access', label: 'Main road / highway', type: 'boolean' },
  ],
  OFFICE: COMMERCIAL,
  SHOP: COMMERCIAL,
  WAREHOUSE: [
    { key: 'size_m2', label: 'Size (m²)', type: 'number' },
    { key: 'business_activity', label: 'Business activity', type: 'text' },
    { key: 'power_capacity_kw', label: 'Power capacity (kW)', type: 'number' },
    { key: 'warehouse_height', label: 'Warehouse height (m)', type: 'number' },
    { key: 'main_road_access', label: 'Main road access', type: 'boolean' },
  ],
  BUILDING: [
    { key: 'size_m2', label: 'Size (m²)', type: 'number' },
    { key: 'workspaces', label: 'Working rooms', type: 'number' },
    { key: 'documentation', label: 'Documentation', type: 'select', options: DOCS },
  ],
};

/** Flat key → type lookup for coercing requirement values when building the body. */
const REQ_TYPE: Record<string, ReqField['type']> = {};
for (const defs of Object.values(REQUIREMENTS_BY_TYPE)) for (const d of defs) REQ_TYPE[d.key] = d.type;

/** Drop empties and coerce numeric requirement fields to numbers. */
function buildRequirements(reqs: Record<string, string | boolean>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(reqs)) {
    if (val === '' || val === undefined || val === null) continue;
    if (REQ_TYPE[k] === 'number') {
      const n = Number(val);
      if (!Number.isNaN(n)) out[k] = n;
    } else {
      out[k] = val;
    }
  }
  return out;
}

function ReqCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function optionNames(names: string[], current: string) {
  return Array.from(new Set([...names, current].filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

type Row = {
  id: string;
  code: string;
  contactId: string;
  assignedAgentId: string | null;
  propertyType: string;
  listingType: string;
  country: string | null;
  city: string | null;
  area: string | null;
  currency: string;
  budgetMin: number | null;
  budgetMax: number | null;
  status: string;
  requirementsJson: Record<string, unknown>;
};

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading…</div>}>
      <OpportunitiesInner />
    </Suspense>
  );
}

function OpportunitiesInner() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; row: Row } | null>(null);
  const [matchFor, setMatchFor] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const contacts = useContacts();
  const agents = useAgents();
  const contactName = (id: string) => contacts.data?.find((c) => c.id === id)?.fullName ?? '—';
  const agentName = (id: string | null) => (id ? agents.data?.find((a) => a.id === id)?.fullName ?? '—' : 'Unassigned');

  // URL is the source of truth for filters/page, so views are shareable.
  const status = sp.get('status') ?? '';
  const propertyType = sp.get('propertyType') ?? '';
  const listingType = sp.get('listingType') ?? '';
  const assignedAgentId = sp.get('assignedAgentId') ?? '';
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1);
  const view = sp.get('view') === 'board' ? 'board' : 'table';
  const anyFilter = !!(status || propertyType || listingType || assignedAgentId);
  const filterQuery = {
    ...(status ? { status: status as 'NEW' } : {}),
    ...(propertyType ? { propertyType: propertyType as 'APARTMENT' } : {}),
    ...(listingType ? { listingType: listingType as 'SALE' } : {}),
    ...(assignedAgentId ? { assignedAgentId } : {}),
  };

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
    queryKey: ['opportunities', 'table', { status, propertyType, listingType, assignedAgentId, page }],
    placeholderData: keepPreviousData,
    enabled: view === 'table',
    queryFn: async () =>
      (await api.GET('/api/opportunities', { params: { query: { page, limit: PAGE_SIZE, ...filterQuery } } })).data,
  });

  // Board view loads up to BOARD_LIMIT rows (unpaginated) and groups them by status client-side.
  const board = useQuery({
    queryKey: ['opportunities', 'board', { status, propertyType, listingType, assignedAgentId }],
    placeholderData: keepPreviousData,
    enabled: view === 'board',
    queryFn: async () =>
      (await api.GET('/api/opportunities', { params: { query: { limit: BOARD_LIMIT, ...filterQuery } } })).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['opportunities'] });

  const save = useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: any }) =>
      id ? req(api.PATCH('/api/opportunities/{id}', { params: { path: { id } }, body })) : req(api.POST('/api/opportunities', { body })),
    onSuccess: () => {
      invalidate();
      setModal(null);
      toast.success('Opportunity saved');
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => req(api.DELETE('/api/opportunities/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast.success('Opportunity deleted');
    },
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      req(api.PATCH('/api/opportunities/{id}', { params: { path: { id } }, body: { status: status as 'WON' } })),
    onSuccess: invalidate,
  });

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="p-8">
      <PageHeader
        title="Opportunities"
        subtitle={`${data?.meta.total ?? 0} buyer/renter requests`}
        action={
          <Button onClick={() => setModal({ mode: 'create' })}>
            <Plus className="h-4 w-4" /> New opportunity
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={status} onChange={(e) => setParams({ status: e.target.value })} className="w-40">
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s || 'All statuses'}
            </option>
          ))}
        </Select>
        <Select value={listingType} onChange={(e) => setParams({ listingType: e.target.value })} className="w-36">
          {LISTING_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s ? (s === 'SALE' ? 'Buy' : 'Rent') : 'Buy & rent'}
            </option>
          ))}
        </Select>
        <Select value={propertyType} onChange={(e) => setParams({ propertyType: e.target.value })} className="w-40">
          {TYPE_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s ? typeLabel(s) : 'All types'}
            </option>
          ))}
        </Select>
        <Select value={assignedAgentId} onChange={(e) => setParams({ assignedAgentId: e.target.value })} className="w-52">
          <option value="">All agents</option>
          {agents.data?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.fullName}
            </option>
          ))}
        </Select>
        {anyFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.replace(view === 'board' ? `${pathname}?view=board` : pathname, { scroll: false })}
          >
            Clear filters
          </Button>
        )}
        <div className="ml-auto inline-flex rounded-lg border border-gray-300 p-0.5">
          {(['table', 'board'] as const).map((vw) => (
            <button
              key={vw}
              type="button"
              onClick={() => setParams({ view: vw === 'board' ? 'board' : undefined, page: undefined })}
              className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition ${
                view === vw ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {vw}
            </button>
          ))}
        </div>
      </div>

      {view === 'board' && (
        <OpportunityBoard
          items={board.data?.data ?? []}
          loading={board.isFetching}
          total={board.data?.meta.total ?? 0}
          contactName={contactName}
          agentName={agentName}
          onCardClick={(o) => setModal({ mode: 'edit', row: o as Row })}
          onMove={(id, next) => setStatus.mutate({ id, status: next })}
        />
      )}

      {view === 'table' && (
        <>
      <Table
        head={
          <tr>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Looking for</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3 text-right">Budget</th>
            <th className="px-4 py-3">Agent</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        }
      >
        {data?.data.map((o) => (
          <tr key={o.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.code}</td>
            <td className="px-4 py-3 font-medium text-gray-800">{contactName(o.contactId)}</td>
            <td className="px-4 py-3 text-gray-700">
              {o.listingType === 'SALE' ? 'Buy' : 'Rent'} · {typeLabel(o.propertyType)}
            </td>
            <td className="px-4 py-3 text-gray-600">{[o.city, o.area].filter(Boolean).join(', ') || '—'}</td>
            <td className="px-4 py-3 text-right text-gray-600">{budgetLabel(o.budgetMin, o.budgetMax, o.currency)}</td>
            <td className="px-4 py-3 text-gray-600">{agentName(o.assignedAgentId)}</td>
            <td className="px-4 py-3">
              <Select value={o.status} onChange={(e) => setStatus.mutate({ id: o.id, status: e.target.value })} className="w-36 py-1 text-xs">
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => setMatchFor(o.id)}>
                  <Sparkles className="h-4 w-4" /> Matches
                </Button>
                <button
                  onClick={() => setModal({ mode: 'edit', row: o as Row })}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    remove.reset();
                    setDeleting(o as Row);
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
                  No opportunities match these filters.{' '}
                  <button onClick={() => router.replace(pathname, { scroll: false })} className="font-medium text-brand hover:underline">
                    Clear filters
                  </button>
                </span>
              ) : (
                <span>
                  No opportunities yet.{' '}
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
        </>
      )}

      {modal && (
        <OpportunityModal
          row={modal.mode === 'edit' ? modal.row : undefined}
          onClose={() => setModal(null)}
          onSubmit={(body) => save.mutate({ id: modal.mode === 'edit' ? modal.row.id : undefined, body })}
          pending={save.isPending}
        />
      )}
      {matchFor && <MatchesModal opportunityId={matchFor} onClose={() => setMatchFor(null)} />}

      <Modal
        open={!!deleting}
        onClose={() => {
          setDeleting(null);
          remove.reset();
        }}
        title="Delete opportunity"
      >
        {deleting && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete opportunity <span className="font-medium text-gray-800">{deleting.code}</span>? This action cannot be
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

/* ── Pipeline board (drag a card between stages to change its status) ───────── */
type BoardOpp = {
  id: string;
  code: string;
  contactId: string;
  assignedAgentId: string | null;
  propertyType: string;
  listingType: string;
  city: string | null;
  area: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  status: string;
};

function OpportunityBoard({
  items,
  loading,
  total,
  contactName,
  agentName,
  onCardClick,
  onMove,
}: {
  items: BoardOpp[];
  loading: boolean;
  total: number;
  contactName: (id: string) => string;
  agentName: (id: string | null) => string;
  onCardClick: (o: BoardOpp) => void;
  onMove: (id: string, status: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);
  // Pending move into a terminal stage (WON/LOST), awaiting confirmation.
  const [confirm, setConfirm] = useState<{ opp: BoardOpp; status: string } | null>(null);

  function drop(status: string) {
    const opp = items.find((o) => o.id === dragId);
    setDragId(null);
    setOverStatus(null);
    if (!opp || opp.status === status) return;
    if (status === 'WON' || status === 'LOST') setConfirm({ opp, status });
    else onMove(opp.id, status);
  }

  return (
    <div>
      {total > BOARD_LIMIT && (
        <p className="mb-2 text-xs text-amber-600">
          Showing the first {BOARD_LIMIT} of {total}. Narrow with filters to see the rest on the board.
        </p>
      )}
      <div className="flex gap-3 overflow-x-auto pb-3">
        {STATUSES.map((status) => {
          const cards = items.filter((o) => o.status === status);
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                if (overStatus !== status) setOverStatus(status);
              }}
              onDrop={() => drop(status)}
              className={`flex w-64 shrink-0 flex-col rounded-xl border bg-gray-50/60 ${
                overStatus === status ? 'border-brand ring-2 ring-brand/20' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STAGE_TINT[status] ?? 'bg-gray-100 text-gray-700'}`}>{status}</span>
                <span className="text-xs font-medium text-gray-400">{cards.length}</span>
              </div>
              <div className="flex min-h-16 flex-1 flex-col gap-2 px-2 pb-2">
                {cards.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    draggable
                    onDragStart={() => setDragId(o.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverStatus(null);
                    }}
                    onClick={() => onCardClick(o)}
                    className={`cursor-grab rounded-lg border border-gray-200 bg-white p-2.5 text-left shadow-sm transition hover:border-brand/40 active:cursor-grabbing ${
                      dragId === o.id ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{contactName(o.contactId)}</span>
                      <span className="font-mono text-[10px] text-gray-400">{o.code}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {o.listingType === 'SALE' ? 'Buy' : 'Rent'} · {typeLabel(o.propertyType)}
                    </p>
                    <p className="text-xs text-gray-500">{[o.city, o.area].filter(Boolean).join(', ') || '—'}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-brand">{budgetLabel(o.budgetMin, o.budgetMax, o.currency)}</span>
                      <span className="truncate pl-2 text-[10px] text-gray-400">{agentName(o.assignedAgentId)}</span>
                    </div>
                  </button>
                ))}
                {!cards.length && (
                  <div className="flex flex-1 items-center justify-center py-6 text-xs text-gray-300">
                    {loading ? '…' : 'Drop here'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={`Mark as ${confirm?.status}?`}>
        {confirm && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Move <span className="font-medium text-gray-800">{confirm.opp.code}</span> ({contactName(confirm.opp.contactId)}) to{' '}
              <span className="font-medium text-gray-800">{confirm.status}</span>? This closes the opportunity.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant={confirm.status === 'LOST' ? 'danger' : 'primary'}
                onClick={() => {
                  onMove(confirm.opp.id, confirm.status);
                  setConfirm(null);
                }}
              >
                Mark {confirm.status}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/** Format an opportunity budget range, e.g. "10,000 – 50,000 EUR" / "≤ 50,000 EUR". */
function budgetLabel(min: number | null, max: number | null, currency: string): string {
  if (min != null && max != null) return `${min.toLocaleString()} – ${max.toLocaleString()} ${currency}`;
  if (max != null) return `≤ ${max.toLocaleString()} ${currency}`;
  if (min != null) return `≥ ${min.toLocaleString()} ${currency}`;
  return '—';
}

/** Turn a delete API error into a human-readable reason for the modal. */
function deleteErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  if (e?.code === 'fk_violation') {
    return 'This opportunity can’t be deleted because it’s linked to other records (e.g. viewings or deals). Remove those first.';
  }
  return e?.message || 'Something went wrong while deleting. Please try again.';
}

/** "APARTMENT" → "Apartment" for display. */
function typeLabel(t: string) {
  return t.charAt(0) + t.slice(1).toLowerCase();
}

function OpportunityModal({ row, onClose, onSubmit, pending }: { row?: Row; onClose: () => void; onSubmit: (b: any) => void; pending: boolean }) {
  const qc = useQueryClient();
  const contacts = useContacts();
  const agents = useAgents();
  const locations = useLocationLookups();
  const [contactOpen, setContactOpen] = useState(false);
  const [f, setF] = useState({
    contactId: row?.contactId ?? '',
    assignedAgentId: row?.assignedAgentId ?? '',
    propertyType: row?.propertyType ?? 'APARTMENT',
    listingType: row?.listingType ?? 'SALE',
    country: row?.country ?? 'Kosovo',
    city: row?.city ?? '',
    area: row?.area ?? '',
    currency: row?.currency ?? 'EUR',
    budgetMin: row?.budgetMin != null ? String(row.budgetMin) : '',
    budgetMax: row?.budgetMax != null ? String(row.budgetMax) : '',
  });
  const [reqs, setReqs] = useState<Record<string, string | boolean>>(() => {
    const r: Record<string, string | boolean> = {};
    for (const [k, val] of Object.entries(row?.requirementsJson ?? {})) {
      r[k] = typeof val === 'boolean' ? val : String(val);
    }
    return r;
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const setReq = (k: string, v: string | boolean) => setReqs((s) => ({ ...s, [k]: v }));
  const createContact = useMutation({
    mutationFn: async (body: any) => req(api.POST('/api/contacts', { body })),
    onSuccess: (contact: any) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contacts-options'] });
      set('contactId', contact.id);
      setContactOpen(false);
      toast.success('Contact saved');
    },
  });

  const reqDefs = REQUIREMENTS_BY_TYPE[f.propertyType] ?? [];
  const country = locations.data?.countries.find((c) => c.name === f.country);
  const cities = locations.data?.cities.filter((c) => !country || c.countryId === country.id).map((c) => c.name) ?? [];
  const city = locations.data?.cities.find((c) => c.name === f.city && (!country || c.countryId === country.id));
  const areas = locations.data?.areas.filter((a) => !city || a.cityId === city.id).map((a) => a.name) ?? [];

  return (
    <>
      <Modal open onClose={onClose} title={row ? `Edit ${row.code}` : 'New opportunity'} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const body: any = {
            assignedAgentId: f.assignedAgentId || undefined,
            propertyType: f.propertyType,
            listingType: f.listingType,
            country: f.country || undefined,
            city: f.city || undefined,
            area: f.area || undefined,
            currency: f.currency || undefined,
            budgetMin: f.budgetMin ? Number(f.budgetMin) : undefined,
            budgetMax: f.budgetMax ? Number(f.budgetMax) : undefined,
            requirementsJson: buildRequirements(reqs),
          };
          if (!row) body.contactId = f.contactId;
          onSubmit(body);
        }}
        className="space-y-5"
      >
        <div className="grid grid-cols-2 gap-4">
          {!row && (
            <Field label="Contact">
              <Select value={f.contactId} onChange={(e) => set('contactId', e.target.value)} required>
                <option value="">Select contact…</option>
                {contacts.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.contactType})
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                Contact not listed?{' '}
                <button type="button" className="font-medium text-brand hover:underline" onClick={() => setContactOpen(true)}>
                  Create new contact
                </button>
              </p>
            </Field>
          )}
          <Field label="Assigned agent">
            <Select value={f.assignedAgentId} onChange={(e) => set('assignedAgentId', e.target.value)}>
              <option value="">Unassigned</option>
              {agents.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Looking to">
            <Select value={f.listingType} onChange={(e) => set('listingType', e.target.value)}>
              {LISTING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === 'SALE' ? 'Buy' : 'Rent'}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Property type">
            <Select value={f.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Country">
            <Select
              value={f.country}
              onChange={(e) => {
                set('country', e.target.value);
                set('city', '');
                set('area', '');
              }}
            >
              <option value="">Select country...</option>
              {optionNames(locations.data?.countries.map((c) => c.name) ?? [], f.country).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>
          </Field>
          <Field label="City">
            <Select
              value={f.city}
              onChange={(e) => {
                set('city', e.target.value);
                set('area', '');
              }}
            >
              <option value="">Select city...</option>
              {optionNames(cities, f.city).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Area / neighborhood">
            <Select value={f.area} onChange={(e) => set('area', e.target.value)}>
              <option value="">Select area...</option>
              {optionNames(areas, f.area).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Budget min">
            <Input type="number" value={f.budgetMin} onChange={(e) => set('budgetMin', e.target.value)} />
          </Field>
          <Field label="Budget max">
            <Input type="number" value={f.budgetMax} onChange={(e) => set('budgetMax', e.target.value)} />
          </Field>
          <Field label="Currency">
            <Input value={f.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} maxLength={3} />
          </Field>
        </div>

        {reqDefs.length > 0 && (
          <div>
            <p className="mb-2 border-t border-gray-100 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {f.propertyType.charAt(0) + f.propertyType.slice(1).toLowerCase()} requirements
            </p>
            <div className="grid grid-cols-3 gap-4">
              {reqDefs.map((def) =>
                def.type === 'boolean' ? (
                  <div key={def.key} className="flex items-center pt-6">
                    <ReqCheck label={def.label} checked={reqs[def.key] === true} onChange={(b) => setReq(def.key, b)} />
                  </div>
                ) : def.type === 'select' ? (
                  <Field key={def.key} label={def.label}>
                    <Select value={String(reqs[def.key] ?? '')} onChange={(e) => setReq(def.key, e.target.value)}>
                      <option value="">—</option>
                      {def.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : (
                  <Field key={def.key} label={def.label}>
                    <Input
                      type={def.type === 'number' ? 'number' : 'text'}
                      value={String(reqs[def.key] ?? '')}
                      onChange={(e) => setReq(def.key, e.target.value)}
                    />
                  </Field>
                ),
              )}
            </div>
          </div>
        )}

        <div className="sticky bottom-0 -mx-6 -mb-5 flex justify-end gap-2 border-t border-gray-100 bg-white px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
      </Modal>
      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} onSubmit={(body) => createContact.mutate(body)} pending={createContact.isPending} />}
    </>
  );
}

const MATCH_STATUS_OPTIONS = ['SUGGESTED', 'SHARED', 'VIEWING', 'ACCEPTED', 'REJECTED'] as const;

/** Score → quality tier used to color the score badge and progress bar. */
function scoreTone(score: number) {
  if (score >= 80) return { label: 'Excellent', bar: 'bg-green-500', badge: 'bg-green-100 text-green-700' };
  if (score >= 60) return { label: 'Good', bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' };
  if (score >= 40) return { label: 'Fair', bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' };
  return { label: 'Weak', bar: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' };
}

function MatchesModal({ opportunityId, onClose }: { opportunityId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['matches', opportunityId],
    queryFn: async () => (await api.GET('/api/opportunities/{id}/matches', { params: { path: { id: opportunityId } } })).data,
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      req(api.PATCH('/api/matches/{id}', { params: { path: { id } }, body: { status: status as 'SUGGESTED' } })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches', opportunityId] });
      toast.success('Match updated');
    },
  });

  const count = data?.length ?? 0;
  const subtitle = isLoading
    ? 'Scoring active properties…'
    : count
      ? `${count} ranked ${count === 1 ? 'property' : 'properties'} · scored by budget, location & bedrooms`
      : undefined;

  return (
    <Modal open onClose={onClose} title="Ranked property matches" wide>
      {subtitle && <p className="-mt-1 mb-4 text-xs text-gray-500">{subtitle}</p>}
      {isLoading ? (
        <ul className="space-y-2">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </ul>
      ) : !count ? (
        <p className="rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
          No matching active properties found. Try widening the opportunity&apos;s budget or location.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {data!.map((m, i) => {
            const score = m.matchScore ?? 0;
            const tone = scoreTone(score);
            return (
              <li key={m.id} className="flex items-center gap-4 py-3">
                <span className="w-5 shrink-0 text-center text-sm font-semibold text-gray-400">{i + 1}</span>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/properties/${m.propertyId}`}
                    onClick={onClose}
                    className="font-medium text-gray-800 hover:text-brand hover:underline"
                  >
                    {m.property ? tx(m.property.titleJson) : m.propertyId}
                  </Link>
                  <p className="truncate text-xs text-gray-500">
                    {m.property?.propertyCode} · {m.property?.city}
                    {m.property?.area ? `, ${m.property.area}` : ''}
                    {m.property?.bedrooms != null ? ` · ${m.property.bedrooms} bd` : ''}
                    {m.property ? ` · ${m.property.price.toLocaleString()} EUR` : ''}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-gray-100">
                      <div className={cn('h-full rounded-full', tone.bar)} style={{ width: `${Math.min(100, score)}%` }} />
                    </div>
                    <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', tone.badge)}>
                      {score} · {tone.label}
                    </span>
                  </div>
                </div>

                <Select
                  value={m.status}
                  onChange={(e) => setStatus.mutate({ id: m.id, status: e.target.value })}
                  disabled={setStatus.isPending}
                  className="w-32 shrink-0 py-1.5 text-xs"
                >
                  {MATCH_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
