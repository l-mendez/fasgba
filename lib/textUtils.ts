/**
 * Utility function to extract plain text from JSON content blocks
 * Used for news content that is stored as structured JSON blocks
 */
export function extractTextFromContentBlocks(jsonText: string): string {
  try {
    const contentBlocks = JSON.parse(jsonText)
    
    if (!Array.isArray(contentBlocks)) {
      // If it's not an array, treat as plain text
      return jsonText
    }
    
    // Extract text from all text blocks
    const textParts: string[] = []
    
    contentBlocks.forEach((block: any) => {
      if (block.type === 'text' && block.content) {
        // Remove HTML tags and decode entities for plain text
        const plainText = block.content
          .replace(/<[^>]*>/g, ' ') // Remove HTML tags
          .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
          .replace(/&amp;/g, '&') // Replace &amp; with &
          .replace(/&lt;/g, '<') // Replace &lt; with <
          .replace(/&gt;/g, '>') // Replace &gt; with >
          .replace(/&quot;/g, '"') // Replace &quot; with "
          .replace(/&#39;/g, "'") // Replace &#39; with '
          .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
          .trim()
        
        if (plainText) {
          textParts.push(plainText)
        }
      }
    })
    
    return textParts.join(' ')
  } catch (error) {
    // If JSON parsing fails, return the original text
    return jsonText
  }
}

/**
 * Extract a shortened description from JSON content blocks for previews
 * @param jsonText - The JSON string containing content blocks
 * @param maxLength - Maximum length of the extracted text (default: 160)
 * @returns Extracted and truncated plain text
 */
export function extractShortTextFromContentBlocks(jsonText: string, maxLength: number = 160): string {
  const plainText = extractTextFromContentBlocks(jsonText)
  if (plainText.length <= maxLength) {
    return plainText
  }
  return plainText.substring(0, maxLength) + '...'
} 