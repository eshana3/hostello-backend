import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = "md", className, label }: LoadingSpinnerProps) {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Outer ring */}
        <div className={cn("rounded-full border-2 border-muted", sizes[size])} />
        {/* Spinning arc */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin",
            sizes[size]
          )}
        />
        {/* Inner glow */}
        <div
          className={cn(
            "absolute inset-1.5 rounded-full bg-primary/10 animate-pulse",
          )}
        />
      </div>
      {label && (
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      )}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="glass-card p-8 flex flex-col items-center gap-4">
        <div className="text-2xl font-bold brand-text">HostelHub</div>
        <LoadingSpinner size="lg" label="Loading..." />
      </div>
    </div>
  );
}
