import { useLanguage } from "@/i18n/context";
import {
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  OG_LOCALE,
  absoluteUrl,
  currentPath,
} from "@/lib/seo";

interface SeoProps {
  /** Page title. The site name is appended automatically unless `rawTitle` is set. */
  title: string;
  description: string;
  /** Comma-separated keywords (optional — modern engines largely ignore these, but harmless). */
  keywords?: string;
  /** Absolute or app-relative image URL for social cards. Defaults to the site OG image. */
  image?: string;
  /** og:type — "website" for listing/index pages, "article" for blog posts. */
  type?: "website" | "article";
  /** Canonical path; defaults to the current location. */
  path?: string;
  /** Use the title exactly as given (don't append the site name). */
  rawTitle?: boolean;
  /** Tell crawlers not to index this page. */
  noindex?: boolean;
  /** JSON-LD structured data (object or array) rendered as a ld+json script. */
  jsonLd?: object;
}

/**
 * Per-page document metadata. Relies on React 19 hoisting <title>/<meta>/<link>
 * into <head>. Render it once near the top of each page component.
 */
export function Seo({
  title,
  description,
  keywords,
  image,
  type = "website",
  path,
  rawTitle = false,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const { language } = useLanguage();
  const fullTitle = rawTitle ? title : `${title} | ${SITE_NAME}`;
  const url = absoluteUrl(path ?? currentPath());
  const ogImage = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow"}
      />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={OG_LOCALE[language] ?? "sq_AL"} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}
