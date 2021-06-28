import * as E from '@fp/Env'
import { alwaysEqualsEq, deepEqualsEq, Eq } from '@fp/Eq'
import { flow, increment, pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import * as N from '@fp/number'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import * as S from '@fp/Stream'
import { EqStrict } from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import * as RM from 'fp-ts/ReadonlyMap'

import { RefDisposable } from './RefDisposable'
import { WeakRefMap } from './WeakRefMap'

const INITIAL_HOOK_INDEX = 0

const HookIndex = Ref.create(E.of(INITIAL_HOOK_INDEX), Symbol('HookIndex'), alwaysEqualsEq)

const incrementIndex = HookIndex.update(flow(increment, E.of))

const getOrCreateHookId = getOrCreate<symbol>()(N.Eq, Symbol('HookIds'))

const getOrCreateHookRef = getOrCreate<Ref.Wrapped<any, any>>()(
  EqStrict as Eq<symbol>,
  Symbol('HookRefs'),
)

// Get the next ID to use
export const getNextId = Do(function* (_) {
  const currentIndex = yield* _(HookIndex.get)
  const id = yield* _(
    getOrCreateHookId(
      currentIndex,
      E.fromIO(() => Symbol(currentIndex)),
    ),
  )

  yield* _(incrementIndex)

  return id
})

// Reset hook index to support re-rendering or similar workflows.
export const resetId = HookIndex.set(INITIAL_HOOK_INDEX)

// The basis for creating all other hooks-related functionality as it replaces the mechanism for
// generating a Ref's ID to being based on an index that leads to React's "rules of hooks" where order
// matters and they cannot be nested within other hooks without providing separate Ref environments.
export const useRef = <E, A>(
  initial: E.Env<E, A>,
  eq: Eq<A> = alwaysEqualsEq,
): E.Env<Ref.Refs, Ref.Wrapped<E, A>> =>
  Do(function* (_) {
    const id = yield* _(getNextId)

    return yield* _(getOrCreateHookRef(id, createHookRef(id, initial, eq)))
  })

// Creates a Reference which is scoped explicity to the environment in which it was created in.
const createHookRef = <E, A>(
  id: symbol,
  initial: E.Env<E, A>,
  eq: Eq<A>,
): E.Env<Ref.Refs, Ref.Wrapped<E, A>> => {
  return Do(function* (_) {
    const { getRef, hasRef, setRef, removeRef, refEvents } = yield* _(E.ask<Ref.Refs>())
    const refs: Ref.Refs = { getRef, hasRef, setRef, removeRef, refEvents }
    const ref = Ref.create(initial, id, eq)

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

export const withHooks = <E, A>(env: E.Env<E, A>): RS.ReaderStream<E & Ref.Refs, A> => {
  const main = Do(function* (_) {
    yield* _(resetId)

    return yield* _(env)
  })

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
        RS.map((e) => pipe(e, main, S.fromResume)),
        RS.withStream(flow(S.sampleLatest, S.onDispose(disposable), S.multicast)),
      ),
    ),
  )
}

export const keyed =
  <K>(Eq: Eq<K> = deepEqualsEq) =>
  <V, E, A>(getKey: (value: V) => K, f: (value: V, refs: Ref.Refs) => E.Env<E, A>) =>
  (values: ReadonlyArray<V>): RS.ReaderStream<E & Ref.Refs, ReadonlyArray<A>> => {
    return pipe(
      Do(function* (_) {
        const ref = yield* _(useRef(E.fromIO(() => new WeakRefMap<K, Ref.Refs>())))
        const getOrCreateRefs = getOrCreate<Ref.Refs>()(Eq, ref.id)
        const refs = yield* _(
          E.zipW(values.map((v) => getOrCreateRefs(getKey(v), E.fromIO(Ref.refs)))),
        )

        return values.map((v, i) => pipe(f(v, refs[i]), withHooks))
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
