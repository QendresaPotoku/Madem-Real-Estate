'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Building2,
  CalendarClock,
  FileSignature,
  FileWarning,
  Plus,
  TrendingUp,
  Target,
  UserPlus,
} from 'lucide-react';
import { api, req, tx } from '@/lib/api';
import { useNotifications } from '@/lib/queries';
import { Card } from '@/components/ui';

function StatCard({ label, value, sub, href, tone }: { label: string; value: number | string; sub?: string; href: string; tone?: 'alert' }) {
  return (
    <Link
      href={href}
      className={`rounded-xl border bg-white p-5 transition hover:shadow-sm ${
        tone === 'alert' && Number(value) > 0 ? 'border-gold/60 bg-gold/5' : 'border-gray-200'
      }`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-brand">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </Link>
  );
}

const QUICK_ACTIONS = [
  { href: '/properties', label: 'New Property', icon: Building2 },
  { href: '/contacts', label: 'New Contact', icon: UserPlus },
  { href: '/opportunities', label: 'New Opportunity', icon: Target },
  { href: '/viewings', label: 'New Viewing', icon: CalendarClock },
];

const DASHBOARD_PAGE_SIZE = 5;
const REVENUE_FILTERS = [
  { key: 'last7d', label: '7 days' },
  { key: 'last30d', label: '30 days' },
  { key: 'year', label: 'This year' },
] as const;
type RevenueFilter = (typeof REVENUE_FILTERS)[number]['key'];

export default function DashboardPage() {
  const router = useRouter();
  const [revenueFilter, setRevenueFilter] = useState<RevenueFilter>('last7d');
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => req(api.GET('/api/dashboard/summary')),
  });
  const { data: notif } = useNotifications();
  const unread = notif?.unreadCount ?? 0;

  if (isLoading || !data) {
    return (
      <div className="p-8">
        <h1 className="mb-1 text-2xl font-semibold text-brand">Dashboard</h1>
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  const a = data.attention;
  const isDueToday = (d: string) => new Date(d).getTime() <= new Date().setHours(23, 59, 59, 999);
  const generatedRevenue = ((data as any).generatedRevenue?.[revenueFilter] ?? 0) as number;
  const unpaidCommissions = ((data as any).unpaidCommissions ?? { count: 0, deals: [] }) as {
    count: number;
    deals: Array<{ id: string; code: string; propertyCode: string | null; mademCommissionValue: number | null }>;
  };

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-brand">Dashboard</h1>
      <p className="mb-6 text-sm text-gray-500">What needs your attention today</p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active listings" value={data.properties.active} sub={`${data.properties.total} total`} href="/properties" />
        <StatCard label="Open opportunities" value={data.opportunities.open} href="/opportunities" />
        <StatCard label="Active contracts" value={data.contracts.active} href="/contracts" />
        <StatCard label="New leads (7d)" value={data.leads.new7d} href="/opportunities" tone="alert" />
        <StatCard label="Unread notifications" value={unread} href="/notifications" tone="alert" />
        <StatCard label="Contracts expiring (30d)" value={data.contracts.expiringSoon} href="/contracts" tone="alert" />
        <StatCard label="Viewings today" value={data.viewings.today} href="/viewings" tone="alert" />
        <StatCard label="Unpaid commissions" value={unpaidCommissions.count} href="/deals" tone="alert" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/25 text-brand">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Generated Revenue</h2>
                <p className="text-xs text-gray-400">Collected Madem commission value from closed won deals</p>
              </div>
            </div>
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              {REVENUE_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setRevenueFilter(filter.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    revenueFilter === filter.key ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-5 text-3xl font-semibold text-brand">
            {generatedRevenue.toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 text-brand" /> <q.icon className="h-4 w-4 text-gray-400" /> {q.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Needs attention */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Needs attention</h2>
          <div className="space-y-4 text-sm">
            <AttnGroup
              icon={<Target className="h-4 w-4 text-brand" />}
              label={`${data.leads.new7d} new lead${data.leads.new7d === 1 ? '' : 's'} in the last 7 days`}
              count={data.leads.new7d}
              onClick={() => router.push('/opportunities')}
            />

            <AttnGroup
              icon={<FileWarning className="h-4 w-4 text-brand" />}
              label={`${data.properties.draft} draft propert${data.properties.draft === 1 ? 'y' : 'ies'} awaiting review`}
              count={data.properties.draft}
            >
              <PaginatedList
                items={a.draftProperties}
                pageSize={DASHBOARD_PAGE_SIZE}
                itemName="drafts"
                renderItem={(p) => <AttnItem key={p.id} onClick={() => router.push(`/properties/${p.id}`)} left={tx(p.titleJson)} right={p.propertyCode} />}
              />
            </AttnGroup>

            <AttnGroup
              icon={<CalendarClock className="h-4 w-4 text-brand" />}
              label={`${data.viewings.today} viewing${data.viewings.today === 1 ? '' : 's'} today`}
              count={data.viewings.today}
            >
              <PaginatedList
                items={a.viewingsToday}
                pageSize={DASHBOARD_PAGE_SIZE}
                itemName="viewings"
                renderItem={(v) => (
                  <AttnItem
                    key={v.id}
                    onClick={() => router.push('/viewings')}
                    left={v.propertyCode ?? 'Viewing'}
                    right={new Date(v.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                )}
              />
            </AttnGroup>

            <AttnGroup
              icon={<FileSignature className="h-4 w-4 text-brand" />}
              label={`${data.contracts.expiringSoon} contract${data.contracts.expiringSoon === 1 ? '' : 's'} expiring in 30 days`}
              count={data.contracts.expiringSoon}
            >
              <PaginatedList
                items={a.expiringContracts}
                pageSize={DASHBOARD_PAGE_SIZE}
                itemName="contracts"
                renderItem={(c) => <AttnItem key={c.id} onClick={() => router.push('/contracts')} left={c.code} right={c.endDate ?? '-'} />}
              />
            </AttnGroup>

            <AttnGroup
              icon={<Bell className="h-4 w-4 text-brand" />}
              label={`${unread} unread notification${unread === 1 ? '' : 's'}`}
              count={unread}
              onClick={() => router.push('/notifications')}
            />

            <AttnGroup
              icon={<FileWarning className="h-4 w-4 text-brand" />}
              label={`${unpaidCommissions.count} unpaid commission${unpaidCommissions.count === 1 ? '' : 's'}`}
              count={unpaidCommissions.count}
              onClick={() => router.push('/deals')}
            >
              <PaginatedList
                items={unpaidCommissions.deals}
                pageSize={DASHBOARD_PAGE_SIZE}
                itemName="unpaid commissions"
                renderItem={(d) => (
                  <AttnItem
                    key={d.id}
                    onClick={() => router.push(`/deals?dealId=${d.id}`)}
                    left={`${d.code}${d.propertyCode ? ` - ${d.propertyCode}` : ''}`}
                    right={(d.mademCommissionValue ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}
                  />
                )}
              />
            </AttnGroup>

            {data.leads.new7d === 0 &&
              data.properties.draft === 0 &&
              data.viewings.today === 0 &&
              data.contracts.expiringSoon === 0 &&
              unpaidCommissions.count === 0 &&
              unread === 0 && <p className="text-sm text-gray-400">All caught up — nothing needs attention.</p>}
          </div>
        </Card>

        {/* Contract reminders */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Contract reminders {data.reminders.due > 0 && <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-700">{data.reminders.due} due</span>}
          </h2>
          {data.reminders.upcoming.length === 0 ? (
            <p className="text-sm text-gray-400">No reminders.</p>
          ) : (
            <PaginatedList
              items={data.reminders.upcoming}
              pageSize={DASHBOARD_PAGE_SIZE}
              itemName="reminders"
              listClassName="space-y-2"
              renderItem={(rm) => {
                const due = isDueToday(rm.remindAt as unknown as string);
                return (
                  <li key={rm.id}>
                    <button
                      onClick={() => router.push('/contracts')}
                      className={`flex w-full items-start gap-3 rounded-lg border p-2.5 text-left text-sm transition hover:bg-gray-50 ${
                        due ? 'border-red-200 bg-red-50' : 'border-gray-100'
                      }`}
                    >
                      <span
                        className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                          due ? 'bg-red-200 text-red-800' : 'bg-gold/30 text-brand'
                        }`}
                      >
                        {new Date(rm.remindAt).toLocaleDateString()}
                      </span>
                      <span className="flex-1 text-gray-600">{rm.message ?? 'Contract reminder'}</span>
                      {due && <span className="text-[11px] font-semibold uppercase text-red-600">Due</span>}
                    </button>
                  </li>
                );
              }}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function AttnGroup({
  icon,
  label,
  count,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div>
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-2 text-left font-medium text-gray-700 ${onClick ? 'hover:text-brand' : 'cursor-default'}`}
      >
        {icon} {label}
      </button>
      {children && <div className="mt-1.5 space-y-1 pl-6">{children}</div>}
    </div>
  );
}

function AttnItem({ left, right, onClick }: { left: string; right: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-gray-600 hover:bg-gray-50">
      <span className="truncate">{left}</span>
      <span className="shrink-0 font-mono text-xs text-gray-400">{right}</span>
    </button>
  );
}

function PaginatedList<T>({
  items,
  pageSize,
  itemName,
  renderItem,
  listClassName = 'space-y-1',
}: {
  items: T[];
  pageSize: number;
  itemName: string;
  renderItem: (item: T) => React.ReactNode;
  listClassName?: string;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visible = items.slice(start, start + pageSize);

  return (
    <div>
      <div className={listClassName}>{visible.map(renderItem)}</div>
      {items.length > pageSize && (
        <div className="mt-2 flex items-center justify-between gap-3 pl-2 text-xs text-gray-400">
          <span>
            {start + 1}-{Math.min(start + pageSize, items.length)} of {items.length} {itemName}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded border border-gray-200 bg-white px-2 py-1 font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded border border-gray-200 bg-white px-2 py-1 font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
