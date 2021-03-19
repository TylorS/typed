import { MonadReader, MonadReader2, MonadReader3, MonadReader3C, MonadReader4 } from "../MonadReader/index";
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT';
import { GetKV, GetKV2, GetKV3 } from "./getKV";
export declare function dep<F extends URIS4>(M: MonadReader4<F>): <S, E, A>() => <K extends PropertyKey>(key: K) => Kind4<F, S, GetKV3<F>, E, A>;
export declare function dep<F extends URIS4, E>(M: MonadReader4<F>): <S, A>() => <K extends PropertyKey>(key: K) => Kind4<F, S, GetKV3<F>, E, A>;
export declare function dep<F extends URIS3>(M: MonadReader3<F>): <E, A>() => <K extends PropertyKey>(key: K) => Kind3<F, GetKV3<F>, E, A>;
export declare function dep<F extends URIS3, E>(M: MonadReader3C<F, E>): <A>() => <K extends PropertyKey>(key: K) => Kind3<F, GetKV3<F>, E, A>;
export declare function dep<F extends URIS2>(M: MonadReader2<F>): <A>() => <K extends PropertyKey>(key: K) => Kind2<F, GetKV2<F>, A>;
export declare function dep<F>(M: MonadReader<F>): <A>() => <K extends PropertyKey>(key: K) => HKT2<F, GetKV<F>, A>;
//# sourceMappingURL=dep.d.ts.map