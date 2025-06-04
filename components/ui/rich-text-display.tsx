"use client"

interface RichTextDisplayProps {
  content: string
  className?: string
}

export function RichTextDisplay({ content, className = "" }: RichTextDisplayProps) {
  return (
    <div 
      className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none 
                  prose-gray dark:prose-invert
                  prose-headings:text-terracotta dark:prose-headings:text-terracotta
                  prose-h1:text-xl prose-h1:sm:text-2xl prose-h1:md:text-3xl
                  prose-h2:text-lg prose-h2:sm:text-xl prose-h2:md:text-2xl
                  prose-h3:text-base prose-h3:sm:text-lg prose-h3:md:text-xl
                  prose-p:text-sm prose-p:sm:text-base prose-p:leading-relaxed prose-p:text-gray-900 dark:prose-p:text-gray-100
                  prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline hover:prose-a:text-blue-800 dark:hover:prose-a:text-blue-300
                  prose-strong:text-terracotta dark:prose-strong:text-terracotta prose-strong:font-semibold
                  prose-blockquote:border-l-4 prose-blockquote:border-amber dark:prose-blockquote:border-amber
                  prose-blockquote:bg-amber/5 dark:prose-blockquote:bg-amber/10 prose-blockquote:pl-4 prose-blockquote:py-2
                  prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
                  prose-ul:list-disc prose-ol:list-decimal
                  prose-li:text-sm prose-li:sm:text-base prose-li:text-gray-900 dark:prose-li:text-gray-100
                  prose-code:text-terracotta dark:prose-code:text-terracotta prose-code:bg-gray-100 dark:prose-code:bg-gray-800
                  prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:text-gray-900 dark:prose-pre:text-gray-100
                  prose-th:text-gray-900 dark:prose-th:text-gray-100
                  prose-td:text-gray-900 dark:prose-td:text-gray-100
                  ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
} 