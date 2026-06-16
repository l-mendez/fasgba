export const NEWS_BLOCK_TYPES = {
  TEXT: "text",
  CHESS_GAME: "chess_game",
  IMAGE: "image",
} as const

export const IMAGE_ALIGNMENTS = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right",
} as const

export type NewsBlockType = typeof NEWS_BLOCK_TYPES[keyof typeof NEWS_BLOCK_TYPES]
export type ImageAlignment = typeof IMAGE_ALIGNMENTS[keyof typeof IMAGE_ALIGNMENTS]

export interface TextBlockContent {
  type: typeof NEWS_BLOCK_TYPES.TEXT
  content: string
}

export interface ImageBlockContent {
  type: typeof NEWS_BLOCK_TYPES.IMAGE
  content: {
    file: File | null
    imageUrl: string | null
    caption: string
    alignment: ImageAlignment
  }
}

export interface StoredImageBlockContent {
  type: typeof NEWS_BLOCK_TYPES.IMAGE
  content: {
    url: string | null
    caption: string
    filePath: string | null
  }
}

export interface UrlImageBlockContent {
  type: typeof NEWS_BLOCK_TYPES.IMAGE
  url: string
  caption: string
}

export interface ChessGameBlockContent {
  type: typeof NEWS_BLOCK_TYPES.CHESS_GAME
  content: {
    pgn: string
    whitePlayer: { type: string; value: string }
    blackPlayer: { type: string; value: string }
    result?: string
  }
}

export type NewsBlockContent = TextBlockContent | ImageBlockContent | ChessGameBlockContent
export type EditableNewsBlock = TextBlockContent | StoredImageBlockContent | UrlImageBlockContent | ChessGameBlockContent

export const NEWS_CATEGORIES = [
  { value: "torneos", label: "Torneos" },
  { value: "resultados", label: "Resultados" },
  { value: "institucional", label: "Institucional" },
  { value: "clases", label: "Clases" },
  { value: "eventos", label: "Eventos" },
  { value: "partidas", label: "Partidas" },
  { value: "entrevistas", label: "Entrevistas" },
] as const

export function createEmptyTextBlock(): TextBlockContent {
  return { type: NEWS_BLOCK_TYPES.TEXT, content: "" }
}

export function createEmptyImageBlock(): ImageBlockContent {
  return {
    type: NEWS_BLOCK_TYPES.IMAGE,
    content: {
      file: null,
      imageUrl: null,
      caption: "",
      alignment: IMAGE_ALIGNMENTS.CENTER,
    },
  }
}

export function createEmptyChessGameBlock(): ChessGameBlockContent {
  return {
    type: NEWS_BLOCK_TYPES.CHESS_GAME,
    content: {
      pgn: "",
      whitePlayer: { type: "custom", value: "" },
      blackPlayer: { type: "custom", value: "" },
      result: "1-0",
    },
  }
}

export function createEmptyStoredImageBlock(): StoredImageBlockContent {
  return {
    type: NEWS_BLOCK_TYPES.IMAGE,
    content: {
      url: null,
      caption: "",
      filePath: null,
    },
  }
}

export function createEmptyUrlImageBlock(): UrlImageBlockContent {
  return {
    type: NEWS_BLOCK_TYPES.IMAGE,
    url: "",
    caption: "",
  }
}

export function normalizeStoredNewsBlocks(text: string): EditableNewsBlock[] {
  try {
    let parsedContent
    try {
      parsedContent = JSON.parse(text)
    } catch {
      parsedContent = null
    }

    if (Array.isArray(parsedContent)) {
      return parsedContent.map((block) => {
        if (block.type === 'chess') {
          return {
            type: NEWS_BLOCK_TYPES.CHESS_GAME,
            content: {
              pgn: block.pgn || '',
              whitePlayer: { type: 'custom', value: 'Blanco' },
              blackPlayer: { type: 'custom', value: 'Negro' },
            },
          } satisfies ChessGameBlockContent
        }

        if (block.type === NEWS_BLOCK_TYPES.CHESS_GAME) {
          return {
            ...block,
            content: {
              pgn: block.content?.pgn || '',
              whitePlayer: block.content?.whitePlayer || { type: 'custom', value: 'Blanco' },
              blackPlayer: block.content?.blackPlayer || { type: 'custom', value: 'Negro' },
              result: block.content?.result || '1-0',
            },
          } satisfies ChessGameBlockContent
        }

        if (block.type === NEWS_BLOCK_TYPES.IMAGE) {
          const imageUrl = block.url || block.content?.src || block.content?.url || null
          return {
            type: NEWS_BLOCK_TYPES.IMAGE,
            content: {
              url: imageUrl,
              caption: block.caption || block.content?.caption || '',
              filePath: block.content?.src || null,
            },
          } satisfies StoredImageBlockContent
        }

        return block as EditableNewsBlock
      })
    }

    return [{ type: NEWS_BLOCK_TYPES.TEXT, content: String(text) }]
  } catch {
    return [{ type: NEWS_BLOCK_TYPES.TEXT, content: String(text) }]
  }
}
