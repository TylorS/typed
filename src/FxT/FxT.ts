import { Fx } from '@fp/Fx'
import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/HKT'

export interface FxT<F, A> extends Fx<HKT<F, unknown>, A> {}

export interface FxT1<F extends URIS, A> extends Fx<Kind<F, unknown>, A> {}

export interface FxT2<F extends URIS2, E, A> extends Fx<Kind2<F, E, unknown>, A> {}

export interface FxT3<F extends URIS3, R, E, A> extends Fx<Kind3<F, R, E, unknown>, A> {}
