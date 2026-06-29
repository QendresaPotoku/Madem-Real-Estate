import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { config } from './config';
import { entities } from './entities';
import { InitialSchema1710000000000 } from './migrations/1710000000000-InitialSchema';
import { DropActivityEntityCheck1710000001000 } from './migrations/1710000001000-DropActivityEntityCheck';
import { AddNotifications1710000002000 } from './migrations/1710000002000-AddNotifications';
import { AddAgreementReminders1710000003000 } from './migrations/1710000003000-AddAgreementReminders';
import { AddDealMademCommissionValue1710000004000 } from './migrations/1710000004000-AddDealMademCommissionValue';
import { AddDealCommissionPaid1710000005000 } from './migrations/1710000005000-AddDealCommissionPaid';
import { AddLocationLookups1710000006000 } from './migrations/1710000006000-AddLocationLookups';
import { RemoveOpportunityMatchingStatus1710000007000 } from './migrations/1710000007000-RemoveOpportunityMatchingStatus';
import { AddContactIdNumber1710000008000 } from './migrations/1710000008000-AddContactIdNumber';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.DATABASE_URL,
  entities,
  migrations: [
    InitialSchema1710000000000,
    DropActivityEntityCheck1710000001000,
    AddNotifications1710000002000,
    AddAgreementReminders1710000003000,
    AddDealMademCommissionValue1710000004000,
    AddDealCommissionPaid1710000005000,
    AddLocationLookups1710000006000,
    RemoveOpportunityMatchingStatus1710000007000,
    AddContactIdNumber1710000008000,
  ],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  migrationsRun: false,
  logging: config.NODE_ENV === 'development' ? ['error', 'warn', 'migration'] : ['error'],
});
