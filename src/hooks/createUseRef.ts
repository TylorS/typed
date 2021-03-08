import { FromIO, FromIO2, FromIO3, FromIO3C, FromIO4 } from 'fp-ts/dist/FromIO'
import { MonadAsk, MonadAsk2, MonadAsk3, MonadAsk3C, MonadAsk4 } from '@typed/fp/MonadAsk'
import { UseSome, UseSome2, UseSome3, UseSome3C, UseSome4 } from '@typed/fp/Provide'
import { createGetNextSymbol } from './createGetNextSymbol'
import { createGetShared, createShared, RuntimeEnv } from '@typed/fp/Shared'
import { pipe } from 'fp-ts/dist/function'
import { createRef, Ref } from '@typed/fp/Ref'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { bind } from 'fp-ts/dist/Chain'

export function createUseRef<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F> & UseSome2<F>,
): {
  <A>(): Kind2<F, RuntimeEnv<F>, Ref<A | undefined>>
  <A>(value: A): Kind2<F, RuntimeEnv<F>, Ref<A>>
}

export function createUseRef<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F> & UseSome3<F>,
): {
  <A, E = never>(): Kind3<F, RuntimeEnv<F>, E, Ref<A | undefined>>
  <A, E = never>(value: A): Kind3<F, RuntimeEnv<F>, E, Ref<A>>
}

export function createUseRef<F extends URIS3, E>(
  M: MonadAsk3C<F, E> & FromIO3C<F, E> & UseSome3C<F, E>,
): {
  <A>(): Kind3<F, RuntimeEnv<F>, E, Ref<A | undefined>>
  <A>(value: A): Kind3<F, RuntimeEnv<F>, E, Ref<A>>
}

export function createUseRef<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F> & UseSome4<F>,
): {
  <A, S = unknown, E = never>(): Kind4<F, S, RuntimeEnv<F>, E, Ref<A | undefined>>
  <A, S = unknown, E = never>(value: A): Kind4<F, S, RuntimeEnv<F>, E, Ref<A>>
}

export function createUseRef<F>(
  M: MonadAsk<F> & FromIO<F> & UseSome<F>,
): {
  <A>(): HKT<F, Ref<A | undefined>>
  <A>(value: A): HKT<F, Ref<A>>
}

export function createUseRef<F>(M: MonadAsk<F> & FromIO<F> & UseSome<F>) {
  const getNextSymbol = createGetNextSymbol(M)
  const getShared = createGetShared(M)
  const bindTo = bind(M)
  const create = createShared<F>()
  const Do = M.of({})

  return <A>(value?: A) =>
    pipe(
      Do,
      bindTo('env', () => M.ask<RuntimeEnv<F>>()),
      bindTo('symbol', ({ env }) => getNextSymbol(env)),
      M.chain(({ symbol, env }) =>
        getShared(env)(
          create(
            symbol,
            M.fromIO(() => createRef(value)),
          ),
        ),
      ),
    )
}
