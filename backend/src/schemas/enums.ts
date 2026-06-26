/**
 * Single source of truth for all domain enums.
 * Used by TypeORM entities (column `enum`) and Zod schemas (z.enum).
 */

export const USER_ROLES = ['ADMIN', 'AGENT'] as const;
export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;

export const CONTACT_TYPES = ['OWNER', 'BUYER', 'TENANT', 'LANDLORD', 'INVESTOR'] as const;
export const CONTACT_SOURCES = ['WEBSITE', 'REFERRAL', 'WALK_IN', 'PHONE', 'SOCIAL', 'OTHER'] as const;

export const PROPERTY_STATUSES = ['DRAFT', 'ACTIVE', 'RESERVED', 'SOLD', 'RENTED', 'ARCHIVED'] as const;
export const LISTING_TYPES = ['SALE', 'RENT'] as const;
export const PROPERTY_TYPES = [
  'APARTMENT',
  'HOUSE',
  'VILLA',
  'LAND',
  'OFFICE',
  'SHOP',
  'WAREHOUSE',
  'BUILDING',
] as const;
export const ORIENTATIONS = ['NORTH', 'SOUTH', 'EAST', 'WEST'] as const;
export const BUILDING_CONDITIONS = ['NEW_CONSTRUCTION', 'OLD_CONSTRUCTION'] as const;

export const AGREEMENT_TYPES = ['OPEN', 'EXCLUSIVE'] as const;
export const AGREEMENT_STATUSES = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED'] as const;

export const OPPORTUNITY_STATUSES = [
  'NEW',
  'QUALIFIED',
  'VIEWING',
  'NEGOTIATING',
  'WON',
  'LOST',
] as const;

export const MATCH_STATUSES = ['SUGGESTED', 'SHARED', 'VIEWING', 'REJECTED', 'ACCEPTED'] as const;
export const VIEWING_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
export const OFFER_STATUSES = ['SUBMITTED', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'] as const;

export const DEAL_TYPES = ['SALE', 'RENT'] as const;
export const DEAL_STATUSES = ['OPEN', 'PENDING', 'CLOSED_WON', 'CLOSED_LOST', 'CANCELLED'] as const;

export const CONTRACT_TYPES = ['SALE', 'RENTAL'] as const;
export const CONTRACT_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
  'RENEWED',
  'COMPLETED',
] as const;

export const REMINDER_TYPES = ['EXPIRY', 'RENT_DUE', 'FOLLOW_UP', 'CUSTOM'] as const;
export const REMINDER_STATUSES = ['PENDING', 'SENT', 'DISMISSED', 'DONE'] as const;

export const COMMISSION_STATUSES = ['PENDING', 'INVOICED', 'PARTIAL', 'PAID', 'CANCELLED'] as const;
export const RECEIVER_TYPES = ['COMPANY', 'AGENT', 'PARTNER_COMPANY'] as const;

export const ACTIVITY_TYPES = ['CALL', 'MEETING', 'MESSAGE', 'NOTE', 'FOLLOW_UP'] as const;

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const TASK_STATUSES = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;

export const DOCUMENT_CATEGORIES = ['OWNERSHIP', 'CONTRACT', 'IDENTITY', 'FINANCIAL', 'OTHER'] as const;
export const DOCUMENT_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'] as const;

export const HEATING_KEYS = [
  'ELECTRICITY',
  'HEAT_PUMP',
  'DISTRICT_HEATING',
  'AC',
  'PELLET',
  'WOOD',
] as const;

// Convenience union types
export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type ContactType = (typeof CONTACT_TYPES)[number];
export type ContactSource = (typeof CONTACT_SOURCES)[number];
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];
export type ListingType = (typeof LISTING_TYPES)[number];
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type Orientation = (typeof ORIENTATIONS)[number];
export type BuildingCondition = (typeof BUILDING_CONDITIONS)[number];
export type AgreementType = (typeof AGREEMENT_TYPES)[number];
export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];
export type MatchStatus = (typeof MATCH_STATUSES)[number];
export type ViewingStatus = (typeof VIEWING_STATUSES)[number];
export type OfferStatus = (typeof OFFER_STATUSES)[number];
export type DealType = (typeof DEAL_TYPES)[number];
export type DealStatus = (typeof DEAL_STATUSES)[number];
export type ContractType = (typeof CONTRACT_TYPES)[number];
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
export type ReminderType = (typeof REMINDER_TYPES)[number];
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];
export type ReceiverType = (typeof RECEIVER_TYPES)[number];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

/** Trilingual text shape used by *_json text columns. */
export type Localized = { en: string; sq: string; de: string };
