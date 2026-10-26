"use client"

import Image from "next/image"
import dynamic from "next/dynamic"
import { useState } from "react"

import { RichTextDisplay } from "@/components/ui/rich-text-display"
import { getImageUrl } from "@/lib/imageUtils"

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

// Content-block image with broken-image fallback
function ContentImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src)
  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={1200}
      height={800}
      sizes="(max-width: 768px) 100vw, 768px"
      unoptimized
      className="mx-auto h-auto w-full max-w-full rounded-lg"
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

export function NewsContent({ text }: { text: string }) {
  const blocks = parseBlocks(text)

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        if (block.type === "text") {
          return <RichTextDisplay key={index} content={typeof block.content === "string" ? block.content : ""} />
        }
        const fields = block.content && typeof block.content === "object" ? block.content : {}

        if (block.type === "image") {
          const imageUrl = fields.url || fields.src || block.url || null
          const caption = fields.caption || block.caption || ""
          if (!imageUrl) return null
          return (
            <figure key={index}>
              <ContentImage src={getImageUrl(imageUrl)} alt={caption || "Imagen"} />
              {caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{caption}</figcaption>}
            </figure>
          )
        }

        if (block.type === "chess" || block.type === "chess_game") {
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
