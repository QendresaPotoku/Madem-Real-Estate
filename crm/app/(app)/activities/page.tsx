'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Phone, Users2, MessageSquare, StickyNote, CalendarCheck, Plus } from 'lucide-react';
import { api, req } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useContacts, useProperties } from '@/lib/queries';
import { Button, Card, Field, Modal, PageHeader, Select, Textarea } from '@/components/ui';
import { RowActions } from '@/components/row-actions';

const TYPES = ['CALL', 'MEETING', 'MESSAGE', 'NOTE', 'FOLLOW_UP'] as const;
const ICONS: Record<string, React.ReactNode> = {
  CALL: <Phone className="h-4 w-4" />,
  MEETING: <Users2 className="h-4 w-4" />,
  MESSAGE: <MessageSquare className="h-4 w-4" />,
  NOTE: <StickyNote className="h-4 w-4" />,
  FOLLOW_UP: <CalendarCheck className="h-4 w-4" />,
};

export default function ActivitiesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const contacts = useContacts();
  const props = useProperties();
  const contactName = (id: string | null) => (id ? contacts.data?.find((c) => c.id === id)?.fullName : null);
  const propCode = (id: string | null) => (id ? props.data?.find((p) => p.id === id)?.propertyCode : null);

  const { data, isFetching } = useQuery({
    queryKey: ['activities'],
    placeholderData: keepPreviousData,
    queryFn: async () => (await api.GET('/api/activities', { params: { query: { limit: 50 } } })).data,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['activities'] });

  const create = useMutation({
    mutationFn: async (body: any) => req(api.POST('/api/activities', { body })),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast.success('Activity logged');
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => req(api.DELETE('/api/activities/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      invalidate();
      toast.success('Activity deleted');
    },
  });

  return (
    <div className="p-8">
      <PageHeader
        title="Activities"
        subtitle={`${data?.meta.total ?? 0} logged interactions`}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Log activity
          </Button>
        }
      />

      <Card className="p-2">
        {!data?.data.length ? (
          <p className="p-8 text-center text-sm text-gray-400">{isFetching ? 'Loading…' : 'No activities yet'}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.data.map((a) => (
              <li key={a.id} className="flex items-start gap-3 p-4 hover:bg-gray-50">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  {ICONS[a.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-800">{a.type}</span>
                    {contactName(a.contactId) && <span className="text-gray-400">· {contactName(a.contactId)}</span>}
                    {propCode(a.propertyId) && <span className="font-mono text-xs text-gray-400">· {propCode(a.propertyId)}</span>}
                  </div>
                  {a.note && <p className="mt-0.5 text-sm text-gray-600">{a.note}</p>}
                  <p className="mt-0.5 text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
                <RowActions onDelete={() => remove.mutate(a.id)} confirmLabel="Delete this activity?" />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {open && <ActivityModal onClose={() => setOpen(false)} onSubmit={(b) => create.mutate(b)} pending={create.isPending} />}
    </div>
  );
}

function ActivityModal({ onClose, onSubmit, pending }: { onClose: () => void; onSubmit: (b: any) => void; pending: boolean }) {
  const contacts = useContacts();
  const props = useProperties();
  const [f, setF] = useState({ type: 'CALL', contactId: '', propertyId: '', note: '' });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const valid = f.contactId || f.propertyId;

  return (
    <Modal open onClose={onClose} title="Log activity">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) {
            toast.error('Link the activity to a contact or property');
            return;
          }
          onSubmit({
            type: f.type,
            contactId: f.contactId || undefined,
            propertyId: f.propertyId || undefined,
            note: f.note || undefined,
          });
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-3 gap-4">
          <Field label="Type">
            <Select value={f.type} onChange={(e) => set('type', e.target.value)}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Contact">
            <Select value={f.contactId} onChange={(e) => set('contactId', e.target.value)}>
              <option value="">—</option>
              {contacts.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Property">
            <Select value={f.propertyId} onChange={(e) => set('propertyId', e.target.value)}>
              <option value="">—</option>
              {props.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.propertyCode}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Note">
          <Textarea value={f.note} onChange={(e) => set('note', e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Log activity'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
