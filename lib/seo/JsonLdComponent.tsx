/**
 * JsonLd — injects one or more schema.org objects as <script type="application/ld+json">.
 *
 * Server component. Pass a single schema object or an array. Multiple schemas
 * are emitted as separate script tags (valid and easiest for engines to parse).
 *
 * Usage:
 *   <JsonLd schema={productSchema(...)} />
 *   <JsonLd schema={[organizationSchema(), websiteSchema()]} />
 */

type Schema = Record<string, unknown>

export function JsonLd({ schema }: { schema: Schema | Schema[] }) {
  const list = Array.isArray(schema) ? schema : [schema]
  return (
    <>
      {list.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON.stringify output is safe; we additionally escape "<" to avoid
          // breaking out of the script context.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(s).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  )
}
