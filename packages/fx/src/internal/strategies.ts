export type FlattenStrategy = Unbounded | Bounded | Switch | Exhaust | ExhaustLatest

export interface Unbounded {
  readonly _tag: "Unbounded"
}

export const Unbounded: Unbounded = { _tag: "Unbounded" }

export interface Bounded {
  readonly _tag: "Bounded"
  readonly capacity: number
}

export const Bounded = (capacity: number): Bounded => ({ _tag: "Bounded", capacity })

export interface Switch {
  readonly _tag: "Switch"
}

export const Switch: Switch = { _tag: "Switch" }

export interface Exhaust {
  readonly _tag: "Exhaust"
}

export const Exhaust: Exhaust = { _tag: "Exhaust" }

export interface ExhaustLatest {
  readonly _tag: "ExhaustLatest"
}

export const ExhaustLatest: ExhaustLatest = { _tag: "ExhaustLatest" }


export type MergeStrategy = Unordered | Ordered | Switch

export interface Unordered {
  readonly _tag: "Unordered"
  readonly concurrency: number
}

export const Unordered = (concurrency: number): Unordered => ({ _tag: "Unordered", concurrency })

export interface Ordered {
  readonly _tag: "Ordered"
  readonly concurrency: number
}

export const Ordered = (concurrency: number): Ordered => ({ _tag: "Ordered", concurrency })
