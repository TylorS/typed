import * as E from '@fp/Env'
import { alwaysEqualsEq, deepEqualsEq, Eq } from '@fp/Eq'
import { flow, increment, pipe } from '@fp/function'
import * as N from '@fp/number'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import * as RefArray from '@fp/RefArray'
import * as RefDisposable from '@fp/RefDisposable'
import * as RefMap from '@fp/RefMap'
import * as RefMapM from '@fp/RefMapM'
import * as S from '@fp/Stream'
import { EqStrict, tuple } from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import { not } from 'fp-ts/Predicate'
import * as RM from 'fp-ts/ReadonlyMap'

const INITIAL_HOOK_INDEX = 0

const HookIndex = Ref.create(E.of(INITIAL_HOOK_INDEX), {
  id: Symbol('HookIndex'),
  eq: alwaysEqualsEq,
})

const incrementIndex = HookIndex.update(flow(increment, E.of))

const HookRefs = RefMapM.create(
  E.fromIO(() => new Map<number, any>()),
  {
    id: Symbol('HookRefs'),
    keyEq: N.Eq,
    eq: alwaysEqualsEq,
  },
)

// Get the next ID to use
export const getHookIndex = pipe(
  HookIndex.get,
  E.chainFirst(() => incrementIndex),
)

// Reset hook index to support re-rendering or similar workflows.
export const resetIndex = HookIndex.set(INITIAL_HOOK_INDEX)

// The basis for creating all other hooks-related functionality as it replaces the mechanism for
// generating a Ref's ID to being based on an index that leads to React's "rules of hooks" where order
// matters and they cannot be nested within other hooks without providing separate Ref environments.
export const useRef = <E, A>(
  initial: E.Env<E, A>,
  eq: Eq<A> = alwaysEqualsEq,
): E.Env<Ref.Refs, Ref.Wrapped<E, A>> =>
  pipe(
    getHookIndex,
    E.chainW((index) =>
      HookRefs.getOrCreate(index, createHookRef(initial, { eq, id: Symbol(index) })),
    ),
  )

export const useRefMap = <E, K, V>(
  initial: E.Env<E, ReadonlyMap<K, V>>,
  options: Omit<RefMap.RefMapOptions<K, V>, 'id'> = {},
): E.Env<Ref.Refs, RefMap.Wrapped<E, K, V>> =>
  pipe(
    getHookIndex,
    E.chainW((index) =>
      HookRefs.getOrCreate(index, createHookRefMap(initial, { ...options, id: Symbol(index) })),
    ),
  )

export const useRefMapM = <E, K, V>(
  initial: E.Env<E, Map<K, V>>,
  options: Omit<RefMapM.RefMapMOptions<K, V>, 'id'> = {},
): E.Env<Ref.Refs, RefMapM.Wrapped<E, K, V>> =>
  pipe(
    getHookIndex,
    E.chainW((index) =>
      HookRefs.getOrCreate(index, createHookRefMapM(initial, { ...options, id: Symbol(index) })),
    ),
  )

export const useRefArray = <E, A>(
  initial: E.Env<E, ReadonlyArray<A>>,
  options: RefArray.RefArrayOptions<A>,
): E.Env<Ref.Refs, RefArray.Wrapped<E, A>> =>
  pipe(
    getHookIndex,
    E.chainW((index) =>
      HookRefs.getOrCreate(index, createHookRefArray(initial, { ...options, id: Symbol(index) })),
    ),
  )

// Creates a Reference which is scoped explicity to the environment in which it was created in.
const createHookRef = <E, A>(
  initial: E.Env<E, A>,
  options: Ref.RefOptions<A>,
): E.Env<Ref.Refs, Ref.Wrapped<E, A>> =>
  pipe(
    Ref.getRefs,
    E.map((refs) => pipe(Ref.create(initial, options), Ref.useSome(refs))),
  )

const createHookRefMap = <E, K, V>(
  initial: E.Env<E, ReadonlyMap<K, V>>,
  options: RefMap.RefMapOptions<K, V>,
): E.Env<Ref.Refs, RefMap.Wrapped<E, K, V>> =>
  pipe(
    Ref.getRefs,
    E.map((refs) => pipe(RefMap.create(initial, options), RefMap.useSome(refs))),
  )

const createHookRefMapM = <E, K, V>(
  initial: E.Env<E, Map<K, V>>,
  options: RefMapM.RefMapMOptions<K, V>,
): E.Env<Ref.Refs, RefMapM.Wrapped<E, K, V>> =>
  pipe(
    Ref.getRefs,
    E.map((refs) => pipe(RefMapM.create(initial, options), RefMapM.useSome(refs))),
  )

const createHookRefArray = <E, A>(
  initial: E.Env<E, ReadonlyArray<A>>,
  options: RefArray.RefArrayOptions<A>,
): E.Env<Ref.Refs, RefArray.Wrapped<E, A>> =>
  pipe(
    Ref.getRefs,
    E.map((refs) => pipe(RefArray.create(initial, options), RefArray.useSome(refs))),
  )

export const withHooks =
  <A>(Eq: Eq<A> = deepEqualsEq) =>
  <E1, B>(f: (value: A) => Ref.Env<E1, B>) =>
  <E2>(rs: RS.ReaderStream<E2, A>): RS.ReaderStream<E1 & E2 & Ref.Refs, B> =>
    pipe(
      RefDisposable.get,
      RS.fromEnv,
      RS.switchMapW((refDisposable) =>
        pipe(
          rs,
          // Allows skipping "props" updates
          RS.skipRepeatsWith(Eq),
          // Ensure we sample when internal state has been updated
          RS.chainFirstW(() =>
            pipe(Ref.getRefEvents, RS.filter(not(Ref.isCreated)), RS.startWith(null)),
          ),
          RS.exhaustMapLatestEnv((a) =>
            pipe(
              // Reset Hook Index on each invocation
              resetIndex,
              E.chainW(() => f(a)),
            ),
          ),
          // Cleanup when we're all finished
          RS.onDispose(refDisposable),
        ),
      ),
    )

export const useHooksArray =
  <A>(keyEq: Eq<A> = deepEqualsEq, valueEq: Eq<A> = keyEq) =>
  <E1, B>(f: (value: A) => Ref.Env<E1, B>) => {
    const keyed = S.keyed(keyEq)
    const withHooksF = withHooks(valueEq)(f)
    const mergeEq = tuple(
      EqStrict as Eq<S.Stream<A>>,
      EqStrict as Eq<Ref.Refs>,
      // We don't want these to unsubscribe/resubscribe if these change
      alwaysEqualsEq as Eq<S.Disposable>,
      alwaysEqualsEq as Eq<E1>,
    )
    const mergeMap = S.mergeMapWhen(mergeEq)(([s, refs, d, e1]) =>
      pipe(s, RS.fromStream, withHooksF, RS.onDispose(d))({ ...e1, ...refs }),
    )

    return <E2>(
        rs: RS.ReaderStream<E2, readonly A[]>,
      ): RS.ReaderStream<E1 & E2 & Ref.Refs, readonly B[]> =>
      (e) =>
        pipe(
          useKeyedRefs(EqStrict as Eq<S.Stream<A>>),
          RS.fromEnv,
          RS.chainStreamK(({ findRefs, deleteRefs }) =>
            pipe(
              e,
              rs,
              keyed,
              S.map((streams) => streams.map((s) => [s, findRefs(s), deleteRefs(s), e] as const)),
              mergeMap,
            ),
          ),
        )(e)
  }

// Always do an initial sampling of Envs
// Separate each Env with separate Refs
// Discard previously created resources when no longer needed
// Sample an Env everytime there's a Ref Event
// Sample an Env each time there values update

// Keeps track of a mutable set of References. Useful for building combinators for higher-order hooks.
export const useKeyedRefs = <K>(Eq: Eq<K>) => {
  const find = RM.lookup(Eq)

  return pipe(
    E.Do,
    E.bindW('parentRefs', () => Ref.getRefs),
    E.bindW('ref', () => useRef(E.fromIO(() => new Map<K, Ref.Refs>()))),
    E.bindW('references', ({ ref }) => ref.get),
    E.bindW('findRefs', ({ references, parentRefs }) =>
      E.of((key: K) =>
        pipe(
          references,
          find(key),
          O.getOrElseW(() => {
            const refs = Ref.refs({ parentRefs })

            references.set(key, refs)

            return refs
          }),
        ),
      ),
    ),
    E.bindW('deleteRefs', ({ references }) =>
      E.of(
        (key: K): S.Disposable => ({
          dispose: () => {
            references.forEach((_, k) => {
              if (Eq.equals(k)(key)) {
                references.delete(k)
              }
            })
          },
        }),
      ),
    ),
    E.map(({ findRefs, deleteRefs }) => ({ findRefs, deleteRefs } as const)),
  )
}
