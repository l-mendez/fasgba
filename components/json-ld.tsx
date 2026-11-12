import type { JsonLdObject } from "@/lib/seo"

// Renders schema.org structured data. `<` is escaped so user content (news
// titles, club names) can never close the script tag.
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}
