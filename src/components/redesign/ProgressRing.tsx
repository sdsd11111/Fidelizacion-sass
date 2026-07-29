// filepath: src/components/redesign/ProgressRing.tsx
interface ProgressRingProps {
  /** Valor actual (0..max). */
  value: number;
  /** Valor máximo. Default 100. */
  max?: number;
  /** Tamaño en px. */
  size?: number;
  /** Grosor del trazo en px. */
  stroke?: number;
  /** Color principal del arco. */
  color?: string;
  /** Color del track. */
  trackColor?: string;
  /** Texto central grande. */
  label?: string;
  /** Sufijo al lado del label (ej. "/100"). */
  suffix?: string;
  /** Subtítulo debajo. */
  caption?: string;
  vertical?: string;
}

export default function ProgressRing({
  value,
  max = 100,
  size = 170,
  stroke = 11,
  color,
  trackColor,
  label,
  suffix,
  caption,
  vertical = "BARBERIA",
}: ProgressRingProps) {
  const isGym = vertical === "GIMNASIO";
  const ringStartColor = color || (isGym ? "#60a5fa" : "#d97644");
  const ringEndColor = isGym ? "#3b82f6" : "#e8a33d";
  const actualTrackColor = trackColor || (isGym ? "#1e293b" : "#2a221c");

  const pct = Math.max(0, Math.min(1, value / max));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`ringGrad-${vertical}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ringStartColor} stopOpacity="1" />
            <stop offset="100%" stopColor={ringEndColor} stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={actualTrackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#ringGrad-${vertical})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
        {label !== undefined && (
          <div className="flex flex-col items-center justify-center leading-none">
            {/* Valor principal (ej. "66") — grande, centrado */}
            <span className="font-display text-3xl font-light text-[#f3ece1]">
              {label}
            </span>
            {/* Sufijo (ej. "/100") — separado en su propia línea para
                que nunca choque con el borde del anillo. */}
            {suffix && (
              <span className="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase text-[#a89e90]">
                {suffix}
              </span>
            )}
          </div>
        )}
        {caption && (
          <div className="mt-2 font-mono text-[9px] tracking-[0.25em] uppercase text-[#a89e90]">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
}
