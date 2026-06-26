'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { api, req } from '@/lib/api';
import { toast } from '@/lib/toast';
import { type LocationLookups, useLocationLookups } from '@/lib/queries';
import { Button, EmptyRow, Field, Input, PageHeader, Select, Table } from '@/components/ui';

const apiAny = api as any;

export default function LocationSettingsPage() {
  const qc = useQueryClient();
  const lookups = useLocationLookups();
  const data = lookups.data ?? { countries: [], cities: [], areas: [], cadastralZones: [] };
  const invalidate = () => qc.invalidateQueries({ queryKey: ['location-lookups'] });

  const create = useMutation({
    mutationFn: async ({ path, body }: { path: string; body: any }) => req(apiAny.POST(`/api/location-lookups/${path}`, { body })),
    onSuccess: () => {
      invalidate();
      toast.success('Location saved');
    },
  });
  const remove = useMutation({
    mutationFn: async ({ path, id }: { path: string; id: string }) => req(apiAny.DELETE(`/api/location-lookups/${path}/{id}`, { params: { path: { id } } })),
    onSuccess: () => {
      invalidate();
      toast.success('Location deleted');
    },
  });

  return (
    <div className="p-8">
      <PageHeader title="Location Data" subtitle="Manage countries, cities, areas and cadastral zones used in CRM forms" />
      <div className="grid grid-cols-2 gap-5">
        <CountryPanel data={data} pending={create.isPending || remove.isPending} onCreate={(name) => create.mutate({ path: 'countries', body: { name } })} onDelete={(id) => remove.mutate({ path: 'countries', id })} />
        <CityPanel data={data} pending={create.isPending || remove.isPending} onCreate={(body) => create.mutate({ path: 'cities', body })} onDelete={(id) => remove.mutate({ path: 'cities', id })} />
        <AreaPanel data={data} pending={create.isPending || remove.isPending} onCreate={(body) => create.mutate({ path: 'areas', body })} onDelete={(id) => remove.mutate({ path: 'areas', id })} />
        <CadastralZonePanel data={data} pending={create.isPending || remove.isPending} onCreate={(body) => create.mutate({ path: 'cadastral-zones', body })} onDelete={(id) => remove.mutate({ path: 'cadastral-zones', id })} />
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <MapPin className="h-4 w-4 text-brand" />
        <h2 className="font-medium text-gray-800">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function CountryPanel({ data, pending, onCreate, onDelete }: { data: LocationLookups; pending: boolean; onCreate: (name: string) => void; onDelete: (id: string) => void }) {
  const [name, setName] = useState('');
  return (
    <Panel title="Countries">
      <LookupForm pending={pending} onSubmit={() => { onCreate(name); setName(''); }}>
        <Field label="Country name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
      </LookupForm>
      <SimpleTable rows={data.countries} cols={['Country']} render={(row) => [row.name]} pending={pending} onDelete={onDelete} />
    </Panel>
  );
}

function CityPanel({ data, pending, onCreate, onDelete }: { data: LocationLookups; pending: boolean; onCreate: (body: { countryId: string; name: string }) => void; onDelete: (id: string) => void }) {
  const [countryId, setCountryId] = useState(data.countries[0]?.id ?? '');
  const [name, setName] = useState('');
  return (
    <Panel title="Cities">
      <LookupForm pending={pending || !countryId} onSubmit={() => { onCreate({ countryId, name }); setName(''); }}>
        <Field label="Country">
          <Select value={countryId} onChange={(e) => setCountryId(e.target.value)} required>
            <option value="">Select country...</option>
            {data.countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="City name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
      </LookupForm>
      <SimpleTable
        rows={data.cities}
        cols={['City', 'Country']}
        render={(row) => [row.name, data.countries.find((c) => c.id === row.countryId)?.name ?? '-']}
        pending={pending}
        onDelete={onDelete}
      />
    </Panel>
  );
}

function AreaPanel({ data, pending, onCreate, onDelete }: { data: LocationLookups; pending: boolean; onCreate: (body: { cityId: string; name: string }) => void; onDelete: (id: string) => void }) {
  const [countryId, setCountryId] = useState(data.countries[0]?.id ?? '');
  const [cityId, setCityId] = useState('');
  const [name, setName] = useState('');
  const cities = useMemo(() => data.cities.filter((c) => !countryId || c.countryId === countryId), [countryId, data.cities]);
  return (
    <Panel title="Areas / Neighborhoods">
      <LookupForm pending={pending || !cityId} onSubmit={() => { onCreate({ cityId, name }); setName(''); }}>
        <Field label="Country">
          <Select value={countryId} onChange={(e) => { setCountryId(e.target.value); setCityId(''); }}>
            <option value="">All countries</option>
            {data.countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="City">
          <Select value={cityId} onChange={(e) => setCityId(e.target.value)} required>
            <option value="">Select city...</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Area name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
      </LookupForm>
      <SimpleTable rows={data.areas} cols={['Area', 'City']} render={(row) => [row.name, cityLabel(data, row.cityId)]} pending={pending} onDelete={onDelete} />
    </Panel>
  );
}

function CadastralZonePanel({ data, pending, onCreate, onDelete }: { data: LocationLookups; pending: boolean; onCreate: (body: { cityId: string; name: string }) => void; onDelete: (id: string) => void }) {
  const [countryId, setCountryId] = useState(data.countries[0]?.id ?? '');
  const [cityId, setCityId] = useState('');
  const [name, setName] = useState('');
  const cities = useMemo(() => data.cities.filter((c) => !countryId || c.countryId === countryId), [countryId, data.cities]);
  return (
    <Panel title="Cadastral Zones">
      <LookupForm pending={pending || !cityId} onSubmit={() => { onCreate({ cityId, name }); setName(''); }}>
        <Field label="Country">
          <Select value={countryId} onChange={(e) => { setCountryId(e.target.value); setCityId(''); }}>
            <option value="">All countries</option>
            {data.countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="City">
          <Select value={cityId} onChange={(e) => setCityId(e.target.value)} required>
            <option value="">Select city...</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Cadastral zone">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
      </LookupForm>
      <SimpleTable rows={data.cadastralZones} cols={['Zone', 'City']} render={(row) => [row.name, cityLabel(data, row.cityId)]} pending={pending} onDelete={onDelete} />
    </Panel>
  );
}

function LookupForm({ children, pending, onSubmit }: { children: React.ReactNode; pending: boolean; onSubmit: () => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="mb-4 flex flex-wrap items-end gap-3 [&>div]:min-w-44 [&>div]:flex-1"
    >
      {children}
      <Button type="submit" disabled={pending}>
        <Plus className="h-4 w-4" /> Add
      </Button>
    </form>
  );
}

function SimpleTable<T extends { id: string }>({ rows, cols, render, pending, onDelete }: { rows: T[]; cols: string[]; render: (row: T) => string[]; pending: boolean; onDelete: (id: string) => void }) {
  return (
    <Table
      head={
        <tr>
          {cols.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}
          <th className="px-4 py-3 text-right">Actions</th>
        </tr>
      }
    >
      {rows.map((row) => (
        <tr key={row.id} className="hover:bg-gray-50">
          {render(row).map((value, i) => <td key={i} className="px-4 py-3 text-gray-700">{value}</td>)}
          <td className="px-4 py-3 text-right">
            <button type="button" onClick={() => onDelete(row.id)} disabled={pending} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </td>
        </tr>
      ))}
      {!rows.length && <EmptyRow cols={cols.length + 1} loading={pending} />}
    </Table>
  );
}

function cityLabel(data: LocationLookups, cityId: string) {
  const city = data.cities.find((c) => c.id === cityId);
  const country = city ? data.countries.find((c) => c.id === city.countryId) : null;
  return [city?.name, country?.name].filter(Boolean).join(', ') || '-';
}
