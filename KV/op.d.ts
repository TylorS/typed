import { MonadReader, MonadReader2, MonadReader3, MonadReader3C, MonadReader4 } from "../MonadReader/index";
import { WidenI } from "../Widen/index";
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT';
import { GetKV, GetKV2, GetKV3, GetKV4 } from "./getKV";
export declare function op<F extends URIS4>(M: MonadReader4<F>): <Op>() => <K extends PropertyKey>(key: K) => <S, R, E, A>(f: (op: Op) => Kind4<F, S, R, E, A>) => Kind4<F, S, WidenI<GetKV4<F> | R>, E, A>;
export declare function op<F extends URIS3>(M: MonadReader3<F>): <Op>() => <K extends PropertyKey>(key: K) => <R, E, A>(f: (op: Op) => Kind3<F, R, E, A>) => Kind3<F, WidenI<GetKV3<F> | R>, E, A>;
export declare function op<F extends URIS3, E>(M: MonadReader3C<F, E>): <Op>() => <K extends PropertyKey>(key: K) => <R, A>(f: (op: Op) => Kind3<F, R, E, A>) => Kind3<F, WidenI<GetKV3<F> | R>, E, A>;
export declare function op<F extends URIS2>(M: MonadReader2<F>): <Op>() => <K extends PropertyKey>(key: K) => <E, A>(f: (op: Op) => Kind2<F, E, A>) => Kind2<F, WidenI<GetKV2<F> | E>, A>;
export declare function op<F>(M: MonadReader<F>): <Op>() => <K extends PropertyKey>(key: K) => <E, A>(f: (op: Op) => HKT2<F, E, A>) => HKT2<F, WidenI<GetKV<F> | E>, A>;
//# sourceMappingURL=op.d.ts.map