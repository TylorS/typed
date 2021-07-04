import * as E from '@fp/Env'
import { alwaysEqualsEq, deepEqualsEq, Eq } from '@fp/Eq'
import { flow, identity, increment, pipe } from '@fp/function'
import * as N from '@fp/number'
import * as O from '@fp/Option'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import * as RefDisposable from '@fp/RefDisposable'
import * as RefMap from '@fp/RefMap'
import * as RefMapM from '@fp/RefMapM'
import * as S from '@fp/Stream'
import * as RM from 'fp-ts/ReadonlyMap'
import { not } from 'fp-ts/Refinement'

const INITIAL_HOOK_INDEX = 0

const HookIndex = Ref.create(E.of(INITIAL_HOOK_INDEX), {
  id: Symbol('HookIndex'),
  eq: alwaysEqualsEq,
})

const incrementIndex = HookIndex.update(flow(increment, E.of))

const HookRefs = RefMap.create(
  E.fromIO(() => new Map<number, Ref.Wrapped<any, any>>()),
  {
    id: Symbol('HookRefs'),
    keyEq: N.Eq,
    eq: alwaysEqualsEq,
  },
)

const HookRefMaps = RefMapM.create(
  E.fromIO(() => new Map<number, RefMap.Wrapped<any, any, any>>()),
  {
    id: Symbol('HookRefMaps'),
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
      HookRefMaps.getOrCreate(index, createHookRefMap(initial, { ...options, id: Symbol(index) })),
    ),
  )

const getRefsStrict = E.asks(
  ({ getRef, hasRef, setRef, removeRef, refEvents }: Ref.Refs): Ref.Refs => ({
    getRef,
    hasRef,
    setRef,
    removeRef,
    refEvents,
  }),
)

// Creates a Reference which is scoped explicity to the environment in which it was created in.
const createHookRef = <E, A>(
  initial: E.Env<E, A>,
  options: Ref.RefOptions<A>,
): E.Env<Ref.Refs, Ref.Wrapped<E, A>> =>
  pipe(
    getRefsStrict,
    E.map((refs) => pipe(Ref.create(initial, options), Ref.useSome(refs))),
  )

const createHookRefMap = <E, K, V>(
  initial: E.Env<E, ReadonlyMap<K, V>>,
  options: RefMap.RefMapOptions<K, V>,
): E.Env<Ref.Refs, RefMap.Wrapped<E, K, V>> =>
  pipe(
    getRefsStrict,
    E.map((refs) => pipe(RefMap.create(initial, options), RefMap.useSome(refs))),
  )

const notIsCreated = not(
  (x: Ref.Event<any, any>): x is Ref.Created<any, any> => x._tag == 'Created',
)

/**
 * Makes it possible to sample an Env<E, A> anytime there is an update/delete event
 * within a given Ref.Refs environment.
 */
export const withHooks = <E, A>(main: E.Env<E, A>): RS.ReaderStream<E & Ref.Refs, A> =>
  pipe(
    E.Do,
    E.apSW(
      'refEvents',
      E.asks((e: Ref.Events) => e.refEvents[1]),
    ),
    E.apSW('refDisposable', RefDisposable.get),
    RS.fromEnv,
    RS.chainW(({ refEvents, refDisposable }) =>
      pipe(
        refEvents,
        S.filter(notIsCreated),
        S.startWith<unknown>(null), // Ensure an initial sampling
        RS.fromStream,
        RS.sampleLatestEnv(
          pipe(
            resetIndex,
            E.chainW(() => main),
          ),
        ),
        RS.onDispose(refDisposable),
      ),
    ),
  )

// Keeps track of a mutable set of References
const useHooksReferences = <V>(Eq: Eq<V>) => {
  const find = RM.lookup(Eq)

  return pipe(
    E.Do,
    E.bindW('ref', () => useRef(E.fromIO(() => new Map<V, Ref.Refs>()))),
    E.bindW('references', ({ ref }) => ref.get),
    E.bindW('findRefs', ({ references }) =>
      E.of((value: V) =>
        pipe(
          references,
          find(value),
          O.matchW(() => {
            const refs = Ref.refs()

            references.set(value, refs)

            return refs
          }, identity),
        ),
      ),
    ),
    E.bindW('deleteRefs', ({ references }) =>
      E.of(
        (value: V): S.Disposable => ({
          dispose: () => {
            references.forEach((_, k) => {
              if (Eq.equals(k)(value)) {
                references.delete(k)
              }
            })
          },
        }),
      ),
    ),
  )
}

/**
 * Helps to construct a stream graph from a list that all samples the provided Env-returning
 * function when a new value is seen, providing each with a unique Ref.Refs environment.
 */
export const mergeMapWithHooks = <V>(Eq: Eq<V> = deepEqualsEq) => {
  const mergeMap = RS.mergeMapWhen(Eq)
  const useRefs = RS.fromEnv(useHooksReferences(Eq))

  return <E1, A>(f: (value: V) => E.Env<E1 & Ref.Refs, A>) =>
    <E2>(
      rs: RS.ReaderStream<E2, ReadonlyArray<V>>,
    ): RS.ReaderStream<E1 & E2 & Ref.Refs, ReadonlyArray<A>> =>
      pipe(
        useRefs,
        RS.chainW(({ findRefs, deleteRefs }) =>
          pipe(
            rs,
            mergeMap((v) =>
              pipe(v, f, withHooks, RS.useSome(findRefs(v)), RS.onDispose(deleteRefs(v))),
            ),
          ),
        ),
      )
}
