import type { Fx } from "./Fx"
import type { Sink } from "./Sink"

export interface Push<R, E, A, R2, E2, B> extends Sink<R, E, A>, Fx<R2, E2, B> {}
