// Phone-like runs inside free text ("WhatsApp 11 6572-7181", "4222-1111 / 4333-2222").
const PHONE_RE = /(\+?\d[\d\s().-]{4,}\d)/g

// Renders a club phone value, linking only the parts that look like numbers.
export function PhoneLinks({ value, className }: { value: string; className?: string }) {
  return (
    <>
      {value.split(PHONE_RE).map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={`tel:${part.replace(/[^\d+]/g, "")}`} className={className}>
            {part}
          </a>
        ) : (
          part
        )
      )}
    </>
  )
}
