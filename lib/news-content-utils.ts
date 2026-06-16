import { uploadNewsImagesAction } from "@/lib/actions/news"
import { NEWS_BLOCK_TYPES, type NewsBlockContent } from "@/components/news/types"

interface UploadProgressUpdater {
  (update: { current: number; total: number; isUploading: boolean } | ((prev: { current: number; total: number; isUploading: boolean }) => { current: number; total: number; isUploading: boolean })): void
}

export async function processNewsContent(
  blocks: NewsBlockContent[],
  featuredImage: File | null,
  newsId: number,
  setUploadProgress: UploadProgressUpdater
) {
  const imagesToUpload: { file: File; prefix: string; blockIndex?: number }[] = []

  if (featuredImage) {
    imagesToUpload.push({ file: featuredImage, prefix: 'featured' })
  }

  blocks.forEach((block, index) => {
    if (block.type === NEWS_BLOCK_TYPES.IMAGE && block.content.file) {
      imagesToUpload.push({
        file: block.content.file,
        prefix: `block-${index}`,
        blockIndex: index,
      })
    }
  })

  const uploadResults: Array<{ filePath: string; wasReused: boolean; originalIndex: number }> = []

  if (imagesToUpload.length > 0) {
    const CHUNK_SIZE = 5
    const totalChunks = Math.ceil(imagesToUpload.length / CHUNK_SIZE)

    setUploadProgress({ current: 0, total: imagesToUpload.length, isUploading: true })

    try {
      for (let i = 0; i < imagesToUpload.length; i += CHUNK_SIZE) {
        const chunk = imagesToUpload.slice(i, i + CHUNK_SIZE)
        const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1

        try {
          const formData = new FormData()
          chunk.forEach((imageInfo, chunkIndex) => {
            const originalIndex = i + chunkIndex
            formData.append(`file-${chunkIndex}`, imageInfo.file)
            formData.append(`prefix-${chunkIndex}`, imageInfo.prefix)
            if (imageInfo.blockIndex !== undefined) {
              formData.append(`blockIndex-${chunkIndex}`, imageInfo.blockIndex.toString())
            }
            formData.append(`originalIndex-${chunkIndex}`, originalIndex.toString())
          })

          const uploadActionResult = await uploadNewsImagesAction(newsId, formData)

          if (!uploadActionResult.ok) {
            throw new Error(`Error uploading chunk ${chunkNumber}/${totalChunks}: ${uploadActionResult.error}`)
          }

          uploadResults.push(...uploadActionResult.data.results)
          setUploadProgress(prev => ({ ...prev, current: Math.min(i + CHUNK_SIZE, imagesToUpload.length) }))

          if (i + CHUNK_SIZE < imagesToUpload.length) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } catch (error) {
          console.error(`Failed to upload chunk ${chunkNumber}/${totalChunks}:`, error)
          throw new Error(`Failed to upload images (chunk ${chunkNumber}/${totalChunks}). This often happens with large numbers of images. Try reducing the number of images or upload in smaller batches.`)
        }
      }
    } finally {
      setUploadProgress(prev => ({ ...prev, isUploading: false }))
    }
  }

  const featuredImageResult = uploadResults.find((_, index) =>
    imagesToUpload[index].prefix === 'featured'
  )
  const featuredImagePath = featuredImageResult?.filePath || null

  const processedBlocks = blocks.map((block, index) => {
    if (block.type === NEWS_BLOCK_TYPES.TEXT) {
      return {
        id: `block-${index}`,
        type: block.type,
        content: block.content,
      }
    }

    if (block.type === NEWS_BLOCK_TYPES.IMAGE) {
      const uploadResult = uploadResults.find((_, uploadIndex) =>
        imagesToUpload[uploadIndex].blockIndex === index
      )

      return {
        id: `block-${index}`,
        type: block.type,
        content: {
          src: uploadResult?.filePath || null,
          caption: block.content.caption,
          alignment: block.content.alignment,
        },
      }
    }

    if (block.type === NEWS_BLOCK_TYPES.CHESS_GAME) {
      return {
        id: `block-${index}`,
        type: block.type,
        content: {
          pgn: block.content.pgn,
          whitePlayer: block.content.whitePlayer,
          blackPlayer: block.content.blackPlayer,
          result: block.content.result,
        },
      }
    }

    return null
  }).filter(block => block !== null)

  return { processedContent: processedBlocks, featuredImagePath }
}

export async function processImageUploadsInChunks(
  imageFiles: File[],
  newsId: number,
  setUploadProgress: UploadProgressUpdater
) {
  const CHUNK_SIZE = 5
  const totalChunks = Math.ceil(imageFiles.length / CHUNK_SIZE)
  const uploadResults: Array<{ filePath: string; publicUrl: string }> = []

  if (imageFiles.length === 0) return uploadResults

  setUploadProgress({ current: 0, total: imageFiles.length, isUploading: true })

  try {
    for (let i = 0; i < imageFiles.length; i += CHUNK_SIZE) {
      const chunk = imageFiles.slice(i, i + CHUNK_SIZE)
      const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1

      try {
        const formData = new FormData()
        chunk.forEach((file, chunkIndex) => {
          formData.append(`file-${chunkIndex}`, file)
          formData.append(`prefix-${chunkIndex}`, `block-${i + chunkIndex}`)
        })

        const uploadActionResult = await uploadNewsImagesAction(newsId, formData)

        if (!uploadActionResult.ok) {
          throw new Error(`Error uploading chunk ${chunkNumber}/${totalChunks}: ${uploadActionResult.error}`)
        }

        uploadResults.push(...uploadActionResult.data.results.map((result) => ({
          filePath: result.filePath,
          publicUrl: result.publicUrl,
        })))

        setUploadProgress(prev => ({ ...prev, current: Math.min(i + CHUNK_SIZE, imageFiles.length) }))

        if (i + CHUNK_SIZE < imageFiles.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Failed to upload chunk ${chunkNumber}/${totalChunks}:`, error)
        throw new Error(`Failed to upload images (chunk ${chunkNumber}/${totalChunks}). Try reducing the number of images or upload in smaller batches.`)
      }
    }

    return uploadResults
  } finally {
    setUploadProgress(prev => ({ ...prev, isUploading: false }))
  }
}
