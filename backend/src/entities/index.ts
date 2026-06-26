export { AbstractEntity } from './base.entity';
export { HeatingType, DocumentType } from './lookups.entity';
export { LocationArea, LocationCadastralZone, LocationCity, LocationCountry } from './location-lookups.entity';
export { User } from './user.entity';
export { Contact } from './contact.entity';
export { Property } from './property.entity';
export { PropertyImage } from './property-image.entity';
export { PropertyDocument } from './property-document.entity';
export { ListingAgreement } from './listing-agreement.entity';
export { AgreementReminder } from './agreement-reminder.entity';
export { Opportunity } from './opportunity.entity';
export { Match } from './match.entity';
export { Viewing } from './viewing.entity';
export { Offer } from './offer.entity';
export { Deal } from './deal.entity';
export { Contract } from './contract.entity';
export { ContractReminder } from './contract-reminder.entity';
export { Commission } from './commission.entity';
export { CommissionSplit } from './commission-split.entity';
export { Activity } from './activity.entity';
export { Task } from './task.entity';
export { Notification } from './notification.entity';

import { HeatingType, DocumentType } from './lookups.entity';
import { LocationArea, LocationCadastralZone, LocationCity, LocationCountry } from './location-lookups.entity';
import { User } from './user.entity';
import { Contact } from './contact.entity';
import { Property } from './property.entity';
import { PropertyImage } from './property-image.entity';
import { PropertyDocument } from './property-document.entity';
import { ListingAgreement } from './listing-agreement.entity';
import { AgreementReminder } from './agreement-reminder.entity';
import { Opportunity } from './opportunity.entity';
import { Match } from './match.entity';
import { Viewing } from './viewing.entity';
import { Offer } from './offer.entity';
import { Deal } from './deal.entity';
import { Contract } from './contract.entity';
import { ContractReminder } from './contract-reminder.entity';
import { Commission } from './commission.entity';
import { CommissionSplit } from './commission-split.entity';
import { Activity } from './activity.entity';
import { Task } from './task.entity';
import { Notification } from './notification.entity';

/** All entity classes, registered with the DataSource. */
export const entities = [
  HeatingType,
  DocumentType,
  LocationCountry,
  LocationCity,
  LocationArea,
  LocationCadastralZone,
  User,
  Contact,
  Property,
  PropertyImage,
  PropertyDocument,
  ListingAgreement,
  AgreementReminder,
  Opportunity,
  Match,
  Viewing,
  Offer,
  Deal,
  Contract,
  ContractReminder,
  Commission,
  CommissionSplit,
  Activity,
  Task,
  Notification,
];
