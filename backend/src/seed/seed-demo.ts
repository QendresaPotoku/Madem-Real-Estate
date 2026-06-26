import 'reflect-metadata';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { hash } from '@node-rs/argon2';
import { AppDataSource } from '../data-source';
import { Property, PropertyImage, User } from '../entities';
import type { Localized, Orientation, PropertyType } from '../schemas/enums';

/* eslint-disable @typescript-eslint/no-explicit-any */

const WEB_DATA = resolve(__dirname, '../../../web/src/data');
// Runtime-constructed paths so tsc doesn't type-check the web app's files.
async function loadWebData() {
  const props = await import(pathToFileURL(resolve(WEB_DATA, 'properties.ts')).href);
  const ags = await import(pathToFileURL(resolve(WEB_DATA, 'agents.ts')).href);
  return { properties: props.properties as any[], agents: ags.agents as any[] };
}

const TYPE_MAP: Record<string, PropertyType> = {
  Apartment: 'APARTMENT',
  House: 'HOUSE',
  Villa: 'VILLA',
  Office: 'OFFICE',
  Commercial: 'SHOP',
  Land: 'LAND',
  Warehouse: 'WAREHOUSE',
};

const ORIENTATIONS_4 = new Set(['NORTH', 'SOUTH', 'EAST', 'WEST']);

function mapStatus(s: string): { listingType: 'SALE' | 'RENT'; status: string } {
  if (s === 'For Rent') return { listingType: 'RENT', status: 'ACTIVE' };
  if (s === 'Sold') return { listingType: 'SALE', status: 'SOLD' };
  if (s === 'Reserved') return { listingType: 'SALE', status: 'RESERVED' };
  return { listingType: 'SALE', status: 'ACTIVE' };
}

async function seedDemo() {
  await AppDataSource.initialize();
  const { properties, agents } = await loadWebData();

  // 1) Agents → users (idempotent on email)
  const userRepo = AppDataSource.getRepository(User);
  const agentPasswordHash = await hash('agent12345');
  const agentIdMap = new Map<string, string>(); // a1.. → user uuid

  for (const a of agents) {
    let user = await userRepo.findOne({ where: { email: a.email } });
    if (!user) {
      user = userRepo.create({
        fullName: a.name,
        email: a.email,
        passwordHash: agentPasswordHash,
        role: 'AGENT',
        status: 'ACTIVE',
        phone: a.phone ?? null,
        photoUrl: a.image ?? null,
        titleJson: a.title as Localized,
        bioJson: a.specialties?.length ? { en: a.specialties.join(', '), sq: a.specialties.join(', '), de: a.specialties.join(', ') } : null,
      });
      await userRepo.save(user);
    }
    agentIdMap.set(a.id, user.id);
  }
  console.log(`✔ ${agents.length} agents upserted as users`);

  // 2) Properties (skip if any already present, to stay idempotent)
  const propRepo = AppDataSource.getRepository(Property);
  const existing = await propRepo.count();
  if (existing > 0) {
    console.log(`• ${existing} properties already exist — skipping property seed`);
    await AppDataSource.destroy();
    return;
  }

  const imageRepo = AppDataSource.getRepository(PropertyImage);
  let inserted = 0;
  for (const p of properties) {
    const { listingType, status } = mapStatus(p.status);
    const orientation = p.orientation ? String(p.orientation).toUpperCase() : null;
    const property = propRepo.create({
      listingType,
      status: status as any,
      propertyType: TYPE_MAP[p.type] ?? 'APARTMENT',
      titleJson: p.title as Localized,
      descriptionJson: p.description as Localized,
      price: p.price,
      currency: 'EUR',
      country: 'Kosovo',
      city: p.city,
      area: p.neighborhood ?? null,
      sizeM2: p.area ?? null,
      lotSizeM2: p.plotArea ?? null,
      bedrooms: p.bedrooms ?? null,
      bathrooms: p.bathrooms ?? null,
      floor: p.floor ?? null,
      yearBuilt: p.yearBuilt ?? null,
      orientation: orientation && ORIENTATIONS_4.has(orientation) ? (orientation as Orientation) : null,
      buildingCondition: ['New', 'Under Construction'].includes(p.condition) ? 'NEW_CONSTRUCTION' : p.condition ? 'OLD_CONSTRUCTION' : null,
      elevator: !!p.elevator,
      parking: !!p.parking,
      garage: p.garage ? 1 : null,
      furnished: false,
      isFeatured: !!p.isFeatured,
      agentUserId: agentIdMap.get(p.agentId)!,
      attributesJson: {
        legacyRef: p.referenceNumber,
        amenities: p.amenities ?? [],
        heating: p.heating ?? null,
        terrace: !!p.terrace,
        airConditioning: !!p.airConditioning,
      },
      publishedDate: p.createdAt ? String(p.createdAt).slice(0, 10) : null,
    });
    const saved = await propRepo.save(property);

    const images: string[] = p.images ?? [];
    await imageRepo.save(
      images.map((url, idx) =>
        imageRepo.create({ propertyId: saved.id, imageUrl: url, isCover: idx === 0, sortOrder: idx }),
      ),
    );
    inserted++;
  }

  console.log(`✔ ${inserted} properties seeded (with images)`);
  await AppDataSource.destroy();
  console.log('✅ demo seed complete');
}

seedDemo().catch((err) => {
  console.error('❌ demo seed failed:', err);
  process.exit(1);
});
