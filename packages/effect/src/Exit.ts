import type * as Cause from "./Cause.js"
import type { Either } from "./Either.js"

export type Exit<E, A> = Either<Cause.Cause<E>, A>
