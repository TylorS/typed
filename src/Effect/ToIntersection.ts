export type ToIntersection<T extends readonly any[], R = unknown> = T extends readonly [
  infer Head,
  ...infer Tail
]
  ? ToIntersection<Tail, R & Head>
  : R
