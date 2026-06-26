import 'reflect-metadata';
import { hash } from '@node-rs/argon2';
import { AppDataSource } from '../data-source';
import { config } from '../config';
import { DocumentType, HeatingType, User } from '../entities';
import { HEATING_KEYS, type Localized } from '../schemas/enums';

const heatingLabels: Record<string, Localized> = {
  ELECTRICITY: { en: 'Electricity', sq: 'Energji elektrike', de: 'Strom' },
  HEAT_PUMP: { en: 'Heat Pump', sq: 'Pompë nxehtësie', de: 'Wärmepumpe' },
  DISTRICT_HEATING: { en: 'District Heating', sq: 'Ngrohje qendrore', de: 'Fernwärme' },
  AC: { en: 'Air Conditioning', sq: 'Kondicioner', de: 'Klimaanlage' },
  PELLET: { en: 'Pellet', sq: 'Pelet', de: 'Pellet' },
  WOOD: { en: 'Wood', sq: 'Dru', de: 'Holz' },
};

const documentTypes: Array<{ category: DocumentType['category']; key: string; label: Localized }> = [
  { category: 'OWNERSHIP', key: 'TITLE_DEED', label: { en: 'Title Deed', sq: 'Fletë poseduese', de: 'Eigentumsurkunde' } },
  { category: 'CONTRACT', key: 'NOTARY_CONTRACT', label: { en: 'Notary Contract', sq: 'Kontratë noteriale', de: 'Notarvertrag' } },
  { category: 'CONTRACT', key: 'LAWYER_CONTRACT', label: { en: 'Lawyer Contract', sq: 'Kontratë avokati', de: 'Anwaltsvertrag' } },
  { category: 'IDENTITY', key: 'ID_CARD', label: { en: 'ID Card', sq: 'Letërnjoftim', de: 'Personalausweis' } },
];

async function seed() {
  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();

  // Admin user (idempotent on email)
  const userRepo = AppDataSource.getRepository(User);
  const existingAdmin = await userRepo.findOne({ where: { email: config.ADMIN_EMAIL } });
  if (!existingAdmin) {
    const passwordHash = await hash(config.ADMIN_PASSWORD);
    const admin = userRepo.create({
      fullName: config.ADMIN_NAME,
      email: config.ADMIN_EMAIL,
      role: 'ADMIN',
      status: 'ACTIVE',
      passwordHash,
    });
    await userRepo.save(admin);
    console.log(`✔ admin user created: ${config.ADMIN_EMAIL}`);
  } else {
    console.log(`• admin user already exists: ${config.ADMIN_EMAIL}`);
  }

  // Heating types (idempotent upsert on key)
  for (let i = 0; i < HEATING_KEYS.length; i++) {
    const key = HEATING_KEYS[i];
    await queryRunner.query(
      `INSERT INTO heating_types(key, label_json, is_active, sort_order)
       VALUES ($1, $2, true, $3)
       ON CONFLICT (key) DO UPDATE SET label_json = EXCLUDED.label_json, sort_order = EXCLUDED.sort_order`,
      [key, JSON.stringify(heatingLabels[key]), i],
    );
  }
  console.log(`✔ ${HEATING_KEYS.length} heating types seeded`);

  // Document types (idempotent upsert on key)
  for (const d of documentTypes) {
    await queryRunner.query(
      `INSERT INTO document_types(category, key, label_json, is_active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (key) DO UPDATE SET category = EXCLUDED.category, label_json = EXCLUDED.label_json`,
      [d.category, d.key, JSON.stringify(d.label)],
    );
  }
  console.log(`✔ ${documentTypes.length} document types seeded`);

  // Touch repos to keep imports meaningful and validate metadata
  void AppDataSource.getRepository(HeatingType);

  await queryRunner.release();
  await AppDataSource.destroy();
  console.log('✅ seed complete');
}

seed().catch((err) => {
  console.error('❌ seed failed:', err);
  process.exit(1);
});
