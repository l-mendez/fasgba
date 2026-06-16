"use client"

import { Input } from "@/components/ui/input"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  NEWS_BLOCK_TYPES,
  createEmptyTextBlock,
  createEmptyChessGameBlock,
  createEmptyStoredImageBlock,
  createEmptyUrlImageBlock,
  type EditableNewsBlock,
  type StoredImageBlockContent,
  type UrlImageBlockContent,
  type ChessGameBlockContent,
} from "@/components/news/types"
import { TextBlockEditor } from "@/components/news/text-block-editor"
import { ChessGameBlockEditor } from "@/components/news/chess-game-block-editor"
import { SimpleAddBlockButtons } from "@/components/news/add-block-button"
import { BlockEditorToolbar } from "@/components/news/block-editor-toolbar"
import type { useEditableNewsBlocks } from "@/components/news/use-news-content-blocks"

interface NewsContentBlocksEditorSimpleProps {
  blocks: EditableNewsBlock[]
  blockActions: ReturnType<typeof useEditableNewsBlocks<EditableNewsBlock>>
  imageMode: "upload" | "url"
  newsId?: string
  onBlockImageUpload?: (index: number, filePath: string, publicUrl: string) => void
  onBlockImageRemove?: (index: number, filePath: string) => void
  onBulkImageUpload?: () => void
  isUploading?: boolean
  layout?: "row" | "stack"
}

export function NewsContentBlocksEditorSimple({
  blocks,
  blockActions,
  imageMode,
  newsId,
  onBlockImageUpload,
  onBlockImageRemove,
  onBulkImageUpload,
  isUploading = false,
  layout = "row",
}: NewsContentBlocksEditorSimpleProps) {
  const { addContentBlock, updateContentBlock, removeContentBlock, moveBlock } = blockActions

  const addTextBlock = () => addContentBlock(createEmptyTextBlock())
  const addChessGameBlock = () => addContentBlock(createEmptyChessGameBlock())
  const addImageBlock = () => {
    addContentBlock(imageMode === "url" ? createEmptyUrlImageBlock() : createEmptyStoredImageBlock())
  }

  return (
    <div className="border rounded-md p-3 md:p-4 space-y-3 md:space-y-4">
      {blocks.map((block, index) => {
        if (block.type === NEWS_BLOCK_TYPES.TEXT) {
          return (
            <TextBlockEditor
              key={index}
              value={block.content}
              onChange={(content) => updateContentBlock(index, { ...block, content })}
              onDelete={() => removeContentBlock(index)}
              onMoveUp={() => moveBlock(index, 'up')}
              onMoveDown={() => moveBlock(index, 'down')}
              index={index}
              totalBlocks={blocks.length}
              variant="simple"
            />
          )
        }

        if (block.type === NEWS_BLOCK_TYPES.IMAGE && imageMode === "upload") {
          const imageBlock = block as StoredImageBlockContent
          return (
            <div key={index} className="border rounded-md p-3 md:p-4 relative">
              <BlockEditorToolbar
                index={index}
                totalBlocks={blocks.length}
                onMoveUp={() => moveBlock(index, 'up')}
                onMoveDown={() => moveBlock(index, 'down')}
                onDelete={() => removeContentBlock(index)}
              />
              <div className="pt-8 md:pt-6 space-y-2">
                <ImageUpload
                  newsId={newsId || ""}
                  currentImage={imageBlock.content?.url || undefined}
                  currentImagePath={imageBlock.content?.filePath || undefined}
                  onImageUpload={(filePath, publicUrl) => onBlockImageUpload?.(index, filePath, publicUrl)}
                  onImageRemove={(filePath) => onBlockImageRemove?.(index, filePath)}
                  label="Imagen del bloque"
                  placeholder="Haz clic para subir una imagen"
                />
                <Input
                  placeholder="Pie de foto (opcional)"
                  value={imageBlock.content?.caption || ''}
                  onChange={(e) => updateContentBlock(index, {
                    ...imageBlock,
                    content: { ...imageBlock.content, caption: e.target.value },
                  })}
                  className="text-sm md:text-base"
                />
              </div>
            </div>
          )
        }

        if (block.type === NEWS_BLOCK_TYPES.IMAGE && imageMode === "url") {
          const imageBlock = block as UrlImageBlockContent
          return (
            <div key={index} className="border rounded-md p-4 relative">
              <BlockEditorToolbar
                index={index}
                totalBlocks={blocks.length}
                onMoveUp={() => moveBlock(index, 'up')}
                onMoveDown={() => moveBlock(index, 'down')}
                onDelete={() => removeContentBlock(index)}
                compact
              />
              <div className="pt-6 space-y-2">
                <Input
                  placeholder="URL de la imagen"
                  value={imageBlock.url}
                  onChange={(e) => updateContentBlock(index, { ...imageBlock, url: e.target.value })}
                />
                <Input
                  placeholder="Pie de foto (opcional)"
                  value={imageBlock.caption}
                  onChange={(e) => updateContentBlock(index, { ...imageBlock, caption: e.target.value })}
                />
                {imageBlock.url && (
                  <div className="mt-2">
                    <img src={imageBlock.url} alt={imageBlock.caption} className="max-h-48 object-contain" />
                  </div>
                )}
              </div>
            </div>
          )
        }

        if (block.type === NEWS_BLOCK_TYPES.CHESS_GAME) {
          const chessBlock = block as ChessGameBlockContent
          return (
            <ChessGameBlockEditor
              key={index}
              value={chessBlock.content}
              onPgnChange={(pgn) => updateContentBlock(index, { ...chessBlock, content: { ...chessBlock.content, pgn } })}
              onWhitePlayerChange={(value) => updateContentBlock(index, {
                ...chessBlock,
                content: { ...chessBlock.content, whitePlayer: { ...chessBlock.content.whitePlayer, value } },
              })}
              onBlackPlayerChange={(value) => updateContentBlock(index, {
                ...chessBlock,
                content: { ...chessBlock.content, blackPlayer: { ...chessBlock.content.blackPlayer, value } },
              })}
              onWhitePlayerTypeChange={() => {}}
              onBlackPlayerTypeChange={() => {}}
              onResultChange={(result) => updateContentBlock(index, {
                ...chessBlock,
                content: { ...chessBlock.content, result },
              })}
              onDelete={() => removeContentBlock(index)}
              onMoveUp={() => moveBlock(index, 'up')}
              onMoveDown={() => moveBlock(index, 'down')}
              index={index}
              totalBlocks={blocks.length}
              variant="simple"
            />
          )
        }

        return null
      })}

      <SimpleAddBlockButtons
        onAddTextBlock={addTextBlock}
        onAddImageBlock={addImageBlock}
        onAddChessGameBlock={addChessGameBlock}
        onBulkImageUpload={onBulkImageUpload}
        isUploading={isUploading}
        layout={layout}
      />
    </div>
  )
}
