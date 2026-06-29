'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { ImageManager } from '@/components/image-manager';
import { ContactModal, type ContactModalBody } from '@/components/contact-modal';
import { api, req } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAgents, useContacts, useHeatingTypes, useLocationLookups } from '@/lib/queries';

const LISTING_TYPES = ['SALE', 'RENT'] as const;
const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'VILLA', 'LAND', 'OFFICE', 'SHOP', 'WAREHOUSE', 'BUILDING'] as const;
const STATUSES = ['DRAFT', 'ACTIVE', 'RESERVED', 'SOLD', 'RENTED', 'ARCHIVED'] as const;
const ORIENTATIONS = ['NORTH', 'SOUTH', 'EAST', 'WEST'] as const;
const BUILDING_CONDITIONS = ['NEW_CONSTRUCTION', 'OLD_CONSTRUCTION'] as const;

/* ── Type-specific attributes (stored in attributes_json) ─────────────────── */
type AttrField =
  | { key: string; label: string; type: 'number' | 'text' }
  | { key: string; label: string; type: 'boolean' }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[] };

const RESIDENTIAL: AttrField[] = [
  { key: 'living_rooms', label: 'Living rooms', type: 'number' },
  { key: 'working_rooms', label: 'Working rooms', type: 'number' },
];

export const ATTRIBUTES_BY_TYPE: Record<string, AttrField[]> = {
  APARTMENT: RESIDENTIAL,
  HOUSE: RESIDENTIAL,
  VILLA: RESIDENTIAL,
  BUILDING: [
    { key: 'living_rooms', label: 'Living units / rooms', type: 'number' },
    { key: 'working_rooms', label: 'Working rooms', type: 'number' },
  ],
  LAND: [
    {
      key: 'land_subtype',
      label: 'Land subtype',
      type: 'select',
      options: [
        { value: 'CONSTRUCTION', label: 'Construction land' },
        { value: 'AGRICULTURAL', label: 'Agricultural land' },
        { value: 'HOUSE_CONSTRUCTION', label: 'House construction' },
        { value: 'COMMERCIAL_DEVELOPMENT', label: 'Commercial development' },
      ],
    },
    { key: 'main_road_access', label: 'Main road / highway access', type: 'boolean' },
  ],
  OFFICE: [
    { key: 'working_rooms', label: 'Workspaces / working rooms', type: 'number' },
    { key: 'office_use', label: 'Office use', type: 'boolean' },
    { key: 'main_road_access', label: 'Main road location', type: 'boolean' },
  ],
  SHOP: [
    { key: 'working_rooms', label: 'Workspaces', type: 'number' },
    { key: 'main_road_access', label: 'Main road location', type: 'boolean' },
  ],
  WAREHOUSE: [
    { key: 'warehouse_height', label: 'Warehouse height (m)', type: 'number' },
    { key: 'power_capacity_kw', label: 'Power capacity (kW)', type: 'number' },
    { key: 'business_activity', label: 'Business activity', type: 'text' },
    { key: 'main_road_access', label: 'Main road access', type: 'boolean' },
  ],
};

/** Flat key → type lookup so we can coerce attribute values when building the body. */
const ATTR_TYPE: Record<string, AttrField['type']> = {};
for (const defs of Object.values(ATTRIBUTES_BY_TYPE)) for (const d of defs) ATTR_TYPE[d.key] = d.type;

export type PropertyFormValues = {
  listingType: string;
  propertyType: string;
  status: string;
  titleEn: string;
  titleSq: string;
  titleDe: string;
  descEn: string;
  descSq: string;
  descDe: string;
  price: string;
  currency: string;
  country: string;
  city: string;
  area: string;
  cadastralZone: string;
  address: string;
  latitude: string;
  longitude: string;
  bedrooms: string;
  bathrooms: string;
  toilets: string;
  floor: string;
  sizeM2: string;
  lotSizeM2: string;
  terraceM2: string;
  basementM2: string;
  garage: string;
  balconies: string;
  parking: boolean;
  elevator: boolean;
  storage: boolean;
  furnished: boolean;
  heatingTypeId: string;
  orientation: string;
  buildingCondition: string;
  yearBuilt: string;
  publishedDate: string;
  agentUserId: string;
  ownerContactId: string;
  isFeatured: boolean;
  attributes: Record<string, string | boolean>;
};

const EMPTY: PropertyFormValues = {
  listingType: 'SALE',
  propertyType: 'APARTMENT',
  status: 'DRAFT',
  titleEn: '',
  titleSq: '',
  titleDe: '',
  descEn: '',
  descSq: '',
  descDe: '',
  price: '',
  currency: 'EUR',
  country: 'Kosovo',
  city: '',
  area: '',
  cadastralZone: '',
  address: '',
  latitude: '',
  longitude: '',
  bedrooms: '',
  bathrooms: '',
  toilets: '',
  floor: '',
  sizeM2: '',
  lotSizeM2: '',
  terraceM2: '',
  basementM2: '',
  garage: '',
  balconies: '',
  parking: false,
  elevator: false,
  storage: false,
  furnished: false,
  heatingTypeId: '',
  orientation: '',
  buildingCondition: '',
  yearBuilt: '',
  publishedDate: '',
  agentUserId: '',
  ownerContactId: '',
  isFeatured: false,
  attributes: {},
};

/** Drop empties and coerce numeric attribute fields to numbers. */
function buildAttributes(attrs: Record<string, string | boolean>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(attrs)) {
    if (val === '' || val === undefined || val === null) continue;
    if (ATTR_TYPE[k] === 'number') {
      const n = Number(val);
      if (!Number.isNaN(n)) out[k] = n;
    } else {
      out[k] = val;
    }
  }
  return out;
}

/** Build the API request body from form values. */
export function toPropertyBody(v: PropertyFormValues) {
  const num = (s: string) => (s === '' ? undefined : Number(s));
  return {
    listingType: v.listingType as 'SALE',
    propertyType: v.propertyType as 'APARTMENT',
    status: v.status as 'DRAFT',
    titleJson: { en: v.titleEn, sq: v.titleSq || v.titleEn, de: v.titleDe || v.titleEn },
    descriptionJson: v.descEn || v.descSq || v.descDe ? { en: v.descEn, sq: v.descSq, de: v.descDe } : undefined,
    price: Number(v.price),
    currency: v.currency,
    country: v.country,
    city: v.city,
    area: v.area || undefined,
    cadastralZone: v.cadastralZone || undefined,
    address: v.address || undefined,
    latitude: num(v.latitude),
    longitude: num(v.longitude),
    bedrooms: num(v.bedrooms),
    bathrooms: num(v.bathrooms),
    toilets: num(v.toilets),
    floor: num(v.floor),
    sizeM2: num(v.sizeM2),
    lotSizeM2: num(v.lotSizeM2),
    terraceM2: num(v.terraceM2),
    basementM2: num(v.basementM2),
    garage: num(v.garage),
    balconies: num(v.balconies),
    parking: v.parking,
    elevator: v.elevator,
    storage: v.storage,
    furnished: v.furnished,
    heatingTypeId: v.heatingTypeId ? Number(v.heatingTypeId) : undefined,
    orientation: (v.orientation || undefined) as 'NORTH' | undefined,
    buildingCondition: (v.buildingCondition || undefined) as 'NEW_CONSTRUCTION' | undefined,
    yearBuilt: num(v.yearBuilt),
    publishedDate: v.publishedDate || undefined,
    agentUserId: v.agentUserId,
    ownerContactId: v.ownerContactId || undefined,
    isFeatured: v.isFeatured,
    attributesJson: buildAttributes(v.attributes),
  };
}

/** Map an API property response into form values for editing. */
export function fromProperty(p: Record<string, any>): Partial<PropertyFormValues> {
  const s = (n: unknown) => (n === null || n === undefined ? '' : String(n));
  const attributes: Record<string, string | boolean> = {};
  if (p.attributesJson && typeof p.attributesJson === 'object') {
    for (const [k, val] of Object.entries(p.attributesJson)) {
      attributes[k] = typeof val === 'boolean' ? val : s(val);
    }
  }
  return {
    listingType: p.listingType,
    propertyType: p.propertyType,
    status: p.status,
    titleEn: p.titleJson?.en ?? '',
    titleSq: p.titleJson?.sq ?? '',
    titleDe: p.titleJson?.de ?? '',
    descEn: p.descriptionJson?.en ?? '',
    descSq: p.descriptionJson?.sq ?? '',
    descDe: p.descriptionJson?.de ?? '',
    price: s(p.price),
    currency: p.currency ?? 'EUR',
    country: p.country ?? 'Kosovo',
    city: p.city ?? '',
    area: p.area ?? '',
    cadastralZone: p.cadastralZone ?? '',
    address: p.address ?? '',
    latitude: s(p.latitude),
    longitude: s(p.longitude),
    bedrooms: s(p.bedrooms),
    bathrooms: s(p.bathrooms),
    toilets: s(p.toilets),
    floor: s(p.floor),
    sizeM2: s(p.sizeM2),
    lotSizeM2: s(p.lotSizeM2),
    terraceM2: s(p.terraceM2),
    basementM2: s(p.basementM2),
    garage: s(p.garage),
    balconies: s(p.balconies),
    parking: !!p.parking,
    elevator: !!p.elevator,
    storage: !!p.storage,
    furnished: !!p.furnished,
    heatingTypeId: s(p.heatingTypeId),
    orientation: p.orientation ?? '',
    buildingCondition: p.buildingCondition ?? '',
    yearBuilt: s(p.yearBuilt),
    publishedDate: p.publishedDate ?? '',
    agentUserId: p.agentUserId ?? '',
    ownerContactId: p.ownerContactId ?? '',
    isFeatured: !!p.isFeatured,
    attributes,
  };
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="border-t border-gray-100 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">{children}</p>;
}

function optionNames(names: string[], current: string) {
  return Array.from(new Set([...names, current].filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

/** A photo staged in the create form before the property (and its id) exist. */
export type StagedImage = { file: File; url: string };

export function PropertyForm({
  initial,
  onSubmit,
  onCancel,
  pending,
  submitLabel = 'Save',
  enableImages = false,
  propertyId,
}: {
  initial?: Partial<PropertyFormValues>;
  onSubmit: (v: PropertyFormValues, images: File[]) => void;
  onCancel: () => void;
  pending: boolean;
  submitLabel?: string;
  /** Show a final "Photos" step. On create (no propertyId) it stages files; on edit it manages live images. */
  enableImages?: boolean;
  /** When set, the Photos step manages this property's existing images directly. Used on edit. */
  propertyId?: string;
}) {
  const [v, setV] = useState<PropertyFormValues>({ ...EMPTY, ...initial, attributes: { ...EMPTY.attributes, ...initial?.attributes } });
  const set = <K extends keyof PropertyFormValues>(k: K, val: PropertyFormValues[K]) => setV((s) => ({ ...s, [k]: val }));
  const setAttr = (k: string, val: string | boolean) => setV((s) => ({ ...s, attributes: { ...s.attributes, [k]: val } }));
  const agents = useAgents();
  const owners = useContacts('OWNER');
  const heating = useHeatingTypes();
  const locations = useLocationLookups();

  // Inline "create owner" so a new owner can be added without leaving the form.
  const qc = useQueryClient();
  const [contactOpen, setContactOpen] = useState(false);
  const createContact = useMutation({
    mutationFn: (body: ContactModalBody) => req(api.POST('/api/contacts', { body: body as never })),
    onSuccess: (contact: any) => {
      qc.invalidateQueries({ queryKey: ['contacts-options'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      set('ownerContactId', contact.id);
      setContactOpen(false);
      toast.success('Contact saved');
    },
  });

  const attrDefs = ATTRIBUTES_BY_TYPE[v.propertyType] ?? [];
  const lastStep = enableImages ? 3 : 2;
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Photos staged locally — uploaded by the caller after the property is created.
  const [images, setImages] = useState<StagedImage[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setImages((s) => [...s, ...next]);
    if (fileRef.current) fileRef.current.value = '';
  };
  const removeImage = (i: number) =>
    setImages((s) => {
      URL.revokeObjectURL(s[i].url);
      return s.filter((_, j) => j !== i);
    });
  const makeCover = (i: number) => setImages((s) => (i === 0 ? s : [s[i], ...s.filter((_, j) => j !== i)]));
  // Revoke any remaining preview URLs when the form unmounts.
  useEffect(() => () => setImages((s) => (s.forEach((img) => URL.revokeObjectURL(img.url)), s)), []);
  const country = locations.data?.countries.find((c) => c.name === v.country);
  const cities = locations.data?.cities.filter((c) => !country || c.countryId === country.id).map((c) => c.name) ?? [];
  const city = locations.data?.cities.find((c) => c.name === v.city && (!country || c.countryId === country.id));
  const areas = locations.data?.areas.filter((a) => !city || a.cityId === city.id).map((a) => a.name) ?? [];
  const cadastralZones = locations.data?.cadastralZones.filter((z) => !city || z.cityId === city.id).map((z) => z.name) ?? [];

  return (
    <>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (step < lastStep) {
          setStep((s) => (s + 1) as 1 | 2 | 3);
          return;
        }
        onSubmit(v, images.map((img) => img.file));
      }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3 text-xs font-medium">
        <span className={step === 1 ? 'text-brand' : 'text-gray-400'}>1 · Basics, pricing &amp; location</span>
        <span className="h-px flex-1 bg-gray-200" />
        <span className={step === 2 ? 'text-brand' : 'text-gray-400'}>2 · Property details &amp; assignment</span>
        {enableImages && (
          <>
            <span className="h-px flex-1 bg-gray-200" />
            <span className={step === 3 ? 'text-brand' : 'text-gray-400'}>3 · Photos</span>
          </>
        )}
      </div>
      <p className="text-xs text-gray-400">
        Fields marked <span className="text-red-500">*</span> are required.
      </p>

      {step === 1 && (
      <div className="space-y-5">
      <SectionTitle>Basic Information</SectionTitle>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Listing">
          <Select value={v.listingType} onChange={(e) => set('listingType', e.target.value)}>
            {LISTING_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Type">
          <Select value={v.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
            {PROPERTY_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={v.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-gray-700">
          Title <span className="text-red-500">*</span> <span className="font-normal text-gray-400">(en / sq / de)</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="English" value={v.titleEn} onChange={(e) => set('titleEn', e.target.value)} required />
          <Input placeholder="Shqip" value={v.titleSq} onChange={(e) => set('titleSq', e.target.value)} />
          <Input placeholder="Deutsch" value={v.titleDe} onChange={(e) => set('titleDe', e.target.value)} />
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-gray-700">
          Description <span className="font-normal text-gray-400">(en / sq / de)</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Textarea placeholder="English" value={v.descEn} onChange={(e) => set('descEn', e.target.value)} />
          <Textarea placeholder="Shqip" value={v.descSq} onChange={(e) => set('descSq', e.target.value)} />
          <Textarea placeholder="Deutsch" value={v.descDe} onChange={(e) => set('descDe', e.target.value)} />
        </div>
      </div>

      <SectionTitle>Pricing</SectionTitle>
      <div className="grid grid-cols-4 gap-4">
        <Field label="Price" required>
          <Input type="number" value={v.price} onChange={(e) => set('price', e.target.value)} required />
        </Field>
        <Field label="Currency">
          <Input value={v.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} maxLength={3} />
        </Field>
        <Field label="Published date">
          <Input type="date" value={v.publishedDate} onChange={(e) => set('publishedDate', e.target.value)} />
        </Field>
      </div>

      <SectionTitle>Location</SectionTitle>
      <div className="grid grid-cols-4 gap-4">
        <Field label="Country" required>
          <Select
            value={v.country}
            onChange={(e) => {
              set('country', e.target.value);
              set('city', '');
              set('area', '');
              set('cadastralZone', '');
            }}
            required
          >
            <option value="">Select country...</option>
            {optionNames(locations.data?.countries.map((c) => c.name) ?? [], v.country).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </Select>
        </Field>
        <Field label="City" required>
          <Select
            value={v.city}
            onChange={(e) => {
              set('city', e.target.value);
              set('area', '');
              set('cadastralZone', '');
            }}
            required
          >
            <option value="">Select city...</option>
            {optionNames(cities, v.city).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Area / neighborhood">
          <Select value={v.area} onChange={(e) => set('area', e.target.value)}>
            <option value="">Select area...</option>
            {optionNames(areas, v.area).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Cadastral zone">
          <Select value={v.cadastralZone} onChange={(e) => set('cadastralZone', e.target.value)}>
            <option value="">Select cadastral zone...</option>
            {optionNames(cadastralZones, v.cadastralZone).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Address">
          <Input value={v.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
        <Field label="Latitude">
          <Input type="number" step="any" value={v.latitude} onChange={(e) => set('latitude', e.target.value)} />
        </Field>
        <Field label="Longitude">
          <Input type="number" step="any" value={v.longitude} onChange={(e) => set('longitude', e.target.value)} />
        </Field>
      </div>

      </div>
      )}

      {step === 2 && (
      <div className="space-y-5">
      <SectionTitle>Property Details</SectionTitle>
      <div className="grid grid-cols-4 gap-4">
        <Field label="Bedrooms">
          <Input type="number" value={v.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
        </Field>
        <Field label="Bathrooms">
          <Input type="number" value={v.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
        </Field>
        <Field label="Toilets">
          <Input type="number" value={v.toilets} onChange={(e) => set('toilets', e.target.value)} />
        </Field>
        <Field label="Floor">
          <Input type="number" value={v.floor} onChange={(e) => set('floor', e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Field label="Size (m²)">
          <Input type="number" value={v.sizeM2} onChange={(e) => set('sizeM2', e.target.value)} />
        </Field>
        <Field label="Lot size (m²)">
          <Input type="number" value={v.lotSizeM2} onChange={(e) => set('lotSizeM2', e.target.value)} />
        </Field>
        <Field label="Terrace (m²)">
          <Input type="number" value={v.terraceM2} onChange={(e) => set('terraceM2', e.target.value)} />
        </Field>
        <Field label="Basement (m²)">
          <Input type="number" value={v.basementM2} onChange={(e) => set('basementM2', e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Field label="Garage (spaces)">
          <Input type="number" value={v.garage} onChange={(e) => set('garage', e.target.value)} />
        </Field>
        <Field label="Balconies">
          <Input type="number" value={v.balconies} onChange={(e) => set('balconies', e.target.value)} />
        </Field>
        <Field label="Orientation">
          <Select value={v.orientation} onChange={(e) => set('orientation', e.target.value)}>
            <option value="">—</option>
            {ORIENTATIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Field>
        <Field label="Building condition">
          <Select value={v.buildingCondition} onChange={(e) => set('buildingCondition', e.target.value)}>
            <option value="">—</option>
            {BUILDING_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c === 'NEW_CONSTRUCTION' ? 'New construction' : 'Old construction'}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Year built">
          <Input type="number" value={v.yearBuilt} onChange={(e) => set('yearBuilt', e.target.value)} />
        </Field>
      </div>

      <SectionTitle>Features</SectionTitle>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Heating">
          <Select value={v.heatingTypeId} onChange={(e) => set('heatingTypeId', e.target.value)}>
            <option value="">—</option>
            {heating.data?.map((h) => (
              <option key={h.id} value={h.id}>
                {h.labelJson.en}
              </option>
            ))}
          </Select>
        </Field>
        <div className="col-span-2 flex flex-wrap items-center gap-x-6 gap-y-2 pt-6">
          <Check label="Parking" checked={v.parking} onChange={(b) => set('parking', b)} />
          <Check label="Elevator" checked={v.elevator} onChange={(b) => set('elevator', b)} />
          <Check label="Storage" checked={v.storage} onChange={(b) => set('storage', b)} />
          <Check label="Furnished" checked={v.furnished} onChange={(b) => set('furnished', b)} />
          <Check label="Featured" checked={v.isFeatured} onChange={(b) => set('isFeatured', b)} />
        </div>
      </div>

      {attrDefs.length > 0 && (
        <>
          <SectionTitle>{v.propertyType.charAt(0) + v.propertyType.slice(1).toLowerCase()} details</SectionTitle>
          <div className="grid grid-cols-3 gap-4">
            {attrDefs.map((def) =>
              def.type === 'boolean' ? (
                <div key={def.key} className="flex items-center pt-6">
                  <Check
                    label={def.label}
                    checked={v.attributes[def.key] === true}
                    onChange={(b) => setAttr(def.key, b)}
                  />
                </div>
              ) : def.type === 'select' ? (
                <Field key={def.key} label={def.label}>
                  <Select value={String(v.attributes[def.key] ?? '')} onChange={(e) => setAttr(def.key, e.target.value)}>
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
                    value={String(v.attributes[def.key] ?? '')}
                    onChange={(e) => setAttr(def.key, e.target.value)}
                  />
                </Field>
              ),
            )}
          </div>
        </>
      )}

      <SectionTitle>Assignment</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Agent" required>
          <Select value={v.agentUserId} onChange={(e) => set('agentUserId', e.target.value)} required>
            <option value="">Select agent…</option>
            {agents.data?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.fullName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Owner">
          <Select value={v.ownerContactId} onChange={(e) => set('ownerContactId', e.target.value)}>
            <option value="">—</option>
            {owners.data?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.fullName} ({o.code})
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-gray-500">
            Owner not listed?{' '}
            <button type="button" className="font-medium text-brand hover:underline" onClick={() => setContactOpen(true)}>
              Create new contact
            </button>
          </p>
        </Field>
      </div>

      </div>
      )}

      {enableImages && step === 3 && propertyId && (
      <div className="space-y-5">
      <SectionTitle>Photos</SectionTitle>
      <ImageManager propertyId={propertyId} />
      </div>
      )}

      {enableImages && step === 3 && !propertyId && (
      <div className="space-y-5">
      <SectionTitle>Photos</SectionTitle>
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center transition hover:border-brand/40 hover:bg-gray-100"
      >
        <ImagePlus className="h-7 w-7 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">Click to upload or drag &amp; drop</p>
        <p className="text-xs text-gray-400">PNG or JPG. The first photo is used as the cover.</p>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <div key={img.url} className="group relative overflow-hidden rounded-lg border border-gray-200">
              <img src={img.url} alt="" className="aspect-[4/3] w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-brand">COVER</span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-black/50 p-1.5 opacity-0 transition group-hover:opacity-100">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(i)}
                    className="rounded bg-white/20 p-1 text-white hover:bg-white/40"
                    title="Set as cover"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="rounded bg-white/20 p-1 text-white hover:bg-red-500"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400">
        {images.length
          ? `${images.length} photo${images.length === 1 ? '' : 's'} ready — uploaded after the property is created.`
          : 'No photos added. You can also add them later from the property page.'}
      </p>
      </div>
      )}

      <div className="sticky -bottom-5 -mx-6 -mb-5 flex items-center gap-2 border-t border-gray-100 bg-white px-6 py-4">
        <span className="text-xs text-gray-400">Step {step} of {lastStep}</span>
        <div className="ml-auto flex gap-2">
          {step > 1 && (
            <Button type="button" variant="secondary" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
              Back
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          {step < lastStep ? (
            <Button type="submit">Next</Button>
          ) : (
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : submitLabel}
            </Button>
          )}
        </div>
      </div>
    </form>

    {contactOpen && (
      <ContactModal
        onClose={() => setContactOpen(false)}
        onSubmit={(body) => createContact.mutate(body)}
        pending={createContact.isPending}
      />
    )}
    </>
  );
}
