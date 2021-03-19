import { MonadReader, MonadReader2, MonadReader3, MonadReader3C, MonadReader4 } from "../MonadReader/index";
import { WidenI } from "../Widen/index";
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT';
import { KV, KV2, KV3, KV4 } from "./KV";
export interface GetKV<F> {
    readonly getKV: <K, E, A>(kv: KV<F, K, E, A>) => HKT2<F, E, A>;
}
export interface GetKV2<F extends URIS2> {
    readonly getKV: <K, E, A>(kv: KV2<F, K, E, A>) => Kind2<F, E, A>;
}
export interface GetKV2C<F extends URIS2, E> {
    readonly getKV: <K, A>(kv: KV2<F, K, E, A>) => Kind2<F, E, A>;
}
export interface GetKV3<F extends URIS3> {
    readonly getKV: <K, R, E, A>(kv: KV3<F, K, R, E, A>) => Kind3<F, R, E, A>;
}
export interface GetKV3C<F extends URIS3, E> {
    readonly getKV: <K, R, A>(kv: KV3<F, K, R, E, A>) => Kind3<F, R, E, A>;
}
export interface GetKV4<F extends URIS4> {
    readonly getKV: <K, S, R, E, A>(kv: KV4<F, K, S, R, E, A>) => Kind4<F, S, R, E, A>;
}
export interface GetKV4C<F extends URIS4, E> {
    readonly getKV: <K, S, R, A>(kv: KV4<F, K, S, R, E, A>) => Kind4<F, S, R, E, A>;
}
export declare function getKV<F extends URIS2>(M: MonadReader2<F>): <K, E, A>(kv: KV2<F, K, E, A>) => Kind2<F, WidenI<E | GetKV2<F>>, A>;
export declare function getKV<F extends URIS3>(M: MonadReader3<F>): <K, R, E, A>(kv: KV3<F, K, R, E, A>) => Kind3<F, R, WidenI<E | GetKV3<F>>, A>;
export declare function getKV<F extends URIS3, E>(M: MonadReader3C<F, E>): <K, R, A>(kv: KV3<F, K, R, E, A>) => Kind3<F, WidenI<R | GetKV3<F>>, E, A>;
export declare function getKV<F extends URIS4>(M: MonadReader4<F>): <K, S, R, E, A>(kv: KV4<F, K, S, R, E, A>) => Kind4<F, S, WidenI<R | GetKV4<F>>, E, A>;
export declare function getKV<F>(M: MonadReader<F>): <K, E, A>(kv: KV<F, K, E, A>) => HKT2<F, WidenI<E | GetKV<F>>, A>;
//# sourceMappingURL=getKV.d.ts.map