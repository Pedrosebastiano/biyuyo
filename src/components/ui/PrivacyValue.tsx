/**
 * PrivacyValue.tsx
 *
 * Drop-in wrapper for any monetary string that should respect Privacy Mode.
 *
 * Props:
 *  value        — the formatted monetary string, e.g. "$1,234.56"
 *  className    — forwarded to the outer <span>
 *  blurFallback — if true, CSS blur is used instead of •••••• substitution.
 *                 Useful for chart axis labels where length matters.
 *
 * Examples:
 *   <PrivacyValue value="$1,234.56" />
 *   <PrivacyValue value="Bs. 45,678.90" blurFallback />
 *   <PrivacyValue value={formattedAmount} className="font-bold text-lg" />
 */

import { usePrivacy } from "@/contexts/PrivacyContext";
import { cn } from "@/lib/utils";

interface PrivacyValueProps {
  value: string;
  className?: string;
  blurFallback?: boolean;
}

export function PrivacyValue({
  value,
  className,
  blurFallback = false,
}: PrivacyValueProps) {
  const { isPrivacyMode, maskValue } = usePrivacy();

  // Privacy OFF → render normally, no wrapper overhead
  if (!isPrivacyMode) {
    return <span className={className}>{value}</span>;
  }

  // CSS blur variant
  if (blurFallback) {
    return (
      <span
        className={cn("select-none pointer-events-none", className)}
        style={{
          filter: "blur(7px)",
          transition: "filter 0.2s ease",
        }}
        aria-hidden="true"
      >
        {value}
      </span>
    );
  }

  // Default: replace with masked string (preserves currency prefix)
  return (
    <span
      className={cn("tracking-widest select-none", className)}
      aria-label="Valor oculto — modo privacidad activo"
      title="Modo privacidad activo"
    >
      {maskValue(value)}
    </span>
  );
}