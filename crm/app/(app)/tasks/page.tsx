'use client';

import { Suspense, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, req } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAgents } from '@/lib/queries';
import { Button, Card, Field, Input, Modal, PageHeader, Select, StatusBadge, Table, Textarea } from '@/components/ui';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
const STATUS_FILTERS = ['', ...STATUSES] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
const PRIORITY_FILTERS = ['', ...PRIORITIES] as const;
const PAGE_SIZE = 20;
const SUMMARY_LIMIT = 100;
const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-red-100 text-red-700',
};

type Row = { id: string; title: string; description: string | null; assignedTo: string | null; priority: string; status: string; dueDate: string | null };

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading…</div>}>
      <TasksInner />
    </Suspense>
  );
}

function TasksInner() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; row: Row } | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const agents = useAgents();
  const agentName = (id: string | null) => (id ? agents.data?.find((a) => a.id === id)?.fullName ?? '—' : '—');
  const me = useQuery({ queryKey: ['me'], queryFn: async () => (await api.GET('/api/auth/me')).data });

  // URL is the source of truth for filters/sort/page, so views are shareable.
  const assignedTo = sp.get('assignedTo') ?? '';
  const status = sp.get('status') ?? '';
  const priority = sp.get('priority') ?? '';
  const overdue = sp.get('overdue') === '1';
  const sort = sp.get('sort') ?? 'dueDate';
  const order = (sp.get('order') as 'ASC' | 'DESC') ?? 'ASC';
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1);
  const anyFilter = !!(assignedTo || status || priority || overdue);
  const mineActive = !!me.data && assignedTo === me.data.id;

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
    if (sort !== col) setParams({ sort: col, order: 'ASC', page });
    else setParams({ sort: col, order: order === 'ASC' ? 'DESC' : 'ASC', page });
  }

  const { data, isFetching } = useQuery({
    queryKey: ['tasks', 'list', { assignedTo, status, priority, overdue, sort, order, page }],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await api.GET('/api/tasks', {
          params: {
            query: {
              page,
              limit: PAGE_SIZE,
              sort,
              order,
              ...(assignedTo ? { assignedTo } : {}),
              ...(status ? { status: status as 'OPEN' } : {}),
              ...(priority ? { priority: priority as 'HIGH' } : {}),
              ...(overdue ? { overdue: true } : {}),
            },
          },
        })
      ).data,
  });

  // Unfiltered summary across up to SUMMARY_LIMIT tasks for the urgency cards.
  const summaryQuery = useQuery({
    queryKey: ['tasks', 'summary'],
    queryFn: async () => (await api.GET('/api/tasks', { params: { query: { limit: SUMMARY_LIMIT } } })).data,
  });
  const summary = useMemo(() => {
    const all = (summaryQuery.data?.data ?? []) as Row[];
    const actionable = all.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED');
    return {
      overdue: actionable.filter((t) => t.dueDate && daysUntil(t.dueDate) < 0).length,
      dueToday: actionable.filter((t) => t.dueDate && daysUntil(t.dueDate) === 0).length,
      open: actionable.length,
    };
  }, [summaryQuery.data]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tasks'] });

  const save = useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: any }) =>
      id ? req(api.PATCH('/api/tasks/{id}', { params: { path: { id } }, body })) : req(api.POST('/api/tasks', { body })),
    onSuccess: () => {
      invalidate();
      setModal(null);
      toast.success('Task saved');
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => req(api.DELETE('/api/tasks/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast.success('Task deleted');
    },
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      req(api.PATCH('/api/tasks/{id}', { params: { path: { id } }, body: { status: status as 'DONE' } })),
    onSuccess: invalidate,
  });

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="p-8">
      <PageHeader
        title="Tasks"
        subtitle={`${data?.meta.total ?? 0} tasks`}
        action={
          <Button onClick={() => setModal({ mode: 'create' })}>
            <Plus className="h-4 w-4" /> New task
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <MetricButton
          label="Overdue"
          value={summary.overdue}
          tone="alert"
          active={overdue}
          onClick={() => setParams({ overdue: overdue ? '' : '1' })}
        />
        <Metric label="Due today" value={summary.dueToday} />
        <Metric label="Open" value={summary.open} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => me.data && setParams({ assignedTo: mineActive ? '' : me.data.id })}
          disabled={!me.data}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
            mineActive ? 'border-brand bg-brand text-white' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          My tasks
        </button>
        <Select value={mineActive ? '' : assignedTo} onChange={(e) => setParams({ assignedTo: e.target.value })} className="w-52">
          <option value="">All assignees</option>
          {agents.data?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.fullName}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setParams({ status: e.target.value })} className="w-40">
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s ? statusLabel(s) : 'All statuses'}
            </option>
          ))}
        </Select>
        <Select value={priority} onChange={(e) => setParams({ priority: e.target.value })} className="w-36">
          {PRIORITY_FILTERS.map((p) => (
            <option key={p} value={p}>
              {p ? statusLabel(p) : 'All priorities'}
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
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Assignee</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">
              <SortHeader label="Due" col="dueDate" sort={sort} order={order} onSort={toggleSort} />
            </th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        }
      >
        {data?.data.map((t) => {
          const late = isOverdue(t.dueDate, t.status);
          return (
            <tr key={t.id} className={`hover:bg-gray-50 ${late ? 'bg-red-50/40' : ''}`}>
              <td className="px-4 py-3 font-medium text-gray-800">{t.title}</td>
              <td className="px-4 py-3 text-gray-600">{agentName(t.assignedTo)}</td>
              <td className="px-4 py-3">
                <StatusBadge value={t.priority} map={PRIORITY_STYLES} />
              </td>
              <td className={`px-4 py-3 whitespace-nowrap ${late ? 'font-medium text-red-600' : 'text-gray-600'}`}>
                {t.dueDate ? formatDate(t.dueDate) : '—'}
                {late && <span className="ml-1 text-xs">(overdue)</span>}
              </td>
              <td className="px-4 py-3">
                <Select value={t.status} onChange={(e) => setStatus.mutate({ id: t.id, status: e.target.value })} className="w-36 py-1 text-xs">
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
                    onClick={() => setModal({ mode: 'edit', row: t as Row })}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      remove.reset();
                      setDeleting(t as Row);
                    }}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
        {!data?.data.length && (
          <tr>
            <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
              {isFetching ? (
                'Loading…'
              ) : anyFilter ? (
                <span>
                  No tasks match these filters.{' '}
                  <button onClick={() => router.replace(pathname, { scroll: false })} className="font-medium text-brand hover:underline">
                    Clear filters
                  </button>
                </span>
              ) : (
                <span>
                  No tasks yet.{' '}
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
        <TaskModal
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
        title="Delete task"
      >
        {deleting && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <span className="font-medium text-gray-800">{deleting.title}</span>? This action cannot be undone.
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-850">{value.toLocaleString()}</p>
    </Card>
  );
}

function MetricButton({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone?: 'alert';
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left transition ${
        active ? 'border-brand ring-2 ring-brand/20' : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === 'alert' && value > 0 ? 'text-red-600' : 'text-gray-850'}`}>{value.toLocaleString()}</p>
    </button>
  );
}

function TaskModal({ row, onClose, onSubmit, pending }: { row?: Row; onClose: () => void; onSubmit: (b: any) => void; pending: boolean }) {
  const agents = useAgents();
  const [f, setF] = useState({
    title: row?.title ?? '',
    description: row?.description ?? '',
    assignedTo: row?.assignedTo ?? '',
    priority: row?.priority ?? 'MEDIUM',
    dueDate: row?.dueDate ? row.dueDate.slice(0, 10) : '',
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  return (
    <Modal open onClose={onClose} title={row ? 'Edit task' : 'New task'}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            title: f.title,
            description: f.description || undefined,
            assignedTo: f.assignedTo || undefined,
            priority: f.priority,
            dueDate: f.dueDate ? new Date(f.dueDate).toISOString() : undefined,
          });
        }}
        className="space-y-4"
      >
        <Field label="Title">
          <Input value={f.title} onChange={(e) => set('title', e.target.value)} required />
        </Field>
        <Field label="Description">
          <Textarea value={f.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Assignee">
            <Select value={f.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}>
              <option value="">—</option>
              {agents.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={f.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Due date">
            <Input type="date" value={f.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
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
    return 'This task can’t be deleted because it’s linked to other records. Remove those links first.';
  }
  return e?.message || 'Something went wrong while deleting. Please try again.';
}

/** Whole-day difference between a due date and today, in the local zone (negative = past). */
function daysUntil(value: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(value);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

/** A task is overdue if its due date has passed and it isn't done/cancelled. */
function isOverdue(dueDate: string | null, status: string) {
  return !!dueDate && status !== 'DONE' && status !== 'CANCELLED' && daysUntil(dueDate) < 0;
}

/** "IN_PROGRESS" → "In progress" for display. */
function statusLabel(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Short, locale-friendly date (e.g. "18 Jun 2026"). */
function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}
