import Image from "next/image"
import Link from "next/link"

export function SiteLogo({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" className="flex items-center gap-2" onClick={onClick}>
      <Image
        src="/favicon.png"
        alt="Logo de FASGBA"
        width={36}
        height={36}
        className="h-9 w-9 rounded-md"
        priority
      />
      <span className="font-bold text-terracotta">FASGBA</span>
    </Link>
  )
}
