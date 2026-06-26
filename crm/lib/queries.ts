import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export type LocationLookups = {
  countries: Array<{ id: string; name: string }>;
  cities: Array<{ id: string; countryId: string; name: string }>;
  areas: Array<{ id: string; cityId: string; name: string }>;
  cadastralZones: Array<{ id: string; cityId: string; name: string }>;
};

/** Agents (users with role AGENT) — for assignment dropdowns. */
export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => (await api.GET('/api/users', { params: { query: { role: 'AGENT', limit: 100 } } })).data?.data ?? [],
  });
}

/** Contacts — for owner/buyer/seller pickers. Optional type filter. */
export function useContacts(contactType?: 'OWNER' | 'BUYER' | 'TENANT' | 'LANDLORD' | 'INVESTOR') {
  return useQuery({
    queryKey: ['contacts-options', contactType ?? 'all'],
    queryFn: async () =>
      (await api.GET('/api/contacts', { params: { query: { limit: 100, ...(contactType ? { contactType } : {}) } } })).data?.data ?? [],
  });
}

export function useHeatingTypes() {
  return useQuery({
    queryKey: ['heating-types'],
    queryFn: async () => (await api.GET('/api/lookups/heating-types')).data ?? [],
  });
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: ['document-types'],
    queryFn: async () => (await api.GET('/api/lookups/document-types')).data ?? [],
  });
}

export function useLocationLookups() {
  return useQuery({
    queryKey: ['location-lookups'],
    queryFn: async (): Promise<LocationLookups> =>
      ((await (api as any).GET('/api/location-lookups')).data ?? {
        countries: [],
        cities: [],
        areas: [],
        cadastralZones: [],
      }),
  });
}

export function useProperties(limit = 100) {
  return useQuery({
    queryKey: ['properties-options', limit],
    queryFn: async () => (await api.GET('/api/properties', { params: { query: { limit } } })).data?.data ?? [],
  });
}

export function useOpportunities(limit = 100) {
  return useQuery({
    queryKey: ['opportunities-options', limit],
    queryFn: async () => (await api.GET('/api/opportunities', { params: { query: { limit } } })).data?.data ?? [],
  });
}

export function useDeals(limit = 100) {
  return useQuery({
    queryKey: ['deals-options', limit],
    queryFn: async () => (await api.GET('/api/deals', { params: { query: { limit } } })).data?.data ?? [],
  });
}

/**
 * Current user's notifications + unread count. Polls every 60s. Shared by the
 * sidebar badge and the notifications page. Failures resolve to `undefined`
 * (openapi-fetch returns { data, error } and never throws), so the app shell
 * never breaks if this request fails.
 */
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.GET('/api/notifications', { params: { query: { limit: 50 } } })).data,
    refetchInterval: 60_000,
    // Keep polling even when the CRM tab is unfocused, so the unread badge stays
    // current (default pauses the interval in background tabs).
    refetchIntervalInBackground: true,
  });
}
