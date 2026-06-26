'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api, req } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button, EmptyRow, Field, Input, Modal, PageHeader, Select, StatusBadge, Table } from '@/components/ui';
import { RowActions } from '@/components/row-actions';

const ROLES = ['ADMIN', 'AGENT'] as const;
const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
const ROLE_STYLES: Record<string, string> = { ADMIN: 'bg-brand text-gold', AGENT: 'bg-blue-100 text-blue-700' };

type Row = { id: string; fullName: string; email: string; phone: string | null; role: string; status: string; titleJson: { en: string } | null };

export default function UsersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; row: Row } | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['users'],
    placeholderData: keepPreviousData,
    queryFn: async () => (await api.GET('/api/users', { params: { query: { limit: 50 } } })).data,
  });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['users'] });
    qc.invalidateQueries({ queryKey: ['agents'] });
  };

  const save = useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: any }) =>
      id ? req(api.PATCH('/api/users/{id}', { params: { path: { id } }, body })) : req(api.POST('/api/users', { body })),
    onSuccess: () => {
      invalidate();
      setModal(null);
      toast.success('User saved');
    },
  });
  const deactivate = useMutation({
    mutationFn: async (id: string) => req(api.DELETE('/api/users/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      invalidate();
      toast.success('User deactivated');
    },
  });

  return (
    <div className="p-8">
      <PageHeader
        title="Users & Agents"
        subtitle={`${data?.meta.total ?? 0} accounts`}
        action={
          <Button onClick={() => setModal({ mode: 'create' })}>
            <Plus className="h-4 w-4" /> New user
          </Button>
        }
      />

      <Table
        head={
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3"></th>
          </tr>
        }
      >
        {data?.data.map((u) => (
          <tr key={u.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-gray-800">{u.fullName}</td>
            <td className="px-4 py-3 text-gray-600">{u.email}</td>
            <td className="px-4 py-3">
              <StatusBadge value={u.role} map={ROLE_STYLES} />
            </td>
            <td className="px-4 py-3">
              <StatusBadge value={u.status} />
            </td>
            <td className="px-4 py-3 text-gray-600">{u.phone ?? '—'}</td>
            <td className="px-4 py-3">
              <RowActions
                onEdit={() => setModal({ mode: 'edit', row: u as Row })}
                onDelete={() => deactivate.mutate(u.id)}
                confirmLabel={`Deactivate ${u.fullName}?`}
              />
            </td>
          </tr>
        ))}
        {!data?.data.length && <EmptyRow cols={6} loading={isFetching} />}
      </Table>

      {modal && (
        <UserModal
          row={modal.mode === 'edit' ? modal.row : undefined}
          onClose={() => setModal(null)}
          onSubmit={(body) => save.mutate({ id: modal.mode === 'edit' ? modal.row.id : undefined, body })}
          pending={save.isPending}
        />
      )}
    </div>
  );
}

function UserModal({ row, onClose, onSubmit, pending }: { row?: Row; onClose: () => void; onSubmit: (b: any) => void; pending: boolean }) {
  const editing = !!row;
  const [f, setF] = useState({
    fullName: row?.fullName ?? '',
    email: row?.email ?? '',
    password: '',
    phone: row?.phone ?? '',
    role: row?.role ?? 'AGENT',
    status: row?.status ?? 'ACTIVE',
    titleEn: row?.titleJson?.en ?? '',
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  return (
    <Modal open onClose={onClose} title={editing ? `Edit ${row!.fullName}` : 'New user / agent'}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const body: any = {
            fullName: f.fullName,
            email: f.email,
            phone: f.phone || undefined,
            role: f.role,
            titleJson: f.titleEn ? { en: f.titleEn, sq: f.titleEn, de: f.titleEn } : undefined,
          };
          if (editing) body.status = f.status;
          if (f.password) body.password = f.password;
          onSubmit(body);
        }}
        className="space-y-4"
      >
        <Field label="Full name">
          <Input value={f.fullName} onChange={(e) => set('fullName', e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <Input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} required />
          </Field>
          <Field label={editing ? 'New password (optional)' : 'Password'}>
            <Input type="password" value={f.password} onChange={(e) => set('password', e.target.value)} minLength={8} required={!editing} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Role">
            <Select value={f.role} onChange={(e) => set('role', e.target.value)}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
          {editing ? (
            <Field label="Status">
              <Select value={f.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Phone">
              <Input value={f.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
          )}
          <Field label="Title (agent)">
            <Input value={f.titleEn} onChange={(e) => set('titleEn', e.target.value)} placeholder="e.g. Consultant" />
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
