import { useCallback } from "react"
import {
  NEWS_BLOCK_TYPES,
  createEmptyTextBlock,
  createEmptyImageBlock,
  createEmptyChessGameBlock,
  type NewsBlockContent,
  type ImageAlignment,
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
    setBlocks(prev => prev.map((block, i) =>
      i === index && block.type === NEWS_BLOCK_TYPES.TEXT
        ? { ...block, content: newContent }
        : block
    ))
  }, [setBlocks])

  const updateImageFile = useCallback((index: number, file: File, imageUrl: string) => {
    setBlocks(prev => prev.map((block, i) =>
      i === index && block.type === NEWS_BLOCK_TYPES.IMAGE
        ? { ...block, content: { ...block.content, file, imageUrl } }
        : block
    ))
  }, [setBlocks])

  const updateImageCaption = useCallback((index: number, caption: string) => {
    setBlocks(prev => prev.map((block, i) =>
      i === index && block.type === NEWS_BLOCK_TYPES.IMAGE
        ? { ...block, content: { ...block.content, caption } }
        : block
    ))
  }, [setBlocks])

  const updateImageAlignment = useCallback((index: number, alignment: ImageAlignment) => {
    setBlocks(prev => prev.map((block, i) =>
      i === index && block.type === NEWS_BLOCK_TYPES.IMAGE
        ? { ...block, content: { ...block.content, alignment } }
        : block
    ))
  }, [setBlocks])

  const updateChessGamePgn = useCallback((index: number, newPgn: string) => {
    setBlocks(prev => prev.map((block, i) =>
      i === index && block.type === NEWS_BLOCK_TYPES.CHESS_GAME
        ? { ...block, content: { ...block.content, pgn: newPgn } }
        : block
    ))
  }, [setBlocks])

  const updateChessGameWhitePlayer = useCallback((index: number, newValue: string) => {
    setBlocks(prev => prev.map((block, i) =>
      i === index && block.type === NEWS_BLOCK_TYPES.CHESS_GAME
        ? { ...block, content: { ...block.content, whitePlayer: { ...block.content.whitePlayer, value: newValue } } }
        : block
    ))
  }, [setBlocks])

  const updateChessGameBlackPlayer = useCallback((index: number, newValue: string) => {
    setBlocks(prev => prev.map((block, i) =>
      i === index && block.type === NEWS_BLOCK_TYPES.CHESS_GAME
        ? { ...block, content: { ...block.content, blackPlayer: { ...block.content.blackPlayer, value: newValue } } }
        : block
    ))
  }, [setBlocks])

  const updateChessGameWhitePlayerType = useCallback((index: number, newType: string) => {
    setBlocks(prev => prev.map((block, i) =>
      i === index && block.type === NEWS_BLOCK_TYPES.CHESS_GAME
        ? { ...block, content: { ...block.content, whitePlayer: { type: newType, value: "" } } }
        : block
    ))
  }, [setBlocks])

  const updateChessGameBlackPlayerType = useCallback((index: number, newType: string) => {
    setBlocks(prev => prev.map((block, i) =>
      i === index && block.type === NEWS_BLOCK_TYPES.CHESS_GAME
        ? { ...block, content: { ...block.content, blackPlayer: { type: newType, value: "" } } }
        : block
    ))
  }, [setBlocks])

  const updateChessGameResult = useCallback((index: number, newResult: string) => {
    setBlocks(prev => prev.map((block, i) =>
      i === index && block.type === NEWS_BLOCK_TYPES.CHESS_GAME
        ? { ...block, content: { ...block.content, result: newResult } }
        : block
    ))
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
