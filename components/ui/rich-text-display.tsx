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
                  prose-p:text-sm prose-p:sm:text-base prose-p:leading-relaxed prose-p:text-foreground
                  prose-a:text-terracotta! prose-a:underline
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-blockquote:border-l-4 prose-blockquote:border-amber dark:prose-blockquote:border-amber
                  prose-blockquote:bg-amber/5 dark:prose-blockquote:bg-amber/10 prose-blockquote:pl-4 prose-blockquote:py-2
                  prose-blockquote:text-muted-foreground
                  prose-ul:list-disc prose-ol:list-decimal
                  prose-li:text-sm prose-li:sm:text-base prose-li:text-foreground
                  prose-code:text-terracotta dark:prose-code:text-terracotta prose-code:bg-muted
                  prose-pre:bg-muted prose-pre:text-foreground
                  prose-th:text-foreground
                  prose-td:text-foreground
                  ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
