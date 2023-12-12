import type { Push } from "./Push"

export interface Subject<R, E, A> extends Push<R, E, A, R, E, A> {}
