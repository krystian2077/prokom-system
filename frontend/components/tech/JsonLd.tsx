import { jsonLdString } from "@/lib/tech/jsonld";

/** Page-level JSON-LD (<script type="application/ld+json">), escaped against "</script>". */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}
