import { Eq } from 'fp-ts/dist/Eq';
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT';
/**
 * The abstraction over a Shared Key-Value pair with an initial value and an Eq instance for
 * checking when values change over time.
 */
export interface KV<F, K, E, A> extends Eq<A> {
    readonly key: K;
    readonly initial: HKT2<F, E, A>;
}
export interface KV2<F extends URIS2, K, E, A> extends Eq<A> {
    readonly key: K;
    readonly initial: Kind2<F, E, A>;
}
export interface KV3<F extends URIS3, K, R, E, A> extends Eq<A> {
    readonly key: K;
    readonly initial: Kind3<F, R, E, A>;
}
export interface KV4<F extends URIS4, K, S, R, E, A> extends Eq<A> {
    readonly key: K;
    readonly initial: Kind4<F, S, R, E, A>;
}
//# sourceMappingURL=KV.d.ts.map