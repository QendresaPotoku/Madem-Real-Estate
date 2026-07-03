import type { DataSource } from 'typeorm';
import { Match, Opportunity, Property, User } from '../../entities';
import { notify } from '../../lib/notifications';
import type { ListingType, MatchStatus, OpportunityStatus, PropertyType } from '../../schemas/enums';

export interface ScoredProperty {
  property: Property;
  score: number;
}

/** Statuses that take a property out of matching (sold/rented/archived). DRAFT, ACTIVE
 *  and RESERVED all still match, so a newly added property matches immediately. */
const UNAVAILABLE_PROPERTY_STATUSES = ['SOLD', 'RENTED', 'ARCHIVED'];

/** Weighted score (0–100) of a property against an opportunity's requirements. */
function scoreProperty(opp: Opportunity, p: Property): number {
  const reqs = (opp.requirementsJson ?? {}) as Record<string, unknown>;

  // Budget fit (50 pts)
  let budget = 50;
  const max = opp.budgetMax ?? null;
  const min = opp.budgetMin ?? null;
  if (max != null && p.price > max) {
    const overshoot = (p.price - max) / max;
    budget = Math.max(0, 50 * (1 - overshoot));
  } else if (min != null && p.price < min) {
    budget = 40; // under budget is fine, mild signal it may not match expectations
  }

  // Location (25 pts)
  let location = 5;
  if (opp.area && p.area && p.area.toLowerCase().includes(opp.area.toLowerCase())) location = 25;
  else if (opp.city && p.city && p.city.toLowerCase() === opp.city.toLowerCase()) location = 15;

  // Bedrooms (25 pts)
  let bedrooms = 25;
  const reqBeds = typeof reqs.bedrooms === 'number' ? reqs.bedrooms : null;
  if (reqBeds != null) {
    if (p.bedrooms == null) bedrooms = 10;
    else if (p.bedrooms >= reqBeds) bedrooms = 25;
    else bedrooms = Math.max(0, 25 - (reqBeds - p.bedrooms) * 8);
  }

  return Math.round((budget + location + bedrooms) * 100) / 100;
}

/**
 * Recompute matches for an opportunity: hard-filter ACTIVE properties, score the
 * survivors, upsert the top-N into `matches`, and return them ranked.
 */
export async function recomputeMatches(db: DataSource, opportunityId: string, topN = 20) {
  const opp = await db.getRepository(Opportunity).findOneBy({ id: opportunityId });
  if (!opp) return null;

  const qb = db
    .getRepository(Property)
    .createQueryBuilder('p')
    .where('p.status NOT IN (:...unavailable)', { unavailable: UNAVAILABLE_PROPERTY_STATUSES })
    .andWhere('p.listing_type = :lt', { lt: opp.listingType })
    .andWhere('p.property_type = :pt', { pt: opp.propertyType });
  if (opp.country) qb.andWhere('p.country = :country', { country: opp.country });
  if (opp.city) qb.andWhere('p.city ILIKE :city', { city: opp.city });

  const candidates = await qb.getMany();
  const scored: ScoredProperty[] = candidates
    .map((property) => ({ property, score: scoreProperty(opp, property) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  const matchRepo = db.getRepository(Match);
  for (const { property, score } of scored) {
    const existing = await matchRepo.findOne({ where: { opportunityId, propertyId: property.id } });
    if (existing) {
      existing.matchScore = score;
      await matchRepo.save(existing);
    } else {
      await matchRepo.save(matchRepo.create({ opportunityId, propertyId: property.id, matchScore: score, status: 'SUGGESTED' }));
    }
  }

  return matchRepo.find({
    where: { opportunityId },
    relations: { property: true },
    order: { matchScore: 'DESC' },
  });
}

/** A property match enriched with its opportunity (for the property page panel). */
export interface PropertyMatchRow {
  id: string;
  opportunityId: string;
  propertyId: string;
  status: MatchStatus;
  matchScore: number | null;
  createdAt: Date;
  updatedAt: Date;
  opportunity?: {
    id: string;
    code: string;
    status: OpportunityStatus;
    listingType: ListingType;
    propertyType: PropertyType;
    city: string | null;
    area: string | null;
    budgetMin: number | null;
    budgetMax: number | null;
    contactName: string | null;
    assignedAgentId: string | null;
  };
}

/**
 * The reverse of recomputeMatches: score still-open opportunities against a single
 * (ACTIVE) property, upsert the top-N into `matches`, and return them. When
 * `opts.notify` is set, the assigned agent of each *newly* matched opportunity is
 * notified (falling back to admins). Returns null if the property doesn't exist.
 */
export async function recomputeMatchesForProperty(
  db: DataSource,
  propertyId: string,
  opts: { notify?: boolean } = {},
  topN = 20,
): Promise<PropertyMatchRow[] | null> {
  const property = await db.getRepository(Property).findOneBy({ id: propertyId });
  if (!property) return null;

  return db.transaction(async (manager) => {
    const matchRepo = manager.getRepository(Match);

    // Sold/rented/archived properties shouldn't surface as matches - drop stale rows.
    if (UNAVAILABLE_PROPERTY_STATUSES.includes(property.status)) {
      await matchRepo.delete({ propertyId });
      return [];
    }

    const opps = await manager
      .getRepository(Opportunity)
      .createQueryBuilder('o')
      .where('o.status NOT IN (:...closed)', { closed: ['WON', 'LOST'] })
      .andWhere('o.listing_type = :lt', { lt: property.listingType })
      .andWhere('o.property_type = :pt', { pt: property.propertyType })
      .andWhere('(o.country IS NULL OR o.country = :country)', { country: property.country })
      .andWhere('(o.city IS NULL OR :city ILIKE o.city)', { city: property.city })
      .getMany();

    const scored = opps
      .map((opp) => ({ opp, score: scoreProperty(opp, property) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);

    const newlyMatched: Opportunity[] = [];
    for (const { opp, score } of scored) {
      const existing = await matchRepo.findOne({ where: { opportunityId: opp.id, propertyId } });
      if (existing) {
        existing.matchScore = score;
        await matchRepo.save(existing);
      } else {
        await matchRepo.save(matchRepo.create({ opportunityId: opp.id, propertyId, matchScore: score, status: 'SUGGESTED' }));
        newlyMatched.push(opp);
      }
    }

    if (opts.notify && newlyMatched.length) {
      let admins: string[] | null = null;
      const adminIds = async () => {
        if (!admins) admins = (await manager.getRepository(User).find({ where: { role: 'ADMIN', status: 'ACTIVE' } })).map((u) => u.id);
        return admins;
      };
      const label = property.titleJson?.en || property.propertyCode;
      for (const opp of newlyMatched) {
        const recipients = opp.assignedAgentId ? [opp.assignedAgentId] : await adminIds();
        for (const userId of recipients) {
          await notify(manager, {
            userId,
            type: 'NEW_MATCH',
            title: 'New property match',
            body: `${label} matches opportunity ${opp.code}.`,
            linkPath: `/opportunities?opportunityId=${opp.id}`,
          });
        }
      }

      // Summary notification to the property's owner (its agent + whoever added it),
      // so the person adding the property sees a count on their bell.
      const owners = new Set<string>();
      if (property.agentUserId) owners.add(property.agentUserId);
      if (property.createdBy) owners.add(property.createdBy);
      const n = newlyMatched.length;
      for (const userId of owners) {
        await notify(manager, {
          userId,
          type: 'NEW_MATCH',
          title: 'New property matches',
          body: `${label} matched ${n} open ${n === 1 ? 'opportunity' : 'opportunities'}.`,
          linkPath: `/properties/${property.id}`,
        });
      }
    }

    const rows = await matchRepo.find({
      where: { propertyId },
      relations: { opportunity: { contact: true } },
      order: { matchScore: 'DESC' },
    });
    return rows.map((m) => ({
      id: m.id,
      opportunityId: m.opportunityId,
      propertyId: m.propertyId,
      status: m.status,
      matchScore: m.matchScore,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      opportunity: m.opportunity
        ? {
            id: m.opportunity.id,
            code: m.opportunity.code,
            status: m.opportunity.status,
            listingType: m.opportunity.listingType,
            propertyType: m.opportunity.propertyType,
            city: m.opportunity.city,
            area: m.opportunity.area,
            budgetMin: m.opportunity.budgetMin,
            budgetMax: m.opportunity.budgetMax,
            contactName: m.opportunity.contact?.fullName ?? null,
            assignedAgentId: m.opportunity.assignedAgentId,
          }
        : undefined,
    }));
  });
}
