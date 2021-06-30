import * as E from '@fp/Env'
import { alwaysEqualsEq, deepEqualsEq, Eq } from '@fp/Eq'
import { flow, increment, pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import * as N from '@fp/number'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import * as RefDisposable from '@fp/RefDisposable'
import * as S from '@fp/Stream'
import { WeakRefMap } from '@fp/WeakRefMap'
import * as O from 'fp-ts/Option'
import * as RM from 'fp-ts/ReadonlyMap'

const INITIAL_HOOK_INDEX = 0

const HookIndex = Ref.create(E.of(INITIAL_HOOK_INDEX), Symbol('HookIndex'), alwaysEqualsEq)

const incrementIndex = HookIndex.update(flow(increment, E.of))

const getOrCreateHookRef = getOrCreate<Ref.Wrapped<any, any>>()(
  N.Eq,
  Ref.create(
    E.fromIO(() => new Map()),
    Symbol('HookRefs'),
  ),
)

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

export const getRefEvents: RS.ReaderStream<Ref.Refs, Ref.Event<any, any>> = (e: Ref.Refs) =>
  e.refEvents[1]

/**
 * Makes it possible to sample an Env<E, A> anytime there is an update/delete event
 * within a given Ref.Refs environment.
 */
export const withHooks = <E, A>(main: E.Env<E, A>): RS.ReaderStream<E & Ref.Refs, A> =>
  pipe(
    getRefEvents,
    RS.filter((x: Ref.Event<any, any>) => x._tag !== 'Created'),
    RS.startWith<unknown>(null), // Ensure an initial sampling
    RS.sampleLatestEnv(
      Do(function* (_) {
        // Ensure HookIndex is reset upon each invocation
        yield* _(resetIndex)

        return yield* _(main)
      }),
    ),
  )

const HookRefs = Ref.create(E.fromIO(() => new WeakRefMap<any, Ref.Refs>()))
const getOrCreateRefs = getOrCreate<Ref.Refs>()

/**
 * Helps to construct
 */
export const mergeMapWithHooks = <V>(Eq: Eq<V> = deepEqualsEq) => {
  const getOrCreate = getOrCreateRefs(Eq, HookRefs)
  const getRefs = (value: V) => getOrCreate(value, E.fromIO(Ref.refs))
  const mergeMap = RS.mergeMapWhen(Eq)

  return <E1, A>(f: (value: V) => E.Env<E1 & Ref.Refs, A>) =>
    <E2>(
      values: RS.ReaderStream<E2, ReadonlyArray<V>>,
    ): RS.ReaderStream<E1 & E2 & Ref.Refs, ReadonlyArray<A>> => {
      return pipe(
        values,
        mergeMap((value) =>
          pipe(
            RS.Do,
            RS.bindW('refs', () => pipe(value, getRefs, RS.fromEnv)),
            RS.bindW('disposable', ({ refs }) =>
              pipe(RefDisposable.get, E.useSome(refs), RS.fromEnv),
            ),
            RS.chainW(({ refs, disposable }) =>
              pipe(value, f, withHooks, RS.useSome(refs), RS.withStream(S.onDispose(disposable))),
            ),
          ),
        ),
      )
    }
}

function getOrCreate<B>() {
  return <A, E, C extends Map<A, B>>(keyEq: Eq<A>, ref: Ref.Wrapped<E, C>) => {
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
