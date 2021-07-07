import * as H from '@fp/Env'
import { alwaysEqualsEq, Eq } from '@fp/Eq'
import { flow, increment, pipe } from '@fp/function'
import * as N from '@fp/number'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import * as RefDisposable from '@fp/RefDisposable'
import * as RefMap from '@fp/RefMap'
import * as RefMapM from '@fp/RefMapM'
import * as S from '@fp/Stream'
import { not } from 'fp-ts/Refinement'

const INITIAL_HOOK_INDEX = 0

const HookIndex = Ref.create(H.of(INITIAL_HOOK_INDEX), {
  id: Symbol('HookIndex'),
  eq: alwaysEqualsEq,
})

const incrementIndex = HookIndex.update(flow(increment, H.of))

const HookRefs = RefMap.create(
  H.fromIO(() => new Map<number, Ref.Wrapped<any, any>>()),
  {
    id: Symbol('HookRefs'),
    keyEq: N.Eq,
    eq: alwaysEqualsEq,
  },
)

const HookRefMaps = RefMapM.create(
  H.fromIO(() => new Map<number, RefMap.Wrapped<any, any, any>>()),
  {
    id: Symbol('HookRefMaps'),
    keyEq: N.Eq,
    eq: alwaysEqualsEq,
  },
)

// Get the next ID to use
export const getHookIndex = pipe(
  HookIndex.get,
  H.chainFirst(() => incrementIndex),
)

// Reset hook index to support re-rendering or similar workflows.
export const resetIndex = HookIndex.set(INITIAL_HOOK_INDEX)

// The basis for creating all other hooks-related functionality as it replaces the mechanism for
// generating a Ref's ID to being based on an index that leads to React's "rules of hooks" where order
// matters and they cannot be nested within other hooks without providing separate Ref environments.
export const useRef = <E, A>(
  initial: H.Env<E, A>,
  eq: Eq<A> = alwaysEqualsEq,
): H.Env<Ref.Refs, Ref.Wrapped<E, A>> =>
  pipe(
    getHookIndex,
    H.chainW((index) =>
      HookRefs.getOrCreate(index, createHookRef(initial, { eq, id: Symbol(index) })),
    ),
  )

export const useRefMap = <E, K, V>(
  initial: H.Env<E, ReadonlyMap<K, V>>,
  options: Omit<RefMap.RefMapOptions<K, V>, 'id'> = {},
): H.Env<Ref.Refs, RefMap.Wrapped<E, K, V>> =>
  pipe(
    getHookIndex,
    H.chainW((index) =>
      HookRefMaps.getOrCreate(index, createHookRefMap(initial, { ...options, id: Symbol(index) })),
    ),
  )

const getRefsStrict = H.asks(
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
  initial: H.Env<E, A>,
  options: Ref.RefOptions<A>,
): H.Env<Ref.Refs, Ref.Wrapped<E, A>> =>
  pipe(
    getRefsStrict,
    H.map((refs) => pipe(Ref.create(initial, options), Ref.useSome(refs))),
  )

const createHookRefMap = <E, K, V>(
  initial: H.Env<E, ReadonlyMap<K, V>>,
  options: RefMap.RefMapOptions<K, V>,
): H.Env<Ref.Refs, RefMap.Wrapped<E, K, V>> =>
  pipe(
    getRefsStrict,
    H.map((refs) => pipe(RefMap.create(initial, options), RefMap.useSome(refs))),
  )

const notIsCreated = not(Ref.isCreated)

/**
 * Makes it possible to sample an Env<E, A> anytime there is an update/delete event
 * within a given Ref.Refs environment.
 */
export const withHooks = <E, A>(main: H.Env<E, A>): RS.ReaderStream<E & Ref.Refs, A> =>
  pipe(
    H.Do,
    H.apSW(
      'refEvents',
      H.asks((e: Ref.Events) => e.refEvents[1]),
    ),
    H.apSW('refDisposable', RefDisposable.get),
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
            H.chainW(() => main),
          ),
        ),
        RS.onDispose(refDisposable),
      ),
    ),
  )
