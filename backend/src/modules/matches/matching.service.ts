import type { DataSource } from 'typeorm';
import { Match, Opportunity, Property } from '../../entities';

export interface ScoredProperty {
  property: Property;
  score: number;
}

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
    .where('p.status = :active', { active: 'ACTIVE' })
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
