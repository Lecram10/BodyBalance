interface PointsRingProps {
  used: number;
  budget: number;
  size?: number;
}

export function PointsRing({ used, budget, size = 180 }: PointsRingProps) {
  const isOver = used > budget;
  const remaining = budget - used; // negatief als over budget
  const overAmount = isOver ? used - budget : 0;
  const progress = Math.min(used / budget, 1);

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#E5E5EA"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={isOver ? '#FF3B30' : '#34C759'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-[42px] font-bold leading-none ${
              isOver ? 'text-ios-destructive' : 'text-ios-text'
            }`}
          >
            {isOver ? overAmount : remaining}
          </span>
          <span className="text-[13px] text-ios-secondary mt-1">
            {isOver ? 'te veel' : 'resterend'}
          </span>
        </div>
      </div>
      <div className="flex gap-6 text-[13px] text-ios-secondary">
        <span>
          <strong className="text-ios-text">{used}</strong> gebruikt
        </span>
        <span>
          <strong className="text-ios-text">{budget}</strong> budget
        </span>
      </div>
    </div>
  );
}
