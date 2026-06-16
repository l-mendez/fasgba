import { useCallback } from "react"
import {
  NEWS_BLOCK_TYPES,
  createEmptyTextBlock,
  createEmptyImageBlock,
  createEmptyChessGameBlock,
  type NewsBlockContent,
  type ImageAlignment,
  type TextBlockContent,
  type ImageBlockContent,
  type ChessGameBlockContent,
} from "@/components/news/types"

export function useNewsContentBlocks(
  blocks: NewsBlockContent[],
  setBlocks: React.Dispatch<React.SetStateAction<NewsBlockContent[]>>
) {
  const addTextBlock = useCallback(() => {
    setBlocks(prev => [...prev, createEmptyTextBlock()])
  }, [setBlocks])

  const addImageBlock = useCallback(() => {
    setBlocks(prev => [...prev, createEmptyImageBlock()])
  }, [setBlocks])

  const addChessGameBlock = useCallback(() => {
    setBlocks(prev => [...prev, createEmptyChessGameBlock()])
  }, [setBlocks])

  const deleteBlock = useCallback((index: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== index))
  }, [setBlocks])

  const moveBlockUp = useCallback((index: number) => {
    if (index === 0) return
    setBlocks(prev => {
      const updated = [...prev]
      ;[updated[index], updated[index - 1]] = [updated[index - 1], updated[index]]
      return updated
    })
  }, [setBlocks])

  const moveBlockDown = useCallback((index: number) => {
    setBlocks(prev => {
      if (index === prev.length - 1) return prev
      const updated = [...prev]
      ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
      return updated
    })
  }, [setBlocks])

  const updateTextBlock = useCallback((index: number, newContent: string) => {
    setBlocks(prev => {
      const updated = [...prev]
      if (updated[index].type === NEWS_BLOCK_TYPES.TEXT) {
        (updated[index] as TextBlockContent).content = newContent
      }
      return updated
    })
  }, [setBlocks])

  const updateImageFile = useCallback((index: number, file: File, imageUrl: string) => {
    setBlocks(prev => {
      const updated = [...prev]
      if (updated[index].type === NEWS_BLOCK_TYPES.IMAGE) {
        const imageBlock = updated[index] as ImageBlockContent
        imageBlock.content = { ...imageBlock.content, file, imageUrl }
      }
      return updated
    })
  }, [setBlocks])

  const updateImageCaption = useCallback((index: number, caption: string) => {
    setBlocks(prev => {
      const updated = [...prev]
      if (updated[index].type === NEWS_BLOCK_TYPES.IMAGE) {
        const imageBlock = updated[index] as ImageBlockContent
        imageBlock.content = { ...imageBlock.content, caption }
      }
      return updated
    })
  }, [setBlocks])

  const updateImageAlignment = useCallback((index: number, alignment: ImageAlignment) => {
    setBlocks(prev => {
      const updated = [...prev]
      if (updated[index].type === NEWS_BLOCK_TYPES.IMAGE) {
        const imageBlock = updated[index] as ImageBlockContent
        imageBlock.content = { ...imageBlock.content, alignment }
      }
      return updated
    })
  }, [setBlocks])

  const updateChessGamePgn = useCallback((index: number, newPgn: string) => {
    setBlocks(prev => {
      const updated = [...prev]
      if (updated[index].type === NEWS_BLOCK_TYPES.CHESS_GAME) {
        const chessBlock = updated[index] as ChessGameBlockContent
        chessBlock.content = { ...chessBlock.content, pgn: newPgn }
      }
      return updated
    })
  }, [setBlocks])

  const updateChessGameWhitePlayer = useCallback((index: number, newValue: string) => {
    setBlocks(prev => {
      const updated = [...prev]
      if (updated[index].type === NEWS_BLOCK_TYPES.CHESS_GAME) {
        const chessBlock = updated[index] as ChessGameBlockContent
        chessBlock.content = {
          ...chessBlock.content,
          whitePlayer: { ...chessBlock.content.whitePlayer, value: newValue },
        }
      }
      return updated
    })
  }, [setBlocks])

  const updateChessGameBlackPlayer = useCallback((index: number, newValue: string) => {
    setBlocks(prev => {
      const updated = [...prev]
      if (updated[index].type === NEWS_BLOCK_TYPES.CHESS_GAME) {
        const chessBlock = updated[index] as ChessGameBlockContent
        chessBlock.content = {
          ...chessBlock.content,
          blackPlayer: { ...chessBlock.content.blackPlayer, value: newValue },
        }
      }
      return updated
    })
  }, [setBlocks])

  const updateChessGameWhitePlayerType = useCallback((index: number, newType: string) => {
    setBlocks(prev => {
      const updated = [...prev]
      if (updated[index].type === NEWS_BLOCK_TYPES.CHESS_GAME) {
        const chessBlock = updated[index] as ChessGameBlockContent
        chessBlock.content = {
          ...chessBlock.content,
          whitePlayer: { type: newType, value: "" },
        }
      }
      return updated
    })
  }, [setBlocks])

  const updateChessGameBlackPlayerType = useCallback((index: number, newType: string) => {
    setBlocks(prev => {
      const updated = [...prev]
      if (updated[index].type === NEWS_BLOCK_TYPES.CHESS_GAME) {
        const chessBlock = updated[index] as ChessGameBlockContent
        chessBlock.content = {
          ...chessBlock.content,
          blackPlayer: { type: newType, value: "" },
        }
      }
      return updated
    })
  }, [setBlocks])

  const updateChessGameResult = useCallback((index: number, newResult: string) => {
    setBlocks(prev => {
      const updated = [...prev]
      if (updated[index].type === NEWS_BLOCK_TYPES.CHESS_GAME) {
        const chessBlock = updated[index] as ChessGameBlockContent
        chessBlock.content = { ...chessBlock.content, result: newResult }
      }
      return updated
    })
  }, [setBlocks])

  return {
    addTextBlock,
    addImageBlock,
    addChessGameBlock,
    deleteBlock,
    moveBlockUp,
    moveBlockDown,
    updateTextBlock,
    updateImageFile,
    updateImageCaption,
    updateImageAlignment,
    updateChessGamePgn,
    updateChessGameWhitePlayer,
    updateChessGameBlackPlayer,
    updateChessGameWhitePlayerType,
    updateChessGameBlackPlayerType,
    updateChessGameResult,
  }
}

export function useEditableNewsBlocks<T>(
  blocks: T[],
  setBlocks: React.Dispatch<React.SetStateAction<T[]>>
) {
  const addContentBlock = useCallback((newBlock: T) => {
    setBlocks(prev => [...prev, newBlock])
  }, [setBlocks])

  const updateContentBlock = useCallback((index: number, updatedBlock: T) => {
    setBlocks(prev => {
      const updated = [...prev]
      updated[index] = updatedBlock
      return updated
    })
  }, [setBlocks])

  const removeContentBlock = useCallback((index: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== index))
  }, [setBlocks])

  const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    setBlocks(prev => {
      if (direction === 'up' && index > 0) {
        const updated = [...prev]
        ;[updated[index], updated[index - 1]] = [updated[index - 1], updated[index]]
        return updated
      }
      if (direction === 'down' && index < prev.length - 1) {
        const updated = [...prev]
        ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
        return updated
      }
      return prev
    })
  }, [setBlocks])

  return {
    addContentBlock,
    updateContentBlock,
    removeContentBlock,
    moveBlock,
  }
}
