import * as E from '@fp/Env'
import { alwaysEqualsEq, deepEqualsEq, Eq } from '@fp/Eq'
import { flow, increment, pipe } from '@fp/function'
import * as N from '@fp/number'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import * as RefDisposable from '@fp/RefDisposable'
import * as RefMap from '@fp/RefMap'
import * as S from '@fp/Stream'

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
    E.chainW((index) => HookRefs.getOrCreate(index, createHookRef(index, initial, eq))),
  )

// Creates a Reference which is scoped explicity to the environment in which it was created in.
const createHookRef = <E, A>(
  id: PropertyKey,
  initial: E.Env<E, A>,
  eq: Eq<A>,
): E.Env<Ref.Refs, Ref.Wrapped<E, A>> =>
  pipe(
    E.asks(
      ({ getRef, hasRef, setRef, removeRef, refEvents }: Ref.Refs): Ref.Refs => ({
        getRef,
        hasRef,
        setRef,
        removeRef,
        refEvents,
      }),
    ),
    E.map((refs) => pipe(Ref.create(initial, { eq, id }), Ref.useSome(refs))),
  )

/**
 * Makes it possible to sample an Env<E, A> anytime there is an update/delete event
 * within a given Ref.Refs environment.
 */
export const withHooks = <E, A>(main: E.Env<E, A>): RS.ReaderStream<E & Ref.Refs, A> =>
  pipe(
    E.Do,
    E.apSW('refEvents', Ref.getRefEvents),
    E.apSW('disposable', RefDisposable.get),
    RS.fromEnv,
    RS.chainW(({ refEvents, disposable }) =>
      pipe(
        refEvents,
        S.filter((x: Ref.Event<any, any>) => x._tag !== 'Created'),
        S.startWith<unknown>(null), // Ensure an initial sampling
        RS.fromStream,
        RS.sampleLatestEnv(
          pipe(
            resetIndex,
            E.chainW(() => main),
          ),
        ),
        RS.onDispose(disposable),
      ),
    ),
  )

/**
 * Helps to construct a stream graph from a list that all samples
 */
export const mergeMapWithHooks = <V>(Eq: Eq<V> = deepEqualsEq) => {
  const mergeMap = RS.mergeMapWhen(Eq)

  return <E1, A>(f: (value: V) => E.Env<E1 & Ref.Refs, A>) =>
    mergeMap(flow(f, withHooks, RS.useSomeWith(RS.fromIO(Ref.refs))))
}
