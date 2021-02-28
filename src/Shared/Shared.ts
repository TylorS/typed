import { Eq } from 'fp-ts/dist/Eq'
import { HKT, Kind, Kind2, Kind3, Kind4, URIS, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

/**
 * The abstraction over a Shared Key-Value pair with an initial value and an Eq instance for
 * checking when values change over time.
 */
export interface Shared<F, K, A> extends Eq<A> {
  readonly key: K
  readonly initial: HKT<F, A>
}

export interface Shared1<F extends URIS, K, A> extends Eq<A> {
  readonly key: K
  readonly initial: Kind<F, A>
}

export interface Shared2<F extends URIS2, K, E, A> extends Eq<A> {
  readonly key: K
  readonly initial: Kind2<F, E, A>
}

export interface Shared3<F extends URIS3, K, R, E, A> extends Eq<A> {
  readonly key: K
  readonly initial: Kind3<F, R, E, A>
}

export interface Shared4<F extends URIS4, K, S, R, E, A> extends Eq<A> {
  readonly key: K
  readonly initial: Kind4<F, S, R, E, A>
}
