'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { api, req } from '@/lib/api';
import { useNotifications } from '@/lib/queries';
import { Button, Card, EmptyRow, PageHeader, Table } from '@/components/ui';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data, isFetching } = useNotifications();
  const items = data?.data ?? [];
  const unread = data?.unreadCount ?? 0;
  const invalidate = () => qc.invalidateQueries({ queryKey: ['notifications'] });

  const markRead = useMutation({
    mutationFn: async (id: string) => req(api.POST('/api/notifications/{id}/read', { params: { path: { id } } })),
    onSuccess: invalidate,
  });
  const markAll = useMutation({
    mutationFn: async () => req(api.POST('/api/notifications/read-all')),
    onSuccess: invalidate,
  });

  async function open(n: (typeof items)[number]) {
    if (!n.isRead) await markRead.mutateAsync(n.id);
    if (n.linkPath) router.push(n.linkPath);
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : 'All caught up'}
        action={
          <Button variant="secondary" onClick={() => markAll.mutate()} disabled={unread === 0 || markAll.isPending}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        }
      />

      <Table
        head={
          <tr>
            <th className="px-4 py-3 w-10"></th>
            <th className="px-4 py-3">Notification</th>
            <th className="px-4 py-3">When</th>
          </tr>
        }
      >
        {items.map((n) => (
          <tr
            key={n.id}
            onClick={() => open(n)}
            className={`cursor-pointer hover:bg-gray-50 ${n.isRead ? '' : 'bg-gold/5'}`}
          >
            <td className="px-4 py-3 align-top">
              <span className={`inline-block h-2 w-2 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-gold'}`} />
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-400" />
                <span className={n.isRead ? 'text-gray-700' : 'font-semibold text-gray-900'}>{n.title}</span>
              </div>
              {n.body && <p className="mt-1 pl-6 text-sm text-gray-500">{n.body}</p>}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400 align-top">
              {new Date(n.createdAt).toLocaleString()}
            </td>
          </tr>
        ))}
        {!items.length && <EmptyRow cols={3} loading={isFetching} />}
      </Table>

      <Card className="mt-4 p-3 text-xs text-gray-400">Notifications refresh automatically every minute.</Card>
    </div>
  );
}
