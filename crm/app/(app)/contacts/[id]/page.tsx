'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';
import { api, req } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button, Card, Field, Modal, PageHeader, Select, StatusBadge, Textarea } from '@/components/ui';

const ACTIVITY_TYPES = ['CALL', 'MEETING', 'MESSAGE', 'NOTE', 'FOLLOW_UP'] as const;

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [logging, setLogging] = useState(false);

  const { data: c } = useQuery({
    queryKey: ['contact', id],
    queryFn: async () => (await api.GET('/api/contacts/{id}', { params: { path: { id } } })).data,
  });
  const { data: activities } = useQuery({
    queryKey: ['activities', { contactId: id }],
    queryFn: async () => (await api.GET('/api/activities', { params: { query: { contactId: id, limit: 50 } } })).data?.data ?? [],
  });
  const { data: opps } = useQuery({
    queryKey: ['opportunities', { contactId: id }],
    queryFn: async () => (await api.GET('/api/opportunities', { params: { query: { contactId: id, limit: 50 } } })).data?.data ?? [],
  });

  const logActivity = useMutation({
    mutationFn: async (body: { type: string; note?: string }) =>
      req(api.POST('/api/activities', { body: { type: body.type as 'CALL', note: body.note, contactId: id } })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities', { contactId: id }] });
      setLogging(false);
      toast.success('Activity logged');
    },
  });

  if (!c) return <div className="p-8 text-sm text-gray-400">Loading…</div>;

  return (
    <div className="p-8">
      <Link href="/contacts" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> Contacts
      </Link>
      <PageHeader
        title={c.fullName}
        subtitle={`${c.code} · ${c.contactType}`}
        action={
          <Button onClick={() => setLogging(true)}>
            <Plus className="h-4 w-4" /> Log activity
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="h-fit p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Details</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Phone" value={c.phone ?? '—'} />
            <Row label="Email" value={c.email ?? '—'} />
            <Row label="ID number" value={c.idNumber ?? '—'} />
            <Row label="Source" value={c.source} />
            {c.notes && <p className="border-t border-gray-100 pt-2 text-gray-600">{c.notes}</p>}
          </dl>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Opportunities ({opps?.length ?? 0})</h3>
            {!opps?.length ? (
              <p className="text-sm text-gray-400">No opportunities.</p>
            ) : (
              <ul className="divide-y divide-gray-100 text-sm">
                {opps.map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-2">
                    <span className="text-gray-700">
                      {o.code} · {o.listingType} {o.propertyType}
                    </span>
                    <StatusBadge value={o.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Activity timeline ({activities?.length ?? 0})</h3>
            {!activities?.length ? (
              <p className="text-sm text-gray-400">No activity logged.</p>
            ) : (
              <ul className="space-y-3">
                {activities.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 text-sm">
                    <StatusBadge value={a.type} />
                    <div className="flex-1">
                      {a.note && <p className="text-gray-700">{a.note}</p>}
                      <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {logging && <LogModal onClose={() => setLogging(false)} onSubmit={(b) => logActivity.mutate(b)} pending={logActivity.isPending} />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800">{value}</dd>
    </div>
  );
}

function LogModal({ onClose, onSubmit, pending }: { onClose: () => void; onSubmit: (b: { type: string; note?: string }) => void; pending: boolean }) {
  const [type, setType] = useState('CALL');
  const [note, setNote] = useState('');
  return (
    <Modal open onClose={onClose} title="Log activity">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ type, note: note || undefined });
        }}
        className="space-y-4"
      >
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Note">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Log'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
