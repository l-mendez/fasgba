"use client"

import Image from "next/image"
import dynamic from "next/dynamic"
import { useState } from "react"

import { RichTextDisplay } from "@/components/ui/rich-text-display"
import { createClient } from "@/lib/supabase/client"

const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

// The chess board only works client-side.
const ChessGameBlock = dynamic(() => import("@/app/components/chess-game-block"), {
  ssr: false,
  loading: () => <div className="h-[250px] w-full animate-pulse rounded-lg bg-muted md:h-[300px]" />,
})

type ChessFields = Partial<React.ComponentProps<typeof ChessGameBlock>>
type BlockFields = ChessFields & { url?: string; src?: string; caption?: string }
// Stored blocks: `content` is HTML for text blocks, an object for the rest
// (older blocks keep their fields at the top level).
type ContentBlock = BlockFields & { type?: string; content?: string | BlockFields }
type ImageItem = { src: string; caption: string }

// Storage paths resolve through the shared browser client (one GoTrueClient per page).
function resolveImageUrl(path: string): string {
  if (path.startsWith("http")) return path
  return createClient().storage.from("images").getPublicUrl(path).data.publicUrl
}

// Content-block image with broken-image fallback
function ContentImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [imgSrc, setImgSrc] = useState(src)
  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={1200}
      height={800}
      sizes="(max-width: 768px) 100vw, 768px"
      unoptimized
      className={className}
      onError={() => setImgSrc("/placeholder.svg")}
    />
  )
}

// Parses the stored JSON content blocks; plain HTML falls back to one text block.
function parseBlocks(text: string): ContentBlock[] {
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // Not JSON: legacy HTML content
  }
  return [{ type: "text", content: text }]
}

function fieldsOf(block: ContentBlock): BlockFields {
  return block.content && typeof block.content === "object" ? block.content : {}
}

function toImage(block: ContentBlock): ImageItem | null {
  const fields = fieldsOf(block)
  const url = fields.url || fields.src || block.url
  return url ? { src: resolveImageUrl(url), caption: fields.caption || block.caption || "" } : null
}

function ImageFigure({ image }: { image: ImageItem }) {
  return (
    <figure>
      <ContentImage src={image.src} alt={image.caption || "Imagen"} className="mx-auto h-auto w-full rounded-lg" />
      {image.caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{image.caption}</figcaption>}
    </figure>
  )
}

// Runs of consecutive photos render as a grid; each opens full size in a new tab.
function ImageGrid({ images }: { images: ImageItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {images.map((image, i) => (
        <a key={i} href={image.src} target="_blank" rel="noopener noreferrer" title={image.caption || undefined}>
          <ContentImage
            src={image.src}
            alt={image.caption || "Imagen"}
            className="aspect-[4/3] w-full rounded-lg border object-cover hover:border-amber"
          />
        </a>
      ))}
    </div>
  )
}

type Item = { kind: "block"; block: ContentBlock } | { kind: "images"; images: ImageItem[] }

// Groups consecutive image blocks and drops an image that repeats the cover.
function toItems(blocks: ContentBlock[], coverUrl: string | null): Item[] {
  const items: Item[] = []
  for (const block of blocks) {
    if (block.type !== "image") {
      items.push({ kind: "block", block })
      continue
    }
    const image = toImage(block)
    if (!image || image.src === coverUrl) continue
    const last = items[items.length - 1]
    if (last?.kind === "images") last.images.push(image)
    else items.push({ kind: "images", images: [image] })
  }
  return items
}

export function NewsContent({ text, coverUrl = null }: { text: string; coverUrl?: string | null }) {
  const items = toItems(parseBlocks(text), coverUrl)

  return (
    <div className="space-y-6">
      {items.map((item, index) => {
        if (item.kind === "images") {
          return item.images.length === 1 ? (
            <ImageFigure key={index} image={item.images[0]} />
          ) : (
            <ImageGrid key={index} images={item.images} />
          )
        }

        const { block } = item
        if (block.type === "text") {
          return <RichTextDisplay key={index} content={typeof block.content === "string" ? block.content : ""} />
        }

        if (block.type === "chess" || block.type === "chess_game") {
          const fields = fieldsOf(block)
          return (
            <ChessGameBlock
              key={index}
              fen={block.fen || fields.fen || DEFAULT_FEN}
              pgn={block.pgn || fields.pgn}
              whitePlayer={block.whitePlayer || fields.whitePlayer}
              blackPlayer={block.blackPlayer || fields.blackPlayer}
              result={block.result || fields.result}
            />
          )
        }

        return null
      })}
    </div>
  )
}
