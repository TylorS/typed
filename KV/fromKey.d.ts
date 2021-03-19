import { Eq } from 'fp-ts/dist/Eq';
import { FromReader, FromReader2, FromReader3, FromReader3C, FromReader4 } from 'fp-ts/dist/FromReader';
import { Functor, Functor2, Functor3, Functor3C, Functor4 } from 'fp-ts/dist/Functor';
import { URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT';
import { KV, KV2, KV3, KV4 } from "./KV";
export declare function fromKey<F extends URIS2>(M: FromReader2<F> & Functor2<F>): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => KV2<F, K, Readonly<Record<K, A>>, A>;
export declare function fromKey<F extends URIS3>(M: FromReader3<F> & Functor3<F>): <E, A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => KV3<F, K, Readonly<Record<K, A>>, E, A>;
export declare function fromKey<F extends URIS3, E>(M: FromReader3C<F, E> & Functor3C<F, E>): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => KV3<F, K, Readonly<Record<K, A>>, E, A>;
export declare function fromKey<F extends URIS4>(M: FromReader4<F> & Functor4<F>): <S, E, A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => KV4<F, K, S, Readonly<Record<K, A>>, E, A>;
export declare function fromKey<F>(M: FromReader<F> & Functor<F>): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => KV<F, K, Readonly<Record<K, A>>, A>;
//# sourceMappingURL=fromKey.d.ts.map