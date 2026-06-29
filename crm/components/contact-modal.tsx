'use client';

import { useState } from 'react';
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui';

const CONTACT_TYPES = ['OWNER', 'BUYER', 'TENANT', 'LANDLORD', 'INVESTOR'] as const;
const SOURCES = ['WEBSITE', 'REFERRAL', 'WALK_IN', 'PHONE', 'SOCIAL', 'OTHER'] as const;

export type ContactModalRow = {
  id: string;
  code: string;
  fullName: string;
  contactType: string;
  source: string;
  phone: string | null;
  email: string | null;
  idNumber: string | null;
  notes: string | null;
};

export type ContactModalBody = {
  fullName: string;
  contactType: string;
  source: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  notes?: string;
};

export function ContactModal({
  row,
  onClose,
  onSubmit,
  pending,
}: {
  row?: ContactModalRow;
  onClose: () => void;
  onSubmit: (b: ContactModalBody) => void;
  pending: boolean;
}) {
  const [f, setF] = useState({
    fullName: row?.fullName ?? '',
    contactType: row?.contactType ?? 'OWNER',
    source: row?.source ?? 'WALK_IN',
    phone: row?.phone ?? '',
    email: row?.email ?? '',
    idNumber: row?.idNumber ?? '',
    notes: row?.notes ?? '',
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  return (
    <Modal open onClose={onClose} title={row ? `Edit ${row.code}` : 'New contact'}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            fullName: f.fullName,
            contactType: f.contactType,
            source: f.source,
            phone: f.phone || undefined,
            email: f.email || undefined,
            idNumber: f.idNumber || undefined,
            notes: f.notes || undefined,
          });
        }}
        className="space-y-4"
      >
        <Field label="Full name">
          <Input value={f.fullName} onChange={(e) => set('fullName', e.target.value)} required />
        </Field>
        <Field label="ID number">
          <Input value={f.idNumber} onChange={(e) => set('idNumber', e.target.value)} />
        </Field>
        {/* Type field hidden for now — contactType defaults to OWNER (see useState above).
        <Field label="Type">
          <Select value={f.contactType} onChange={(e) => set('contactType', e.target.value)}>
            {CONTACT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        */}
        <Field label="Source">
          <Select value={f.source} onChange={(e) => set('source', e.target.value)}>
            {SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <Input value={f.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
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
            {pending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
