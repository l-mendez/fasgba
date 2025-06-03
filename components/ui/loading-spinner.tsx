import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ className = "", size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Loader2 className={`animate-spin mb-4 ${sizeClasses[size]}`} />
      <p className="text-muted-foreground">Cargando...</p>
    </div>
  )
} 