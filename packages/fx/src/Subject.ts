import type { Fx } from "@typed/fx/Fx"
import type { Sink } from "@typed/fx/Sink"

export interface Subject<R, E, A> extends Fx<R, E, A>, Sink<E, A> {}
