import { MonadReader, MonadReader2, MonadReader3, MonadReader3C } from "../MonadReader/index";
import { WidenI } from "../Widen/index";
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT';
import { Option } from 'fp-ts/dist/Option';
import { KV, KV2, KV3, KV4 } from "./KV";
export interface DeleteKV<F> {
    readonly deleteKV: <K, E, A>(kv: KV<F, K, E, A>) => HKT2<F, E, Option<A>>;
}
export interface DeleteKV2<F extends URIS2> {
    readonly deleteKV: <K, E, A>(kv: KV2<F, K, E, A>) => Kind2<F, E, Option<A>>;
}
export interface DeleteKV3<F extends URIS3> {
    readonly deleteKV: <K, R, E, A>(kv: KV3<F, K, R, E, A>) => Kind3<F, R, E, Option<A>>;
}
export interface DeleteKV3C<F extends URIS3, E> {
    readonly deleteKV: <K, R, A>(kv: KV3<F, K, R, E, A>) => Kind3<F, R, E, Option<A>>;
}
export interface DeleteKV4<F extends URIS4> {
    readonly deleteKV: <K, S, R, E, A>(kv: KV4<F, K, S, R, E, A>) => Kind4<F, S, R, E, Option<A>>;
}
export declare function deleteKV<F extends URIS2>(M: MonadReader2<F>): <K, E, A>(kv: KV2<F, K, E, A>) => Kind2<F, WidenI<E | DeleteKV2<F>>, Option<A>>;
export declare function deleteKV<F extends URIS3>(M: MonadReader3<F>): <K, R, E, A>(kv: KV3<F, K, R, E, A>) => Kind3<F, R, WidenI<E | DeleteKV3<F>>, Option<A>>;
export declare function deleteKV<F extends URIS3, E>(M: MonadReader3C<F, E>): <K, R, A>(kv: KV3<F, K, R, E, A>) => Kind3<F, WidenI<R | DeleteKV3<F>>, E, Option<A>>;
export declare function deleteKV<F>(M: MonadReader<F>): <K, E, A>(kv: KV<F, K, E, A>) => HKT2<F, E, Option<A>>;
//# sourceMappingURL=deleteKV.d.ts.map