export interface Bounds {
  readonly min: number
  readonly max: number
}

// Construct a constrained bounds
export const boundsFrom = (unsafeMin: number, unsafeMax: number): Bounds => {
  const min = Math.max(0, unsafeMin)
  const max = Math.max(min, unsafeMax)
  return { min, max }
}

// Combine 2 bounds by narrowing min and max
export const mergeBounds = (b1: Bounds, b2: Bounds): Bounds =>
  boundsFrom(b1.min + b2.min, Math.min(b1.max, b1.min + b2.max))

// Nil bounds excludes all slice indices
export const isNilBounds = (b: Bounds): boolean => b.min >= b.max

// Infinite bounds includes all slice indices
export const isInfiniteBounds = (b: Bounds): boolean => b.min <= 0 && b.max === Infinity
