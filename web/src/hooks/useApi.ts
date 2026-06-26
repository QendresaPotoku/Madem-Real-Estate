import { useQuery } from "@tanstack/react-query";
import { fetchAgents, fetchLocationLookups, fetchProperties, fetchProperty } from "@/lib/api";

/** All published (ACTIVE) properties, mapped to the web Property shape. */
export function useProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
    staleTime: 60_000,
  });
}

/** A single published property by reference code, with full image gallery. */
export function useProperty(code: string | undefined) {
  return useQuery({
    queryKey: ["property", code],
    queryFn: () => fetchProperty(code as string),
    enabled: !!code,
    staleTime: 60_000,
  });
}

/** All active agents, mapped to the web Agent shape. */
export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    staleTime: 60_000,
  });
}

/** Public location options for property filters. */
export function useLocationLookups() {
  return useQuery({
    queryKey: ["location-lookups"],
    queryFn: fetchLocationLookups,
    staleTime: 5 * 60_000,
  });
}
