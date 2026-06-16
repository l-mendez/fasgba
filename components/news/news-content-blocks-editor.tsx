"use client"

import { NEWS_BLOCK_TYPES, type NewsBlockContent } from "@/components/news/types"
import { TextBlockEditor } from "@/components/news/text-block-editor"
import { ImageBlockEditor } from "@/components/news/image-block-editor"
import { ChessGameBlockEditor } from "@/components/news/chess-game-block-editor"
import { AddBlockButton } from "@/components/news/add-block-button"
import type { useNewsContentBlocks } from "@/components/news/use-news-content-blocks"

interface NewsContentBlocksEditorProps {
  blocks: NewsBlockContent[]
  blockActions: ReturnType<typeof useNewsContentBlocks>
}

export function NewsContentBlocksEditor({ blocks, blockActions }: NewsContentBlocksEditorProps) {
  const {
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
  } = blockActions

  return (
    <div className="border rounded-md p-4 space-y-4">
      {blocks.map((block, index) => {
        if (block.type === NEWS_BLOCK_TYPES.TEXT) {
          return (
            <TextBlockEditor
              key={`text-${index}`}
              value={block.content}
              onChange={(newContent) => updateTextBlock(index, newContent)}
              onDelete={() => deleteBlock(index)}
              onMoveUp={() => moveBlockUp(index)}
              onMoveDown={() => moveBlockDown(index)}
              index={index}
              totalBlocks={blocks.length}
            />
          )
        }

        if (block.type === NEWS_BLOCK_TYPES.IMAGE) {
          return (
            <ImageBlockEditor
              key={`image-${index}`}
              value={block.content}
              onImageChange={(file, imageUrl) => updateImageFile(index, file, imageUrl)}
              onCaptionChange={(caption) => updateImageCaption(index, caption)}
              onAlignmentChange={(alignment) => updateImageAlignment(index, alignment)}
              onDelete={() => deleteBlock(index)}
              onMoveUp={() => moveBlockUp(index)}
              onMoveDown={() => moveBlockDown(index)}
              index={index}
              totalBlocks={blocks.length}
            />
          )
        }

        if (block.type === NEWS_BLOCK_TYPES.CHESS_GAME) {
          return (
            <ChessGameBlockEditor
              key={`chess-${index}`}
              value={block.content}
              onPgnChange={(newPgn) => updateChessGamePgn(index, newPgn)}
              onWhitePlayerChange={(newValue) => updateChessGameWhitePlayer(index, newValue)}
              onBlackPlayerChange={(newValue) => updateChessGameBlackPlayer(index, newValue)}
              onWhitePlayerTypeChange={(newType) => updateChessGameWhitePlayerType(index, newType)}
              onBlackPlayerTypeChange={(newType) => updateChessGameBlackPlayerType(index, newType)}
              onResultChange={(newResult) => updateChessGameResult(index, newResult)}
              onDelete={() => deleteBlock(index)}
              onMoveUp={() => moveBlockUp(index)}
              onMoveDown={() => moveBlockDown(index)}
              index={index}
              totalBlocks={blocks.length}
            />
          )
        }

        return null
      })}

      <AddBlockButton
        onAddTextBlock={addTextBlock}
        onAddImageBlock={addImageBlock}
        onAddChessGameBlock={addChessGameBlock}
      />
    </div>
  )
}
