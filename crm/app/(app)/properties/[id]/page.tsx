'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil } from 'lucide-react';
import { api, tx } from '@/lib/api';
import { Button, Card, Modal, StatusBadge } from '@/components/ui';
import { PropertyForm, fromProperty, toPropertyBody, type PropertyFormValues } from '@/components/property-form';
import { ImageManager } from '@/components/image-manager';
import { DocumentManager } from '@/components/document-manager';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  RESERVED: 'bg-amber-100 text-amber-700',
  SOLD: 'bg-blue-100 text-blue-700',
  RENTED: 'bg-purple-100 text-purple-700',
};

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: p } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => (await api.GET('/api/properties/{id}', { params: { path: { id } } })).data,
  });

  const update = useMutation({
    mutationFn: async (v: PropertyFormValues) => {
      const { data, error } = await api.PATCH('/api/properties/{id}', { params: { path: { id } }, body: toPropertyBody(v) });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property', id] });
      qc.invalidateQueries({ queryKey: ['properties'] });
      setEditing(false);
    },
  });

  if (!p) return <div className="p-8 text-sm text-gray-400">Loading…</div>;

  return (
    <div className="p-8">
      <Link href="/properties" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> Properties
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-brand">{tx(p.titleJson)}</h1>
            <StatusBadge value={p.status} map={STATUS_STYLES} />
          </div>
          <p className="mt-1 font-mono text-xs text-gray-500">
            {p.propertyCode} · {p.propertyType} · {p.listingType}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ImageManager propertyId={id} />
          <DocumentManager propertyId={id} />
        </div>

        <Card className="h-fit p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Details</h3>
          <dl className="space-y-2.5 text-sm">
            <Row label="Price" value={`${p.price.toLocaleString()} ${p.currency}`} />
            <Row label="Location" value={`${p.city}${p.area ? `, ${p.area}` : ''}`} />
            <Row label="Country" value={p.country ?? '—'} />
            {p.address && <Row label="Address" value={p.address} />}
            {p.cadastralZone && <Row label="Cadastral zone" value={p.cadastralZone} />}
            {(p.latitude != null || p.longitude != null) && (
              <Row label="Geo" value={`${p.latitude ?? '—'}, ${p.longitude ?? '—'}`} />
            )}
            <Row label="Bedrooms" value={p.bedrooms ?? '—'} />
            <Row label="Bathrooms" value={p.bathrooms ?? '—'} />
            {p.toilets != null && <Row label="Toilets" value={p.toilets} />}
            <Row label="Size" value={p.sizeM2 ? `${p.sizeM2} m²` : '—'} />
            {p.lotSizeM2 != null && <Row label="Lot size" value={`${p.lotSizeM2} m²`} />}
            {p.terraceM2 != null && <Row label="Terrace" value={`${p.terraceM2} m²`} />}
            {p.basementM2 != null && <Row label="Basement" value={`${p.basementM2} m²`} />}
            <Row label="Floor" value={p.floor ?? '—'} />
            {p.garage != null && <Row label="Garage" value={p.garage} />}
            {p.balconies != null && <Row label="Balconies" value={p.balconies} />}
            {p.orientation && <Row label="Orientation" value={p.orientation} />}
            {p.buildingCondition && (
              <Row label="Condition" value={p.buildingCondition === 'NEW_CONSTRUCTION' ? 'New construction' : 'Old construction'} />
            )}
            {p.yearBuilt != null && <Row label="Year built" value={p.yearBuilt} />}
            {p.publishedDate && <Row label="Published" value={p.publishedDate} />}
            <Row label="Parking" value={p.parking ? 'Yes' : 'No'} />
            <Row label="Elevator" value={p.elevator ? 'Yes' : 'No'} />
            <Row label="Storage" value={p.storage ? 'Yes' : 'No'} />
            <Row label="Furnished" value={p.furnished ? 'Yes' : 'No'} />
            <Row label="Featured" value={p.isFeatured ? 'Yes' : 'No'} />
          </dl>
          {p.attributesJson && Object.keys(p.attributesJson).length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Type details</h4>
              <dl className="space-y-2.5 text-sm">
                {Object.entries(p.attributesJson).map(([k, val]) => (
                  <Row key={k} label={attrLabel(k)} value={attrValue(val)} />
                ))}
              </dl>
            </div>
          )}
          {p.descriptionJson && <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-600">{tx(p.descriptionJson)}</p>}
        </Card>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title={`Edit ${p.propertyCode}`} wide>
        <PropertyForm
          initial={fromProperty(p)}
          onSubmit={(v) => update.mutate(v)}
          onCancel={() => setEditing(false)}
          pending={update.isPending}
          submitLabel="Save changes"
        />
      </Modal>
    </div>
  );
}

/** Humanize an attributes_json key, e.g. "main_road_access" → "Main road access". */
function attrLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/** Render an attributes_json value for display. */
function attrValue(val: unknown): React.ReactNode {
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (val === null || val === undefined) return '—';
  return String(val);
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800">{value}</dd>
    </div>
  );
}
