// Central SEO configuration and helpers.
//
// The site is a client-rendered SPA, so per-page metadata is injected via the
// <Seo> component (which relies on React 19's native <title>/<meta>/<link>
// hoisting). This file holds the constants and URL helpers shared across pages.

/** Canonical production origin (no trailing slash). Overridable per environment. */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://madem-ks.com"
).replace(/\/$/, "");

export const SITE_NAME = "MADEM Real Estate";

/** Default social-share image (lives in web/public). */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph.jpg`;

/** Map an app language to its Open Graph locale code. */
export const OG_LOCALE: Record<string, string> = {
  sq: "sq_AL",
  en: "en_US",
  de: "de_DE",
};

/** Build an absolute URL from a path (e.g. "/properties" → "https://…/properties"). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Current pathname (+ search) on the client; "/" during SSR/build. */
export function currentPath(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname + window.location.search;
}

/**
 * Organization / RealEstateAgent structured data for the site as a whole.
 * Rendered on the homepage so search engines understand the business entity.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/Madem_Logo.png`,
    image: DEFAULT_OG_IMAGE,
    email: "info@madem-ks.com",
    telephone: "+383 49 440 015",
    areaServed: ["Prishtinë", "Kosovë"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Robert Doll 19 K-1 H-3 Nr.4",
      addressLocality: "Prishtinë",
      addressCountry: "XK",
    },
  };
}
