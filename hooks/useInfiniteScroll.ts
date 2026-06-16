"use client"

import { useEffect, useRef, useState } from "react"

const DEFAULT_PAGE_SIZE = 30

interface Options {
  /** Rows revealed per step (and the initial window). */
  pageSize?: number
  /**
   * Signature of the current query (search + filters + sort). When it changes
   * the window resets to the first page so results stay aligned with the search.
   */
  resetKey?: string
}

/**
 * Client-side windowing for tables that already hold their full dataset in
 * memory: search/filter/sort run over the complete list, while only a growing
 * slice is rendered. Attach `sentinelRef` after the rows; scrolling near it
 * reveals the next page. Reused across the admin tables.
 */
export function useInfiniteScroll<T>(items: T[], { pageSize = DEFAULT_PAGE_SIZE, resetKey = "" }: Options = {}) {
  const [count, setCount] = useState(pageSize)
  const [prevKey, setPrevKey] = useState(resetKey)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Restart the window whenever the query changes. Adjusting state during render
  // (React's recommended pattern for resetting on a changed input) re-renders
  // immediately with the new window, without an extra effect pass.
  if (prevKey !== resetKey) {
    setPrevKey(resetKey)
    setCount(pageSize)
  }

  const hasMore = count < items.length

  // Re-create the observer after each reveal so a sentinel that is still in view
  // (e.g. a tall viewport) keeps filling until it scrolls off or the list ends.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setCount((c) => c + pageSize)
      },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, pageSize, count])

  return { visibleItems: items.slice(0, count), sentinelRef, hasMore }
}
