import * as E from '@fp/Env'
import { alwaysEqualsEq, deepEqualsEq, Eq } from '@fp/Eq'
import { flow, increment, pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import * as N from '@fp/number'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import * as S from '@fp/Stream'
import * as O from 'fp-ts/Option'
import * as RM from 'fp-ts/ReadonlyMap'

import { RefDisposable } from './RefDisposable'
import { WeakRefMap } from './WeakRefMap'

const INITIAL_HOOK_INDEX = 0

const HookIndex = Ref.create(E.of(INITIAL_HOOK_INDEX), Symbol('HookIndex'), alwaysEqualsEq)

const incrementIndex = HookIndex.update(flow(increment, E.of))

const getOrCreateHookRef = getOrCreate<Ref.Wrapped<any, any>>()(N.Eq, Symbol('HookRefs'))

// Get the next ID to use
export const getHookIndex = Do(function* (_) {
  const currentIndex = yield* _(HookIndex.get)

  yield* _(incrementIndex)

  return currentIndex
})

// Reset hook index to support re-rendering or similar workflows.
export const resetIndex = HookIndex.set(INITIAL_HOOK_INDEX)

// The basis for creating all other hooks-related functionality as it replaces the mechanism for
// generating a Ref's ID to being based on an index that leads to React's "rules of hooks" where order
// matters and they cannot be nested within other hooks without providing separate Ref environments.
export const useRef = <E, A>(
  initial: E.Env<E, A>,
  eq: Eq<A> = alwaysEqualsEq,
): E.Env<Ref.Refs, Ref.Wrapped<E, A>> =>
  Do(function* (_) {
    const index = yield* _(getHookIndex)

    return yield* _(getOrCreateHookRef(index, createHookRef(index, initial, eq)))
  })

// Creates a Reference which is scoped explicity to the environment in which it was created in.
const createHookRef = <E, A>(
  index: number,
  initial: E.Env<E, A>,
  eq: Eq<A>,
): E.Env<Ref.Refs, Ref.Wrapped<E, A>> => {
  return Do(function* (_) {
    const { getRef, hasRef, setRef, removeRef, refEvents } = yield* _(E.ask<Ref.Refs>())
    const refs: Ref.Refs = { getRef, hasRef, setRef, removeRef, refEvents }
    const ref = Ref.create(initial, Symbol(index), eq)

    return {
      id: ref.id,
      initial: ref.initial,
      equals: ref.equals,
      get: pipe(ref.get, E.useSome(refs)),
      has: pipe(ref.has, E.useSome(refs)),
      set: flow(ref.set, E.useSome(refs)),
      update: flow(ref.update, E.useSome(refs)),
      remove: pipe(ref.remove, E.useSome(refs)),
    }
  })
}

/**
 * Makes it possible to sample an Env<E, A> anytime there is an update/delete event
 * within a given Ref.Refs environment.
 */
export const withHooks = <E, A>(env: E.Env<E, A>): RS.ReaderStream<E & Ref.Refs, A> => {
  const main = flow(
    Do(function* (_) {
      yield* _(resetIndex)

      return yield* _(env)
    }),
    S.fromResume,
  )

  return pipe(
    RefDisposable.get,
    RS.fromEnv,
    RS.chainW((disposable) =>
      pipe(
        Ref.getRefEvents,
        RS.fromEnv,
        RS.chainStreamK((x) => x),
        RS.filter((x: Ref.Event<any, any>) => x._tag !== 'Created'),
        RS.withStream(S.startWith<unknown>(null)), // Ensure an initial sampling
        RS.chainW(() => RS.ask<E & Ref.Refs>()),
        RS.map(main),
        RS.withStream(flow(S.sampleLatest, S.onDispose(disposable), S.multicast)),
      ),
    ),
  )
}

/**
 * Helps to construct
 */
export const keyed =
  <K>(Eq: Eq<K> = deepEqualsEq) =>
  <V, E, A>(
    getKey: (value: V, index: number) => K,
    f: (value: V, refs: Ref.Refs, key: K) => E.Env<E, A>,
  ) =>
  (values: ReadonlyArray<V>): RS.ReaderStream<E & Ref.Refs, ReadonlyArray<A>> => {
    return pipe(
      Do(function* (_) {
        const ref = yield* _(useRef(E.fromIO(() => new WeakRefMap<K, Ref.Refs>())))
        const getOrCreateRefs = getOrCreate<Ref.Refs>()(Eq, ref.id)

        // TODO: Can/Should we create a Stream combinator which is capable of zipping together
        // a list of streams by ID without disposing/re-subscribing

        return yield* _(
          E.zipW(
            values.map((v, i) => {
              const k = getKey(v, i)

              return pipe(
                getOrCreateRefs(k, E.fromIO(Ref.refs)),
                E.map((e) => pipe(f(v, e, k), withHooks)),
              )
            }),
          ),
        )
      }),
      RS.fromEnv,
      RS.switchMapW(RS.combineAll),
    )
  }

function getOrCreate<B>() {
  return <A>(keyEq: Eq<A>, refId?: PropertyKey) => {
    const ref = Ref.create(
      E.fromIO(() => new Map<A, B>()),
      refId,
      alwaysEqualsEq,
    )

    const find = RM.lookup(keyEq)

    return <E>(key: A, orCreate: E.Env<E, B>) =>
      Do(function* (_) {
        const memoized = yield* _(ref.get)
        const memoed = pipe(memoized, find(key))

        if (O.isSome(memoed)) {
          return memoed.value
        }

        const created = yield* _(orCreate)

        memoized.set(key, created)

        return created
      })
  }
}
