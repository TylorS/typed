import { Eq } from 'fp-ts/dist/Eq';
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT';
import { KV, KV2, KV3, KV4 } from "./KV";
export declare function createKV<F extends URIS2>(): <K, E, A>(key: K, initial: Kind2<F, E, A>, eq?: Eq<A>) => KV2<F, K, E, A>;
export declare function createKV<F extends URIS2, E>(): <K, A>(key: K, initial: Kind2<F, E, A>, eq?: Eq<A>) => KV2<F, K, E, A>;
export declare function createKV<F extends URIS3>(): <K, R, E, A>(key: K, initial: Kind3<F, R, E, A>, eq?: Eq<A>) => KV3<F, K, R, E, A>;
export declare function createKV<F extends URIS3, E>(): <K, R, A>(key: K, initial: Kind3<F, R, E, A>, eq?: Eq<A>) => KV3<F, K, R, E, A>;
export declare function createKV<F extends URIS4>(): <K, S, R, E, A>(key: K, initial: Kind4<F, S, R, E, A>, eq?: Eq<A>) => KV4<F, K, S, R, E, A>;
export declare function createKV<F extends URIS4, E>(): <K, S, R, A>(key: K, initial: Kind4<F, S, R, E, A>, eq?: Eq<A>) => KV4<F, K, S, R, E, A>;
export declare function createKV<F>(): <K, E, A>(key: K, initial: HKT2<F, E, A>, eq?: Eq<A>) => KV<F, K, E, A>;
//# sourceMappingURL=createKV.d.ts.map