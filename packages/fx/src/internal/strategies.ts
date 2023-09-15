import type * as Fx from "@typed/fx/Fx"

export const Unbounded: Fx.Unbounded = { _tag: "Unbounded" }

export const Bounded = (capacity: number): Fx.Bounded => ({ _tag: "Bounded", capacity })

export const Switch: Fx.Switch = { _tag: "Switch" }

export const Exhaust: Fx.Exhaust = { _tag: "Exhaust" }

export const ExhaustLatest: Fx.ExhaustLatest = { _tag: "ExhaustLatest" }

export const Unordered = (concurrency: number): Fx.Unordered => ({ _tag: "Unordered", concurrency })

export const Ordered = (concurrency: number): Fx.Ordered => ({ _tag: "Ordered", concurrency })
