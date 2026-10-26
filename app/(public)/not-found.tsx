import { NotFoundContent } from "@/components/not-found-content"

// The (public) layout already renders the site header and footer.
export default function PublicNotFound() {
  return (
    <div className="flex items-center justify-center px-4 py-24">
      <NotFoundContent />
    </div>
  )
}
